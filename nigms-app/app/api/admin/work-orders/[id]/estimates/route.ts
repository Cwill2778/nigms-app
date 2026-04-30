import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabase';
import type { QuoteLineItem } from '@/lib/types';
import { notifyClient } from '@/lib/notifications';

/**
 * POST /api/admin/work-orders/[id]/estimates
 *   Requires admin authentication
 *   Body: { line_items: QuoteLineItem[], total_amount: number, notes?: string }
 *   Generates estimate_number in format EST-YYYYMMDD-XXXX
 *   Creates quote record in quotes table
 *   Writes audit log entry
 *   Notifies client to review
 *
 * Requirements: 9.4, 9.7
 */

function getServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function getAdminSession(): Promise<{ userId: string } | null> {
  const supabase = await createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();
  if ((profile as { role: string } | null)?.role !== 'admin') return null;
  return { userId: session.user.id };
}

/** Generate an estimate number in format EST-YYYYMMDD-XXXX */
function generateEstimateNumber(): string {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `EST-${datePart}-${rand}`;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id: workOrderId } = await params;
  const db = getServiceRoleClient();

  let body: { line_items?: QuoteLineItem[]; total_amount?: number; notes?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { line_items, notes, total_amount } = body;

  if (!line_items || !Array.isArray(line_items)) {
    return NextResponse.json({ error: 'line_items is required' }, { status: 400 });
  }
  if (total_amount === undefined || total_amount === null) {
    return NextResponse.json({ error: 'total_amount is required' }, { status: 400 });
  }

  // Get the work order to find client_id and title
  const { data: workOrder, error: woError } = await db
    .from('work_orders')
    .select('client_id, title, wo_number')
    .eq('id', workOrderId)
    .single();

  if (woError || !workOrder) {
    return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
  }

  const wo = workOrder as { client_id: string; title: string; wo_number: string | null };
  const estimateNumber = generateEstimateNumber();

  // Check if a quote already exists for this work order (upsert pattern)
  const { data: existingQuote } = await db
    .from('quotes')
    .select('id')
    .eq('work_order_id', workOrderId)
    .maybeSingle();

  let quote;
  let quoteError;

  if (existingQuote) {
    // Update existing quote
    ({ data: quote, error: quoteError } = await db
      .from('quotes')
      .update({
        line_items,
        notes: notes ?? null,
        total_amount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', (existingQuote as { id: string }).id)
      .select()
      .single());
  } else {
    // Insert new quote
    ({ data: quote, error: quoteError } = await db
      .from('quotes')
      .insert({
        work_order_id: workOrderId,
        client_id: wo.client_id,
        estimate_number: estimateNumber,
        line_items,
        notes: notes ?? null,
        total_amount,
      })
      .select()
      .single());
  }

  if (quoteError || !quote) {
    return NextResponse.json(
      { error: quoteError?.message ?? 'Failed to save quote' },
      { status: 500 }
    );
  }

  const q = quote as { id: string; estimate_number: string };

  // Write audit log entry (Requirement 9.7)
  await db.from('audit_log').insert({
    entity_type: 'work_order',
    entity_id: workOrderId,
    action: existingQuote ? 'quote_updated' : 'quote_created',
    actor_id: admin.userId,
    actor_role: 'admin',
    changes: {
      quote_id: q.id,
      estimate_number: q.estimate_number,
      total_amount,
    },
  });

  // Notify client to review the quote via in-app + email (Requirement 9.4, 11.2)
  await notifyClient(wo.client_id, 'quote_generated', {
    title: wo.title,
    wo_number: wo.wo_number ?? workOrderId,
    work_order_id: workOrderId,
    estimate_number: q.estimate_number,
    total_amount,
  }).catch((err) => console.error('[estimates] notifyClient failed', err));

  return NextResponse.json(quote, { status: existingQuote ? 200 : 201 });
}
