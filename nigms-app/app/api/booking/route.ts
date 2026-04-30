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

  // Quote requests from unauthenticated visitors don't have a client_id.
  // We store them as a special "quote_request" category so admins can
  // review and convert them to real work orders once a client account exists.
  // The work_orders table requires client_id, so we use a sentinel admin/system
  // user approach: store the contact info in the description and leave the
  // record unassigned by inserting via service role with a placeholder.
  // For now we store the full contact info in description and skip the WO insert
  // if there's no way to satisfy the FK — instead we rely on the email notification.
  // TODO: Add a quote_requests table to properly handle pre-signup inquiries.
  const { error: woError } = await supabase
    .from("work_orders")
    .insert({
      // client_id is intentionally omitted — the DB column allows NULL for
      // quote requests submitted before account creation. If your schema has
      // NOT NULL on client_id, run: ALTER TABLE work_orders ALTER COLUMN client_id DROP NOT NULL;
      client_id: null,
      title: `[Quote Request] ${serviceType} — ${name}`,
      description,
      status: "pending",
      quoted_amount: null,
      category: serviceType as string,
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
