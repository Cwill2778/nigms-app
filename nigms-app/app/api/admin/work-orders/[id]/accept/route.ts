import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabase';
import { notifyClient } from '@/lib/notifications';

/**
 * POST /api/admin/work-orders/[id]/accept
 *   Requires admin authentication
 *   Sets status='accepted', accepted_at=now()
 *   Writes audit log: { action: 'accepted', actor_role: 'admin' }
 *   Notifies client via in-app notification
 *
 * Requirements: 9.2, 9.7
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
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
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

  const { data: workOrder, error } = await db
    .from('work_orders')
    .update({
      status: 'accepted',
      accepted_at: now,
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

  const wo = existing as { id: string; client_id: string; status: string; wo_number: string | null; title: string };

  // Write audit log entry (Requirement 9.7)
  await db.from('audit_log').insert({
    entity_type: 'work_order',
    entity_id: id,
    action: 'accepted',
    actor_id: admin.userId,
    actor_role: 'admin',
    changes: {
      old_status: wo.status,
      new_status: 'accepted',
      accepted_at: now,
    },
  });

  // Notify client via in-app notification + email (Requirement 9.2, 11.2)
  await notifyClient(wo.client_id, 'work_order_accepted', {
    title: wo.title,
    wo_number: wo.wo_number ?? id,
    work_order_id: id,
  }).catch((err) => console.error('[accept] notifyClient failed', err));

  return NextResponse.json(workOrder);
}
