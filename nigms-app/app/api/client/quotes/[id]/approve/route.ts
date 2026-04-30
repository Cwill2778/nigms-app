import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabase';
import { notifyAdmin } from '@/lib/notifications';

/**
 * POST /api/client/quotes/[id]/approve
 *   Requires client authentication
 *   Verifies quote belongs to authenticated client
 *   Sets quotes.approved_at = now()
 *   Updates work order status to 'accepted'
 *   Writes audit log entry
 *   Notifies admin
 *
 * Requirements: 9.4, 7.6, 9.7
 */

function getServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: quoteId } = await params;
  const db = getServiceRoleClient();

  // Fetch quote and verify it belongs to the authenticated client
  const { data: quote, error: fetchError } = await db
    .from('quotes')
    .select('id, work_order_id, client_id, estimate_number, approved_at')
    .eq('id', quoteId)
    .single();

  if (fetchError || !quote) {
    return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
  }

  const q = quote as {
    id: string;
    work_order_id: string;
    client_id: string;
    estimate_number: string;
    approved_at: string | null;
  };

  if (q.client_id !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (q.approved_at) {
    return NextResponse.json({ error: 'Quote has already been approved' }, { status: 409 });
  }

  const now = new Date().toISOString();

  // Set approved_at on the quote
  const { data: updatedQuote, error: quoteUpdateError } = await db
    .from('quotes')
    .update({ approved_at: now, updated_at: now })
    .eq('id', quoteId)
    .select()
    .single();

  if (quoteUpdateError || !updatedQuote) {
    return NextResponse.json(
      { error: quoteUpdateError?.message ?? 'Failed to approve quote' },
      { status: 500 }
    );
  }

  // Update work order status to 'accepted'
  await db
    .from('work_orders')
    .update({ status: 'accepted', accepted_at: now, updated_at: now })
    .eq('id', q.work_order_id);

  // Get actor role for audit log
  const { data: profile } = await db
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();
  const actorRole = (profile as { role: string } | null)?.role ?? 'client';

  // Write audit log entry (Requirement 9.7)
  await db.from('audit_log').insert({
    entity_type: 'work_order',
    entity_id: q.work_order_id,
    action: 'quote_approved',
    actor_id: session.user.id,
    actor_role: actorRole,
    changes: {
      quote_id: quoteId,
      estimate_number: q.estimate_number,
      approved_at: now,
      work_order_status: 'accepted',
    },
  });

  // Notify admin that client approved the quote via in-app + email (Requirement 11.1)
  await notifyAdmin('quote_approved', {
    estimate_number: q.estimate_number,
    work_order_id: q.work_order_id,
    title: `Work Order ${q.work_order_id}`,
  }).catch((err) => console.error('[approve] notifyAdmin failed', err));

  return NextResponse.json({ quote: updatedQuote });
}
