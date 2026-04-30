import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabase';
import { notifyClient } from '@/lib/notifications';

/**
 * POST /api/admin/work-orders/[id]/reject
 *   Requires admin authentication
 *   Body: { reason: string }
 *   Sets status='cancelled', inspection_notes=reason
 *   Writes audit log: { action: 'rejected', actor_role: 'admin', changes: { reason } }
 *   Notifies client with reason via in-app notification
 *
 * Requirements: 9.3, 9.7
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  let body: { reason?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { reason } = body;
  if (!reason || reason.trim() === '') {
    return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
  }

  const db = getServiceRoleClient();

  // Fetch current work order to get client_id and current status
  const { data: existing, error: fetchError } = await db
    .from('work_orders')
    .select('id, client_id, status, wo_number, title')
    .eq('id', id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
  }

  const now = new Date().toISOString();
  const wo = existing as { id: string; client_id: string; status: string; wo_number: string | null; title: string };

  const { data: workOrder, error } = await db
    .from('work_orders')
    .update({
      status: 'cancelled',
      inspection_notes: reason.trim(),
      updated_at: now,
    })
    .eq('id', id)
    .select()
    .single();

  if (error || !workOrder) {
    return NextResponse.json(
      { error: error?.message ?? 'Failed to update work order' },
      { status: 500 }
    );
  }

  // Write audit log entry (Requirement 9.7)
  await db.from('audit_log').insert({
    entity_type: 'work_order',
    entity_id: id,
    action: 'rejected',
    actor_id: admin.userId,
    actor_role: 'admin',
    changes: {
      old_status: wo.status,
      new_status: 'cancelled',
      reason: reason.trim(),
    },
  });

  // Notify client with rejection reason via in-app + email (Requirement 9.3, 11.2)
  await notifyClient(wo.client_id, 'work_order_rejected', {
    title: wo.title,
    wo_number: wo.wo_number ?? id,
    work_order_id: id,
    reason: reason.trim(),
  }).catch((err) => console.error('[reject] notifyClient failed', err));

  return NextResponse.json(workOrder);
}
