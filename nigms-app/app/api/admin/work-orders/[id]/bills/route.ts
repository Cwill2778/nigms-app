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
  return (profile as { role: string } | null)?.role === 'admin';
}

/**
 * POST /api/admin/work-orders/[id]/bills
 *
 * Creates an invoice record with materials and labor costs.
 * Inserts into the `invoices` table (not the legacy `bills` table).
 *
 * Body: { materials_cost, materials_paid_by, client_materials_cost, labor_cost, total_billed }
 * Returns: created invoice record
 */
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

  // Validate required fields
  if (typeof materials_cost !== 'number') {
    return NextResponse.json({ error: 'materials_cost is required' }, { status: 400 });
  }
  if (!['company', 'client', 'both'].includes(materials_paid_by)) {
    return NextResponse.json(
      { error: 'materials_paid_by must be company, client, or both' },
      { status: 400 }
    );
  }
  if (typeof labor_cost !== 'number') {
    return NextResponse.json({ error: 'labor_cost is required' }, { status: 400 });
  }
  if (typeof total_billed !== 'number') {
    return NextResponse.json({ error: 'total_billed is required' }, { status: 400 });
  }

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

  // Generate receipt number via RPC to prevent race conditions
  const year = new Date().getFullYear();
  const { data: receiptNumberData, error: rctNumError } = await db.rpc('generate_receipt_number', {
    year_param: year,
  });

  if (rctNumError || !receiptNumberData) {
    return NextResponse.json(
      { error: rctNumError?.message ?? 'Failed to generate receipt number' },
      { status: 500 }
    );
  }

  const receiptNumber = receiptNumberData as string;

  // Insert into invoices table (not legacy bills table)
  const { data: invoice, error } = await db
    .from('invoices')
    .insert({
      work_order_id: workOrderId,
      client_id: clientId,
      receipt_number: receiptNumber,
      materials_cost,
      materials_paid_by,
      client_materials_cost: client_materials_cost ?? 0,
      labor_cost,
      total_billed,
      amount_paid: 0,
    })
    .select()
    .single();

  if (error || !invoice) {
    return NextResponse.json(
      { error: error?.message ?? 'Failed to create invoice' },
      { status: 500 }
    );
  }

  return NextResponse.json(invoice, { status: 201 });
}
