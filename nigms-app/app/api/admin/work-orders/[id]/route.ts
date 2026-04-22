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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();

  // Only allow known fields
  const allowed = [
    'title', 'description', 'urgency', 'category',
    'property_address', 'inspection_notes', 'quoted_amount', 'status',
  ] as const;

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of allowed) {
    if (key in body) {
      updates[key] = body[key];
    }
  }

  const db = getServiceRoleClient();

  const { data: workOrder, error } = await db
    .from('work_orders')
    .update(updates)
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
