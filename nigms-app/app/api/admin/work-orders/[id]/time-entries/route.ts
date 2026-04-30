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

async function verifyAdmin(): Promise<{ authenticated: boolean; isAdmin: boolean }> {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { authenticated: false, isAdmin: false };
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();
  return { authenticated: true, isAdmin: (profile as { role: string } | null)?.role === 'admin' };
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { authenticated, isAdmin } = await verifyAdmin();
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const db = getServiceRoleClient();

  const { data: entry, error } = await db
    .from('time_entries')
    .insert({
      work_order_id: id,
      started_at: new Date().toISOString(),
      stopped_at: null,
    })
    .select()
    .single();

  if (error || !entry) {
    return NextResponse.json(
      { error: error?.message ?? 'Failed to create time entry' },
      { status: 500 }
    );
  }

  return NextResponse.json({ entry_id: (entry as { id: string }).id }, { status: 201 });
}
