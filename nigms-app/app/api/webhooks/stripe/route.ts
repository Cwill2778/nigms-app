import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe';
import { getTierAllocation } from '@/lib/subscription-utils';
import { sendPaymentConfirmationEmail } from '@/lib/email';
import type Stripe from 'stripe';

export const dynamic = 'force-dynamic';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ message: 'Missing Stripe-Signature header' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('[webhook] signature verification failed', err);
    return NextResponse.json({ message: 'Invalid signature' }, { status: 400 });
  }

  const supabase = getServiceClient();

  // ─── checkout.session.completed ────────────────────────────────────────────
  // Fired when a client completes the Stripe Checkout flow for a subscription.
  // Creates the subscriptions record and marks onboarding complete.
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    const userId = session.metadata?.user_id ?? session.client_reference_id ?? null;
    const tier = session.metadata?.tier ?? null;
    const propertyId = session.metadata?.property_id ?? null;

    const stripeSubscriptionId =
      typeof session.subscription === 'string'
        ? session.subscription
        : (session.subscription as Stripe.Subscription | null)?.id ?? null;

    const stripeCustomerId =
      typeof session.customer === 'string'
        ? session.customer
        : (session.customer as Stripe.Customer | null)?.id ?? null;

    if (!userId || !tier) {
      console.error('[webhook] checkout.session.completed missing user_id or tier', {
        userId,
        tier,
        sessionId: session.id,
      });
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // Resolve property_id: prefer metadata, fall back to user's first property
    let resolvedPropertyId = propertyId;
    if (!resolvedPropertyId) {
      const { data: property } = await supabase
        .from('properties')
        .select('id')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      resolvedPropertyId = property?.id ?? null;
    }

    if (!resolvedPropertyId) {
      console.error('[webhook] checkout.session.completed: no property found for user', { userId });
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // Create the subscription record
    const { error: subError } = await supabase.from('subscriptions').insert({
      user_id: userId,
      property_id: resolvedPropertyId,
      tier,
      stripe_subscription_id: stripeSubscriptionId,
      stripe_customer_id: stripeCustomerId,
      status: 'active',
      monthly_allocation_minutes: getTierAllocation(tier),
      minutes_used: 0,
    });

    if (subError) {
      console.error('[webhook] failed to create subscription record', subError);
    }

    // Mark onboarding complete
    const { error: onboardingError } = await supabase
      .from('onboarding_states')
      .update({ onboarding_complete: true, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    if (onboardingError) {
      console.error('[webhook] failed to update onboarding_states', onboardingError);
    }
  }

  // ─── invoice.payment_succeeded ─────────────────────────────────────────────
  // Updates the subscription's billing period dates when a recurring invoice
  // is paid successfully.
  else if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object as Stripe.Invoice;

    const stripeSubscriptionId =
      typeof invoice.subscription === 'string'
        ? invoice.subscription
        : (invoice.subscription as Stripe.Subscription | null)?.id ?? null;

    if (stripeSubscriptionId) {
      // Fetch the Stripe subscription to get accurate period dates
      let periodStart: string | null = null;
      let periodEnd: string | null = null;

      try {
        const stripeSub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
        periodStart = new Date(stripeSub.current_period_start * 1000).toISOString();
        periodEnd = new Date(stripeSub.current_period_end * 1000).toISOString();
      } catch (err) {
        console.error('[webhook] failed to retrieve Stripe subscription for period dates', err);
      }

      const { error } = await supabase
        .from('subscriptions')
        .update({
          current_period_start: periodStart,
          current_period_end: periodEnd,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', stripeSubscriptionId);

      if (error) {
        console.error('[webhook] invoice.payment_succeeded update error', error);
      }
    }

    // Also handle one-time payment confirmation emails (legacy invoice payments)
    const paymentIntentId =
      typeof invoice.payment_intent === 'string'
        ? invoice.payment_intent
        : (invoice.payment_intent as Stripe.PaymentIntent | null)?.id ?? null;

    if (paymentIntentId) {
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .update({ status: 'paid' })
        .eq('stripe_payment_intent_id', paymentIntentId)
        .select('client_id, amount, method')
        .maybeSingle();

      if (paymentError) {
        console.error('[webhook] invoice.payment_succeeded payment update error', paymentError);
      } else if (payment) {
        const { data: authUser } = await supabase.auth.admin.getUserById(payment.client_id);
        if (authUser?.user?.email) {
          await sendPaymentConfirmationEmail(
            { email: authUser.user.email },
            { amount: payment.amount, method: payment.method }
          );
        }
      }
    }
  }

  // ─── customer.subscription.deleted ─────────────────────────────────────────
  // Fired when a Stripe subscription is cancelled (immediately or at period end).
  // Sets the local subscription status to 'cancelled'.
  else if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription;

    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id);

    if (error) {
      console.error('[webhook] customer.subscription.deleted update error', error);
    }
  }

  // ─── customer.subscription.updated ─────────────────────────────────────────
  // Keeps status and period dates in sync for other subscription state changes
  // (e.g. past_due, trialing).
  else if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object as Stripe.Subscription;

    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: subscription.status as 'active' | 'cancelled' | 'past_due' | 'trialing',
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id);

    if (error) {
      console.error('[webhook] customer.subscription.updated sync error', error);
    }
  }

  // ─── payment_intent.succeeded (legacy / non-Checkout flows) ────────────────
  else if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    const { data: payment, error } = await supabase
      .from('payments')
      .update({ status: 'paid' })
      .eq('stripe_payment_intent_id', paymentIntent.id)
      .select('client_id, amount, method')
      .maybeSingle();

    if (error) {
      console.error('[webhook] payment_intent.succeeded update error', error);
    } else if (payment) {
      const { data: authUser } = await supabase.auth.admin.getUserById(payment.client_id);
      if (authUser?.user?.email) {
        await sendPaymentConfirmationEmail(
          { email: authUser.user.email },
          { amount: payment.amount, method: payment.method }
        );
      }
    }
  }

  // ─── payment_intent.payment_failed ─────────────────────────────────────────
  else if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    const { error } = await supabase
      .from('payments')
      .update({ status: 'failed' })
      .eq('stripe_payment_intent_id', paymentIntent.id);

    if (error) {
      console.error('[webhook] payment_intent.payment_failed update error', error);
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
