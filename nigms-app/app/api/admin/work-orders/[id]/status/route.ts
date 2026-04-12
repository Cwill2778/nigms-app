import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabase';
import { sendWorkOrderStatusEmail } from '@/lib/email';
import type { WorkOrderStatus } from '@/lib/types';

const VALID_STATUSES: WorkOrderStatus[] = ['pending', 'in_progress', 'completed', 'cancelled'];

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
  return profile?.role === 'admin';
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { status } = body as { status?: WorkOrderStatus };

  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const serviceClient = getServiceRoleClient();

  // Update work order status
  const { data: workOrder, error: updateError } = await serviceClient
    .from('work_orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (updateError || !workOrder) {
    return NextResponse.json(
      { error: updateError?.message ?? 'Work order not found' },
      { status: updateError ? 500 : 404 }
    );
  }

  // Fetch client email for notification
  const { data: authData } = await serviceClient.auth.admin.getUserById(workOrder.client_id);
  const clientEmail = authData?.user?.email;

  if (clientEmail) {
    await sendWorkOrderStatusEmail(
      { email: clientEmail },
      { title: workOrder.title, status: workOrder.status }
    );
  }

  return NextResponse.json(workOrder);
}
