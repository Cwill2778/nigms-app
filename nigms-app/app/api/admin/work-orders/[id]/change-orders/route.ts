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
  const { description, additional_cost } = body as {
    description: string;
    additional_cost: number;
  };

  if (!description || typeof additional_cost !== 'number') {
    return NextResponse.json(
      { error: 'description and additional_cost are required' },
      { status: 400 }
    );
  }

  const { data: changeOrder, error } = await db
    .from('change_orders')
    .insert({
      work_order_id: workOrderId,
      description,
      additional_cost,
      status: 'pending',
    })
    .select()
    .single();

  if (error || !changeOrder) {
    return NextResponse.json(
      { error: error?.message ?? 'Failed to create change order' },
      { status: 500 }
    );
  }

  return NextResponse.json(changeOrder, { status: 201 });
}
