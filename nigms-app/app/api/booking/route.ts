import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendBookingConfirmationEmail } from "@/lib/email";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
  }

  const {
    name,
    email,
    phone,
    serviceType,
    preferredDate,
    propertyAddress,
    budgetEstimate,
    referralSource,
    referralCode,
    notes,
    agreedToTerms,
  } = body as Record<string, string | boolean>;

  // Validate required fields
  if (
    !name || !email || !phone || !serviceType ||
    !preferredDate || !propertyAddress || !budgetEstimate ||
    !referralSource || !agreedToTerms
  ) {
    return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
  }

  const supabase = getServiceClient();

  const description = [
    `Contact: ${name} | ${email} | ${phone}`,
    `Property: ${propertyAddress}`,
    `Budget: ${budgetEstimate}`,
    `Preferred Date: ${preferredDate}`,
    `Referral Source: ${referralSource}`,
    referralCode ? `Referral Code: ${referralCode}` : null,
    notes ? `Notes: ${notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const { error: woError } = await supabase
    .from("work_orders")
    .insert({
      client_id: null,
      title: `${serviceType} — ${name}`,
      description,
      status: "pending",
      quoted_amount: null,
    });

  if (woError) {
    console.error("[booking] work order insert error", woError);
    return NextResponse.json({ message: "Failed to save quote request" }, { status: 500 });
  }

  // Send confirmation email — non-blocking, don't fail the request if it errors
  try {
    await sendBookingConfirmationEmail(
      { email: email as string, name: name as string },
      { serviceType: serviceType as string, preferredDate: preferredDate as string }
    );
  } catch (err) {
    console.error("[booking] confirmation email error", err);
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
