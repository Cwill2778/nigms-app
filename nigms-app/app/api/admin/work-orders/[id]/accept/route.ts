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
  return profile?.role === 'admin';
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const db = getServiceRoleClient();

  // Generate WO number: WO-{YYYY}-{NNNN}
  const year = new Date().getFullYear();
  const prefix = `WO-${year}-`;

  const { count } = await db
    .from('work_orders')
    .select('*', { count: 'exact', head: true })
    .ilike('wo_number', `${prefix}%`);

  const seq = (count ?? 0) + 1;
  const woNumber = `${prefix}${String(seq).padStart(4, '0')}`;

  const { data: workOrder, error } = await db
    .from('work_orders')
    .update({
      status: 'accepted',
      accepted_at: new Date().toISOString(),
      wo_number: woNumber,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error || !workOrder) {
    return NextResponse.json(
      { error: error?.message ?? 'Work order not found' },
      { status: error ? 500 : 404 }
    );
  }

  return NextResponse.json(workOrder);
}
