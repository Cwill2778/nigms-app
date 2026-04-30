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
  const {
    data: { session },
  } = await supabase.auth.getSession();
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

  const [
    profileResult,
    addressesResult,
    workOrdersResult,
    paymentsResult,
    messagesResult,
    picturesResult,
    propertiesResult,
    subscriptionsResult,
  ] = await Promise.all([
    db.from('users').select('*').eq('id', id).single(),
    db
      .from('client_addresses')
      .select('*')
      .eq('client_id', id)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true }),
    db
      .from('work_orders')
      .select('*')
      .eq('client_id', id)
      .order('created_at', { ascending: false }),
    db
      .from('payments')
      .select('*')
      .eq('client_id', id)
      .order('created_at', { ascending: false }),
    db
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${id},recipient_id.eq.${id}`)
      .order('created_at', { ascending: true }),
    db
      .from('work_order_pictures')
      .select('*')
      .eq('client_id', id)
      .order('uploaded_at', { ascending: false }),
    db
      .from('properties')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: true }),
    db
      .from('subscriptions')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false }),
  ]);

  if (profileResult.error) {
    return NextResponse.json({ error: profileResult.error.message }, { status: 500 });
  }

  if (!profileResult.data) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  return NextResponse.json({
    profile: profileResult.data,
    addresses: addressesResult.data ?? [],
    workOrders: workOrdersResult.data ?? [],
    payments: paymentsResult.data ?? [],
    messages: messagesResult.data ?? [],
    pictures: picturesResult.data ?? [],
    properties: propertiesResult.data ?? [],
    subscriptions: subscriptionsResult.data ?? [],
  });
}
