import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";

serve(async (req) => {
  try {
    const body = await req.json();
    const { record, old_record } = body;

    if (!record || !old_record) {
      return new Response(JSON.stringify({ error: "Missing record data" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Only fire when status changes to accepted, countered, or declined
    if (record.status === old_record.status) {
      return new Response(JSON.stringify({ message: "No status change" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const customerEmail = record.customer_email;
    if (!customerEmail) {
      return new Response(
        JSON.stringify({ message: "No customer email on record" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    let subject = "";
    let htmlBody = "";
    const customerName = record.customer_name || "there";

    if (record.status === "accepted") {
      subject = "Your Request Has Been Accepted! — Nailed It Property Solutions";
      htmlBody = `
        <h2 style="color: #4caf50;">✅ Great News, ${customerName}!</h2>
        <p>We've reviewed your request and <strong>accepted your offer of $${(record.offered_price / 100).toFixed(0)}</strong>.</p>
        <p>Here's what happens next:</p>
        <ol>
          <li>We'll reach out to schedule a convenient time for the work.</li>
          <li>An on-site walkthrough may be required to confirm the scope.</li>
          <li>Final pricing is confirmed after inspection (per our Terms of Submission).</li>
        </ol>
        <p>We'll be in touch shortly via ${record.customer_phone ? "phone" : "email"} to get you on the schedule.</p>
        <p style="margin-top: 24px; color: #666;">— Nailed It Property Solutions<br>(706) 844-8193</p>
      `;
    } else if (record.status === "countered") {
      const counterPrice = record.counter_price
        ? `$${(record.counter_price / 100).toFixed(0)}`
        : "a revised amount";
      subject = "We Have a Counter-Offer for You — Nailed It Property Solutions";
      htmlBody = `
        <h2 style="color: #FF8A00;">💬 Counter-Offer, ${customerName}</h2>
        <p>Thanks for your submission. After reviewing the scope of work, we'd like to propose <strong>${counterPrice}</strong> for this job.</p>
        ${record.admin_notes ? `<p><strong>Our notes:</strong> ${record.admin_notes}</p>` : ""}
        <p>If this works for you, simply reply to this email or give us a call and we'll get you scheduled.</p>
        <p>If you'd like to discuss further, we're happy to talk it through — no pressure.</p>
        <p style="margin-top: 24px; color: #666;">— Nailed It Property Solutions<br>(706) 844-8193</p>
      `;
    } else if (record.status === "declined") {
      subject = "Update on Your Request — Nailed It Property Solutions";
      htmlBody = `
        <h2>${customerName},</h2>
        <p>Thank you for reaching out. Unfortunately, we're unable to take on this particular job at the proposed price point at this time.</p>
        ${record.admin_notes ? `<p><strong>Note:</strong> ${record.admin_notes}</p>` : ""}
        <p>This doesn't mean we can't work together in the future. Feel free to submit a new request anytime, or give us a call to discuss other options.</p>
        <p style="margin-top: 24px; color: #666;">— Nailed It Property Solutions<br>(706) 844-8193</p>
      `;
    } else {
      return new Response(
        JSON.stringify({ message: "Status not a customer-facing update" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Send via Resend
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Nailed It Property Solutions <noreply@naileditpropertysolutions.com>",
        to: [customerEmail],
        subject,
        html: htmlBody,
      }),
    });

    const result = await emailResponse.json();

    return new Response(
      JSON.stringify({ message: "Customer notified", result }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
