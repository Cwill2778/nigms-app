import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabase';

/**
 * PATCH /api/client/onboarding
 * Updates onboarding_states for the authenticated user.
 *
 * Body: { onboarding_step?: string, onboarding_complete?: boolean }
 *
 * Requirements: 2.3, 2.6
 */

function getServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function PATCH(request: NextRequest) {
  const supabase = await createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { onboarding_step?: string; onboarding_complete?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { onboarding_step, onboarding_complete } = body;

  // Build the update payload — only include fields that were provided
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (onboarding_step !== undefined) {
    const validSteps = ['property_setup', 'assurance_upsell'];
    if (!validSteps.includes(onboarding_step)) {
      return NextResponse.json(
        { error: `Invalid onboarding_step. Must be one of: ${validSteps.join(', ')}` },
        { status: 400 }
      );
    }
    updates.onboarding_step = onboarding_step;
  }

  if (onboarding_complete !== undefined) {
    if (typeof onboarding_complete !== 'boolean') {
      return NextResponse.json(
        { error: 'onboarding_complete must be a boolean' },
        { status: 400 }
      );
    }
    updates.onboarding_complete = onboarding_complete;
  }

  const db = getServiceRoleClient();

  const { error } = await db
    .from('onboarding_states')
    .update(updates)
    .eq('user_id', session.user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
