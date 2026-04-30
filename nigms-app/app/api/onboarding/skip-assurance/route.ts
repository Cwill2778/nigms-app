import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabase';

function getServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// POST /api/onboarding/skip-assurance
// Marks onboarding as complete when the user skips the assurance upsell.
export async function POST() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getServiceRoleClient();

  const { error } = await db
    .from('onboarding_states')
    .update({
      onboarding_complete: true,
      onboarding_step: 'assurance_upsell',
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', session.user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
