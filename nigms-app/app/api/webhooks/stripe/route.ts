import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe";
import { sendPaymentConfirmationEmail } from "@/lib/email";
import type Stripe from "stripe";

export const dynamic = "force-dynamic";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ message: "Missing Stripe-Signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("[webhook] signature verification failed", err);
    return NextResponse.json({ message: "Invalid signature" }, { status: 400 });
  }

  const supabase = getServiceClient();

  if (event.type === "checkout.session.completed") {
    // Primary event for Stripe Checkout — fired when the user completes payment
    const session = event.data.object as Stripe.Checkout.Session;
    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : (session.payment_intent as Stripe.PaymentIntent | null)?.id ?? null;

    const workOrderId = session.metadata?.workOrderId ?? null;
    const clientId = session.metadata?.clientId ?? null;
    const amountTotal = session.amount_total ? session.amount_total / 100 : null;

    if (!paymentIntentId || !workOrderId || !clientId) {
      console.error("[webhook] checkout.session.completed missing required fields", {
        paymentIntentId,
        workOrderId,
        clientId,
      });
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // Try to update the pending record first
    const { data: updated, error: updateError } = await supabase
      .from("payments")
      .update({ status: "paid" })
      .eq("stripe_payment_intent_id", paymentIntentId)
      .select("id, client_id, amount, method")
      .maybeSingle();

    let payment = updated;

    // If no pending record existed (e.g. checkout insert failed), create it now
    if (!payment && amountTotal) {
      const { data: inserted, error: insertError } = await supabase
        .from("payments")
        .insert({
          work_order_id: workOrderId,
          client_id: clientId,
          amount: amountTotal,
          method: "stripe",
          status: "paid",
          stripe_payment_intent_id: paymentIntentId,
        })
        .select("id, client_id, amount, method")
        .single();

      if (insertError) {
        console.error("[webhook] failed to insert payment on session complete", insertError);
      } else {
        payment = inserted;
      }
    }

    if (updateError) {
      console.error("[webhook] payment update error", updateError);
    }

    if (payment) {
      const { data: authUser } = await supabase.auth.admin.getUserById(payment.client_id);
      if (authUser?.user?.email) {
        await sendPaymentConfirmationEmail(
          { email: authUser.user.email },
          { amount: payment.amount, method: payment.method }
        );
      }
    }
  } else if (event.type === "payment_intent.succeeded") {
    // Fallback: also handle direct PaymentIntent success (covers non-Checkout flows)
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    const { data: payment, error } = await supabase
      .from("payments")
      .update({ status: "paid" })
      .eq("stripe_payment_intent_id", paymentIntent.id)
      .select("client_id, amount, method")
      .maybeSingle();

    if (error) {
      console.error("[webhook] payment_intent.succeeded update error", error);
    } else if (payment) {
      const { data: authUser } = await supabase.auth.admin.getUserById(payment.client_id);
      if (authUser?.user?.email) {
        await sendPaymentConfirmationEmail(
          { email: authUser.user.email },
          { amount: payment.amount, method: payment.method }
        );
      }
    }
  } else if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    const { error } = await supabase
      .from("payments")
      .update({ status: "failed" })
      .eq("stripe_payment_intent_id", paymentIntent.id);

    if (error) {
      console.error("[webhook] payment failed update error", error);
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
