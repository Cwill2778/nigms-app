import { createServerClient as _createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  // Accept both `email` (new) and `username` (legacy) fields
  const { email: emailField, username, password } = body as {
    email?: string;
    username?: string;
    password: string;
  };

  const identifier = emailField || username;

  if (!identifier || !password) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  // Service role client — bypasses RLS to look up user by username or email
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

  // Determine if the identifier is an email or a username
  const isEmail = identifier.includes('@');

  let email: string;

  if (isEmail) {
    // Look up by email directly via admin API
    const { data: { users }, error: listError } =
      await serviceClient.auth.admin.listUsers({ perPage: 1000 });

    if (listError) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const authUser = users.find((u) => u.email?.toLowerCase() === identifier.toLowerCase());
    if (!authUser?.email) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    email = authUser.email;
  } else {
    // 1. Look up the user record by username in public.users
    const { data: userRecord, error: lookupError } = await serviceClient
      .from('users')
      .select('id')
      .eq('username', identifier)
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

    email = authUser.user.email;
  }

  // 3. Sign in with email + password using the SSR client (sets cookies)
  const cookieStore = await cookies();
  const anonClient = _createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[]) => {
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

  const userId = signInData.user.id;

  // 4. Read role and requires_password_reset from public.users
  const { data: userProfile, error: profileError } = await serviceClient
    .from('users')
    .select('role, requires_password_reset')
    .eq('id', userId)
    .single();

  if (profileError || !userProfile) {
    return NextResponse.json({ error: 'Failed to load user profile' }, { status: 500 });
  }

  // 5. Read onboarding_complete from onboarding_states (clients only)
  let onboarding_complete: boolean | null = null;
  if (userProfile.role === 'client' || userProfile.role === 'vip_client') {
    const { data: onboardingState } = await serviceClient
      .from('onboarding_states')
      .select('onboarding_complete')
      .eq('user_id', userId)
      .single();

    onboarding_complete = onboardingState?.onboarding_complete ?? false;
  }

  return NextResponse.json(
    {
      role: userProfile.role,
      requires_password_reset: userProfile.requires_password_reset,
      onboarding_complete,
    },
    { status: 200 }
  );
}
