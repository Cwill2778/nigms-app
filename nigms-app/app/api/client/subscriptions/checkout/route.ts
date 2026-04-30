import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { stripe, TIER_PRICE_IDS, TIER_AMOUNTS } from '@/lib/stripe';
import type { SubscriptionTier } from '@/lib/types';

/**
 * POST /api/client/subscriptions/checkout
 * Creates a Stripe Checkout Session for the requested subscription tier.
 *
 * Body: { tier: 'essential' | 'elevated' | 'elite', property_id?: string }
 * Returns: { url: string } — the Stripe-hosted checkout URL
 *
 * Requirements: 2.5, 3.1, 3.6
 */

const TIER_NAMES: Record<string, string> = {
  essential: 'Essential Standard',
  elevated: 'Elevated Standard',
  elite: 'Elite Standard',
};

const VALID_TIERS: SubscriptionTier[] = ['essential', 'elevated', 'elite'];

export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { tier?: string; property_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { tier, property_id } = body;
  if (!tier || !VALID_TIERS.includes(tier as SubscriptionTier)) {
    return NextResponse.json(
      { error: `Invalid tier. Must be one of: ${VALID_TIERS.join(', ')}` },
      { status: 400 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  try {
    const priceId = TIER_PRICE_IDS[tier as keyof typeof TIER_PRICE_IDS];

    const lineItems: import('stripe').Stripe.Checkout.SessionCreateParams.LineItem[] = priceId
      ? [{ price: priceId, quantity: 1 }]
      : [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Nailed It Assurance Program — ${TIER_NAMES[tier]}`,
                description: `${TIER_NAMES[tier]} subscription for property maintenance coverage`,
              },
              unit_amount: TIER_AMOUNTS[tier as keyof typeof TIER_AMOUNTS],
              recurring: { interval: 'month' },
            },
            quantity: 1,
          },
        ];

    // Build metadata — include property_id if provided so the webhook can
    // associate the subscription with the correct property without a DB lookup.
    const metadata: Record<string, string> = {
      user_id: session.user.id,
      tier,
    };
    if (property_id) {
      metadata.property_id = property_id;
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: lineItems,
      success_url: `${appUrl}/api/stripe/onboarding-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/assurance`,
      client_reference_id: session.user.id,
      metadata,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to create checkout session';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
