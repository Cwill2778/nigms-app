import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe";
import { calculateDeposit } from "@/lib/booking";
import type { BookingRequest } from "@/lib/types";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  let body: Partial<BookingRequest>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
  }

  const { name, email, phone, serviceType, preferredDate, quotedAmount, paymentOption } = body;

  // Validate required fields
  if (!name || !email || !phone || !serviceType || !preferredDate || quotedAmount == null || !paymentOption) {
    return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
  }

  const supabase = getServiceClient();

  // Insert work order — client_id is nullable for public bookings
  const { data: workOrder, error: woError } = await supabase
    .from("work_orders")
    .insert({
      client_id: null, // nullable for public/anonymous bookings
      title: `${serviceType} — ${name}`,
      description: `Booking request from ${name} (${email}, ${phone}) for ${preferredDate}`,
      status: "pending",
      quoted_amount: quotedAmount,
    })
    .select("id")
    .single();

  if (woError || !workOrder) {
    console.error("[booking] work order insert error", woError);
    return NextResponse.json({ message: "Failed to create booking" }, { status: 500 });
  }

  // Calculate charge amount
  const chargeAmount =
    paymentOption === "deposit"
      ? calculateDeposit(quotedAmount)
      : quotedAmount;

  const amountInCents = Math.round(chargeAmount * 100);

  // Create Stripe checkout session
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${serviceType} — ${paymentOption === "deposit" ? "Deposit (15%)" : "Full Payment"}`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        workOrderId: workOrder.id,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/book/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/book`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[booking] stripe session error", err);
    return NextResponse.json({ message: "Failed to create payment session" }, { status: 500 });
  }
}
