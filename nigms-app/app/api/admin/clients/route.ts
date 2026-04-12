import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabase';
import { sendWelcomeEmail } from '@/lib/email';

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

  return profile?.role === 'admin';
}

// GET /api/admin/clients — return all clients
export async function GET() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const serviceClient = getServiceRoleClient();
  const { data, error } = await serviceClient
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/admin/clients — create a new client
export async function POST(request: NextRequest) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { email, name } = body as { email?: string; name?: string };

  if (!email) {
    return NextResponse.json({ error: 'email is required' }, { status: 400 });
  }

  const username = `usr_${randomAlphanumeric(8)}`;
  const tempPassword = randomAlphanumeric(12);

  const serviceClient = getServiceRoleClient();

  // Create auth user
  const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  });

  if (authError || !authData?.user) {
    return NextResponse.json(
      { error: authError?.message ?? 'Failed to create auth user' },
      { status: 500 }
    );
  }

  const userId = authData.user.id;

  // Insert into public.users
  const { data: userRecord, error: dbError } = await serviceClient
    .from('users')
    .insert({
      id: userId,
      username,
      role: 'client',
      requires_password_reset: true,
    })
    .select()
    .single();

  if (dbError) {
    // Cleanup auth user on DB failure
    await serviceClient.auth.admin.deleteUser(userId);
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  // Send welcome email (non-blocking)
  await sendWelcomeEmail(
    { email, username: name ?? username },
    tempPassword
  );

  return NextResponse.json(userRecord, { status: 201 });
}
