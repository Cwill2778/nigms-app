import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabase';
import type { EstimateLineItem } from '@/lib/types';

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
  const { line_items, notes, total_amount } = body as {
    line_items: EstimateLineItem[];
    notes?: string;
    total_amount: number;
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

  // Count existing estimates for this client to generate EST-{CLIENT_SEQ}-{NNNN}
  const { count: clientCount } = await db
    .from('estimates')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientId);

  const clientSeq = (clientCount ?? 0) + 1;

  // Count all estimates for the global sequence
  const { count: totalCount } = await db
    .from('estimates')
    .select('*', { count: 'exact', head: true });

  const seq = (totalCount ?? 0) + 1;
  const estimateNumber = `EST-${clientSeq}-${String(seq).padStart(4, '0')}`;

  // Check if an estimate already exists for this work order (upsert)
  const { data: existing } = await db
    .from('estimates')
    .select('id')
    .eq('work_order_id', workOrderId)
    .maybeSingle();

  let estimate;
  let error;

  if (existing) {
    // Update existing estimate
    ({ data: estimate, error } = await db
      .from('estimates')
      .update({
        line_items,
        notes: notes ?? null,
        total_amount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single());
  } else {
    // Insert new estimate
    ({ data: estimate, error } = await db
      .from('estimates')
      .insert({
        work_order_id: workOrderId,
        client_id: clientId,
        estimate_number: estimateNumber,
        line_items,
        notes: notes ?? null,
        total_amount,
      })
      .select()
      .single());
  }

  if (error || !estimate) {
    return NextResponse.json(
      { error: error?.message ?? 'Failed to save estimate' },
      { status: 500 }
    );
  }

  return NextResponse.json(estimate);
}
