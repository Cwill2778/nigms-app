import { createServerClient as _createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { username, password } = body as { username: string; password: string };

  if (!username || !password) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  // Service role client — bypasses RLS to look up user by username
  const serviceClient = _createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    }
  );

  // 1. Look up the user record by username in public.users
  const { data: userRecord, error: lookupError } = await serviceClient
    .from('users')
    .select('id')
    .eq('username', username)
    .single();

  if (lookupError || !userRecord) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  // 2. Get the email from auth.users via admin API
  const { data: authUser, error: authLookupError } =
    await serviceClient.auth.admin.getUserById(userRecord.id);

  if (authLookupError || !authUser?.user?.email) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const email = authUser.user.email;

  // 3. Sign in with email + password using the SSR client (sets cookies)
  const cookieStore = await cookies();
  const anonClient = _createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet: { name: any; value: any; options: any; }[]) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set({ name, value, ...options });
          });
        },
      },
    }
  );

  const { data: signInData, error: signInError } =
    await anonClient.auth.signInWithPassword({ email, password });

  if (signInError || !signInData.session) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  return NextResponse.json({ session: signInData.session }, { status: 200 });
}
