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

export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { address?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { address } = body;
  if (!address || address.trim() === '') {
    return NextResponse.json({ error: 'Address is required' }, { status: 400 });
  }

  const db = getServiceRoleClient();

  const { data: property, error: insertError } = await db
    .from('properties')
    .insert({ user_id: session.user.id, address: address.trim() })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const { error: updateError } = await db
    .from('onboarding_states')
    .update({ onboarding_step: 'assurance_upsell', updated_at: new Date().toISOString() })
    .eq('user_id', session.user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, property });
}
