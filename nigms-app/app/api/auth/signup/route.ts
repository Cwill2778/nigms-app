import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  const body = await request.json() as { name: string; company_name?: string; email: string; password: string };
  const { name, company_name, email, password } = body;

  if (!name?.trim() || !email?.trim() || !password?.trim()) {
    return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
  }

  const supabase = getServiceClient();

  // Generate a username from the email (before the @)
  const baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  const username = `${baseUsername}_${Math.floor(Math.random() * 9000) + 1000}`;

  // Create the auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // auto-confirm so they can log in immediately
  });

  if (authError || !authData.user) {
    if (authError?.message?.includes('already registered')) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create account. Please try again.' }, { status: 500 });
  }

  // Create the public.users profile with full_name, email, and company_name
  const { error: profileError } = await supabase
    .from('users')
    .insert({
      id: authData.user.id,
      username,
      role: 'client',
      email: email.trim().toLowerCase(),
      is_active: true,
      requires_password_reset: false,
      full_name: name,
      company_name: company_name?.trim() || null,
    });

  if (profileError) {
    // Roll back the auth user if profile creation fails
    await supabase.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json({ error: 'Failed to create account. Please try again.' }, { status: 500 });
  }

  // Create the onboarding_states record
  const { error: onboardingError } = await supabase
    .from('onboarding_states')
    .insert({
      user_id: authData.user.id,
      onboarding_step: 'property_setup',
      onboarding_complete: false,
    });

  if (onboardingError) {
    // Roll back both the users profile and auth user if onboarding_states creation fails
    await supabase.from('users').delete().eq('id', authData.user.id);
    await supabase.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json({ error: 'Failed to create account. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
