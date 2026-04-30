import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(_request: NextRequest) {
  const supabase = await createServerClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  try {
    // Build line items — use a configured price ID if available, otherwise use price_data
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = process.env.STRIPE_PRICE_ID
      ? [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }]
      : [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Assurance Program',
                description: 'NIGMS Assurance Program — priority maintenance coverage',
              },
              unit_amount: 9900, // $99.00 placeholder
              recurring: { interval: 'month' },
            },
            quantity: 1,
          },
        ];

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: lineItems,
      success_url: `${appUrl}/api/stripe/onboarding-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/onboarding/assurance`,
      client_reference_id: session.user.id,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create checkout session';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
