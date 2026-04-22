import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabase';
import type { MaterialsPaidBy } from '@/lib/types';

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

  const { id: workOrderId } = await params;
  const db = getServiceRoleClient();

  const body = await request.json();
  const {
    materials_cost,
    materials_paid_by,
    client_materials_cost,
    labor_cost,
    total_billed,
  } = body as {
    materials_cost: number;
    materials_paid_by: MaterialsPaidBy;
    client_materials_cost: number;
    labor_cost: number;
    total_billed: number;
  };

  // Get the work order to find client_id
  const { data: workOrder, error: woError } = await db
    .from('work_orders')
    .select('client_id')
    .eq('id', workOrderId)
    .single();

  if (woError || !workOrder) {
    return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
  }

  const clientId: string = workOrder.client_id;

  // Generate receipt number: RCT-{YYYY}-{NNNN}
  const year = new Date().getFullYear();
  const prefix = `RCT-${year}-`;

  const { count } = await db
    .from('bills')
    .select('*', { count: 'exact', head: true });

  const seq = (count ?? 0) + 1;
  const receiptNumber = `${prefix}${String(seq).padStart(4, '0')}`;

  const { data: bill, error } = await db
    .from('bills')
    .insert({
      work_order_id: workOrderId,
      client_id: clientId,
      receipt_number: receiptNumber,
      materials_cost,
      materials_paid_by,
      client_materials_cost,
      labor_cost,
      total_billed,
      amount_paid: 0,
    })
    .select()
    .single();

  if (error || !bill) {
    return NextResponse.json(
      { error: error?.message ?? 'Failed to create bill' },
      { status: 500 }
    );
  }

  return NextResponse.json(bill);
}
