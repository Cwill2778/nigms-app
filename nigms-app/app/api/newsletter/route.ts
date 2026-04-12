import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendNewsletterConfirmationEmail } from "@/lib/email";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
  }

  const { email } = body as { email?: string };

  if (!email || !EMAIL_REGEX.test(email)) {
    return NextResponse.json({ message: "Invalid email address" }, { status: 400 });
  }

  const supabase = getServiceClient();
  const { error } = await supabase
    .from("newsletter_subscribers")
    .insert({ email });

  if (error) {
    // Unique constraint violation — already subscribed
    if (error.code === "23505") {
      return NextResponse.json({ message: "Already subscribed" }, { status: 200 });
    }
    console.error("[newsletter] insert error", error);
    return NextResponse.json({ message: "Failed to subscribe" }, { status: 500 });
  }

  await sendNewsletterConfirmationEmail(email);

  return NextResponse.json({ message: "Subscribed successfully" }, { status: 201 });
}
