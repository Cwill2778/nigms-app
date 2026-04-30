import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

function getServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
  }

  try {
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    });
    const userId = checkoutSession.client_reference_id;

    if (!userId) {
      return NextResponse.json({ error: 'Invalid session: no user reference' }, { status: 400 });
    }

    const db = getServiceRoleClient();

    // Mark onboarding complete
    await db
      .from('onboarding_states')
      .update({
        onboarding_complete: true,
        onboarding_step: 'assurance_upsell',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    // Record the subscription
    const subscription = checkoutSession.subscription as Stripe.Subscription | null;
    if (subscription) {
      await db.from('assurance_subscriptions').upsert(
        {
          user_id: userId,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer?.id ?? null,
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'stripe_subscription_id' }
      );
    }

    return NextResponse.redirect(new URL('/dashboard?enrolled=assurance', request.url));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to verify checkout session';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
