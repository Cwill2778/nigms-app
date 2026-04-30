import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabase';
import { stripe } from '@/lib/stripe';
import { notifyClient } from '@/lib/notifications';

/**
 * POST /api/client/invoices/[id]/pay
 *   Requires client authentication
 *   Verifies invoice belongs to authenticated client
 *   Creates Stripe PaymentIntent for invoice.balance_remaining
 *   On success: sets invoices.paid_at = now(), updates amount_paid
 *   Writes audit log entry
 *   Returns { client_secret: string } for Stripe Elements
 *
 * Requirements: 9.6, 9.7
 */

function getServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: invoiceId } = await params;
  const db = getServiceRoleClient();

  // Fetch invoice and verify it belongs to the authenticated client
  const { data: invoice, error: fetchError } = await db
    .from('invoices')
    .select('id, work_order_id, client_id, receipt_number, total_billed, amount_paid, balance_remaining, paid_at, stripe_payment_intent_id')
    .eq('id', invoiceId)
    .single();

  if (fetchError || !invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  const inv = invoice as {
    id: string;
    work_order_id: string;
    client_id: string;
    receipt_number: string;
    total_billed: number;
    amount_paid: number;
    balance_remaining: number;
    paid_at: string | null;
    stripe_payment_intent_id: string | null;
  };

  if (inv.client_id !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (inv.paid_at) {
    return NextResponse.json({ error: 'Invoice has already been paid' }, { status: 409 });
  }

  const balanceRemaining = inv.balance_remaining ?? inv.total_billed - inv.amount_paid;

  if (balanceRemaining <= 0) {
    return NextResponse.json({ error: 'Invoice balance is zero — nothing to pay' }, { status: 400 });
  }

  // Get actor role for audit log
  const { data: profile } = await db
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();
  const actorRole = (profile as { role: string } | null)?.role ?? 'client';

  // Create Stripe PaymentIntent (amount in cents)
  const amountCents = Math.round(balanceRemaining * 100);

  let paymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      metadata: {
        invoice_id: invoiceId,
        work_order_id: inv.work_order_id,
        client_id: session.user.id,
        receipt_number: inv.receipt_number,
      },
      description: `Payment for invoice ${inv.receipt_number}`,
    });
  } catch (stripeError) {
    const message = stripeError instanceof Error ? stripeError.message : 'Stripe error';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  // Update invoice with PaymentIntent ID and mark as paid
  const now = new Date().toISOString();
  const { error: updateError } = await db
    .from('invoices')
    .update({
      stripe_payment_intent_id: paymentIntent.id,
      paid_at: now,
      amount_paid: inv.total_billed,
    })
    .eq('id', invoiceId);

  if (updateError) {
    // PaymentIntent was created but DB update failed — log and return client_secret anyway
    console.error('Failed to update invoice after PaymentIntent creation:', updateError.message);
  }

  // Write audit log entry (Requirement 9.7)
  await db.from('audit_log').insert({
    entity_type: 'payment',
    entity_id: invoiceId,
    action: 'invoice_paid',
    actor_id: session.user.id,
    actor_role: actorRole,
    changes: {
      receipt_number: inv.receipt_number,
      amount: balanceRemaining,
      stripe_payment_intent_id: paymentIntent.id,
      paid_at: now,
    },
  });

  // Notify client of payment confirmation via in-app + email (Requirement 11.2)
  await notifyClient(session.user.id, 'invoice_paid', {
    receipt_number: inv.receipt_number,
    invoice_id: invoiceId,
    amount: balanceRemaining,
  }).catch((err) => console.error('[invoices/pay] notifyClient failed', err));

  return NextResponse.json({ client_secret: paymentIntent.client_secret });
}
