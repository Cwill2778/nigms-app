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

/**
 * POST /api/admin/work-orders/[id]/materials
 *
 * Creates a new material record for the given work order.
 *
 * Body: { description, quantity, unit_cost, supplier?, receipt_url? }
 * Returns: created material record
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

  // Verify work order exists
  const { data: workOrder, error: woError } = await db
    .from('work_orders')
    .select('id')
    .eq('id', workOrderId)
    .single();

  if (woError || !workOrder) {
    return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
  }

  const body = await request.json();
  const { description, quantity, unit_cost, supplier, receipt_url } = body as {
    description: string;
    quantity: number;
    unit_cost: number;
    supplier?: string;
    receipt_url?: string;
  };

  // Validate required fields
  if (!description || typeof description !== 'string' || !description.trim()) {
    return NextResponse.json({ error: 'description is required' }, { status: 400 });
  }
  if (typeof quantity !== 'number' || quantity <= 0) {
    return NextResponse.json({ error: 'quantity must be a positive number' }, { status: 400 });
  }
  if (typeof unit_cost !== 'number' || unit_cost < 0) {
    return NextResponse.json(
      { error: 'unit_cost must be a non-negative number' },
      { status: 400 }
    );
  }

  const { data: material, error } = await db
    .from('materials')
    .insert({
      work_order_id: workOrderId,
      description: description.trim(),
      quantity,
      unit_cost,
      supplier: supplier?.trim() ?? null,
      receipt_url: receipt_url ?? null,
    })
    .select()
    .single();

  if (error || !material) {
    return NextResponse.json(
      { error: error?.message ?? 'Failed to create material' },
      { status: 500 }
    );
  }

  return NextResponse.json(material, { status: 201 });
}

/**
 * GET /api/admin/work-orders/[id]/materials
 *
 * Returns all materials for the given work order.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id: workOrderId } = await params;
  const db = getServiceRoleClient();

  const { data, error } = await db
    .from('materials')
    .select('*')
    .eq('work_order_id', workOrderId)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
