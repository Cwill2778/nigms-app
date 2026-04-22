import { createServerClient as _createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import type Stripe from 'stripe';
import type { CheckoutRequest } from '@/lib/types';

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();

  const supabase = _createServerClient(
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as CheckoutRequest;
  const { workOrderId, type, amount } = body;

  if (!workOrderId || !type || !amount || amount <= 0) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  // Verify the authenticated user owns the work order (RLS also enforces this)
  const { data: workOrder, error: woError } = await supabase
    .from('work_orders')
    .select('id, client_id, title')
    .eq('id', workOrderId)
    .single();

  if (woError || !workOrder) {
    return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
  }

  // Extra ownership check (belt-and-suspenders alongside RLS)
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  const isAdmin = profile?.role === 'admin';
  if (!isAdmin && workOrder.client_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const amountInCents = Math.round(amount * 100);

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: amountInCents,
            product_data: {
              name: `${workOrder.title} — ${type === 'balance' ? 'Balance Payment' : type === 'deposit' ? 'Deposit' : 'Full Payment'}`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        workOrderId,
        clientId: workOrder.client_id,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/dashboard?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/dashboard?payment=cancelled`,
    });

    // Insert a pending payment record so the webhook can update it on success
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const paymentIntentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : (session.payment_intent as Stripe.PaymentIntent | null)?.id ?? null;

    const { error: insertError } = await serviceClient.from('payments').insert({
      work_order_id: workOrderId,
      client_id: workOrder.client_id,
      amount,
      method: 'stripe',
      status: 'pending',
      stripe_payment_intent_id: paymentIntentId,
    });

    if (insertError) {
      console.error('[checkout] failed to insert pending payment record:', insertError);
      // Don't block the user — webhook will upsert on success if this fails
    }

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (err) {
    console.error('[checkout] Stripe error:', err);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
