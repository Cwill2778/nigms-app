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

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    // Update payment record to paid
    const { data: payment, error } = await supabase
      .from("payments")
      .update({ status: "paid" })
      .eq("stripe_payment_intent_id", paymentIntent.id)
      .select("client_id, amount, method")
      .single();

    if (error) {
      console.error("[webhook] payment update error", error);
    } else if (payment) {
      // Get email from auth.users via service role
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
