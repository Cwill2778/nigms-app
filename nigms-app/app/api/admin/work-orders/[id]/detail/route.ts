import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabase';

function getServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function verifyAdmin(): Promise<boolean> {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();
  return (profile as { role: string } | null)?.role === 'admin';
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const db = getServiceRoleClient();

  // Fetch work order first so we can get client_id
  const { data: workOrder, error: woError } = await db
    .from('work_orders')
    .select('*')
    .eq('id', id)
    .single();

  if (woError || !workOrder) {
    return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
  }

  // Fetch all related data in parallel
  const [
    estimateResult,
    billResult,
    changeOrdersResult,
    timeEntriesResult,
    clientResult,
    picturesResult,
  ] = await Promise.all([
    db.from('estimates').select('*').eq('work_order_id', id).maybeSingle(),
    db.from('bills').select('*').eq('work_order_id', id).maybeSingle(),
    db.from('change_orders').select('*').eq('work_order_id', id).order('created_at', { ascending: true }),
    db.from('time_entries').select('*').eq('work_order_id', id).order('started_at', { ascending: true }),
    db.from('users').select('*').eq('id', workOrder.client_id).single(),
    db.from('work_order_pictures').select('*').eq('work_order_id', id),
  ]);

  return NextResponse.json({
    workOrder,
    estimate: estimateResult.data ?? null,
    bill: billResult.data ?? null,
    changeOrders: changeOrdersResult.data ?? [],
    timeEntries: timeEntriesResult.data ?? [],
    client: clientResult.data ?? null,
    pictures: picturesResult.data ?? [],
  });
}
