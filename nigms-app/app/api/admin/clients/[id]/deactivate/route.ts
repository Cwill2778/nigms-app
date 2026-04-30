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
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const serviceClient = getServiceRoleClient();

  const { error } = await serviceClient
    .from('users')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
