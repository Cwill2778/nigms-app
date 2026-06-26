import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const NOTIFY_EMAIL = Deno.env.get("NOTIFY_EMAIL") || "support.nailedit@gmail.com";

serve(async (req) => {
  try {
    const body = await req.json();
    const record = body.record;

    if (!record) {
      return new Response(JSON.stringify({ error: "No record provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const price = `$${(record.offered_price / 100).toFixed(0)}`;
    const attachmentCount = record.attachments?.length || 0;

    const htmlBody = `
      <h2 style="color: #FF8A00;">🔨 New Name Your Price Submission</h2>
      <table style="border-collapse: collapse; width: 100%; max-width: 500px;">
        <tr><td style="padding: 8px; font-weight: bold;">Name:</td><td style="padding: 8px;">${record.customer_name}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">Phone:</td><td style="padding: 8px;">${record.customer_phone || "Not provided"}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">Email:</td><td style="padding: 8px;">${record.customer_email || "Not provided"}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">Offered Price:</td><td style="padding: 8px; font-size: 1.3em; color: #FF8A00; font-weight: bold;">${price}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">Attachments:</td><td style="padding: 8px;">${attachmentCount} file(s)</td></tr>
      </table>
      <h3 style="margin-top: 20px;">Description:</h3>
      <p style="background: #f5f5f5; padding: 16px; border-radius: 4px; white-space: pre-wrap;">${record.description}</p>
      <p style="margin-top: 24px;">
        <a href="https://www.naileditpropertysolutions.com/admin" style="background: #FF8A00; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
          View in Admin Panel
        </a>
      </p>
    `;

    // Send via Resend API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Nailed It Leads <leads@naileditpropertysolutions.com>",
        to: [NOTIFY_EMAIL],
        subject: `🔨 New Lead: ${record.customer_name} — ${price}`,
        html: htmlBody,
      }),
    });

    const result = await emailResponse.json();

    return new Response(
      JSON.stringify({ message: "Email sent", result }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
