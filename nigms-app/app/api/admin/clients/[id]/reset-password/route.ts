import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabase';
import { sendPasswordResetEmail } from '@/lib/email';

function randomAlphanumeric(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

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

  // Fetch user profile and auth email
  const [{ data: profile }, { data: authData }] = await Promise.all([
    serviceClient.from('users').select('username').eq('id', id).single(),
    serviceClient.auth.admin.getUserById(id),
  ]);

  if (!profile || !authData?.user?.email) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const tempPassword = randomAlphanumeric(12);

  // Update auth password
  const { error: pwError } = await serviceClient.auth.admin.updateUserById(id, {
    password: tempPassword,
  });

  if (pwError) {
    return NextResponse.json({ error: pwError.message }, { status: 500 });
  }

  // Set requires_password_reset = true
  await serviceClient
    .from('users')
    .update({ requires_password_reset: true })
    .eq('id', id);

  // Send email (non-blocking)
  await sendPasswordResetEmail(
    { email: authData.user.email, username: profile.username },
    tempPassword
  );

  return NextResponse.json({ success: true });
}
