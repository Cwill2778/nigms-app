import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

function getServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function getAdminSession() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if ((profile as { role: string } | null)?.role !== 'admin') return null;
  return session;
}

// PATCH /api/admin/messages/read — mark all messages from a client as read
export async function PATCH(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { clientId } = body as { clientId?: string };

  if (!clientId) {
    return NextResponse.json({ error: 'clientId is required' }, { status: 400 });
  }

  const adminId = session.user.id;
  const serviceClient = getServiceRoleClient();

  const { data, error } = await serviceClient
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('sender_id', clientId)
    .eq('recipient_id', adminId)
    .is('read_at', null)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ updated: data?.length ?? 0 });
}
