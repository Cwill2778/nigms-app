/**
 * Email helpers — Resend SDK wrappers with Nailed It branded templates.
 *
 * Requirements: 11.5
 */

import { Resend } from 'resend';

// Lazy-initialize so the module can be imported even when RESEND_API_KEY is absent
let _resend: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY is not set — email sending is disabled');
    return null;
  }
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const FROM = process.env.RESEND_FROM_EMAIL ?? 'Nailed It <noreply@naileditmaintenance.com>';

// ─── Branded Template ─────────────────────────────────────────────────────────

/**
 * Wraps arbitrary HTML content in the Nailed It branded email shell:
 *   - Trust Navy (#1B263B) header with logo
 *   - Precision Coral (#FF7F7F) accent footer border
 *   - Inter / sans-serif body font
 *
 * Requirement 11.5
 */
export function buildBrandedHtml(html: string): string {
  return `
    <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1B263B; padding: 24px; text-align: center;">
        <h1 style="color: #FF7F7F; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 0.1em;">NAILED IT</h1>
        <p style="color: #778DA9; margin: 4px 0 0; font-size: 12px; letter-spacing: 0.05em;">General Maintenance &amp; Property Solutions</p>
      </div>
      <div style="padding: 32px; background: #ffffff;">
        ${html}
      </div>
      <div style="background: #F4F5F7; padding: 16px; text-align: center; border-top: 2px solid #FF7F7F;">
        <p style="color: #778DA9; font-size: 12px; margin: 0;">© Nailed It General Maintenance &amp; Property Solutions</p>
      </div>
    </div>
  `;
}

/**
 * Send a branded email via Resend.
 * Wraps `html` in the Nailed It branded template (trust-navy header, precision-coral accent).
 *
 * Requirement 11.5
 */
export async function sendBrandedEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject,
      html: buildBrandedHtml(html),
    });
  } catch (err) {
    console.error('[email] sendBrandedEmail failed', { to, subject, err });
  }
}

// ─── Specific Email Helpers ───────────────────────────────────────────────────

export async function sendWelcomeEmail(
  client: { email: string; username: string },
  tempPassword: string
): Promise<void> {
  await sendBrandedEmail({
    to: client.email,
    subject: 'Welcome to Nailed It — Your Account Details',
    html: `
      <h2 style="color: #1B263B; margin-top: 0;">Welcome to Nailed It!</h2>
      <p>Hi ${client.username},</p>
      <p>Your account has been created. Use the credentials below to log in for the first time. You will be prompted to set a new password.</p>
      <p><strong>Username:</strong> ${client.username}</p>
      <p><strong>Temporary Password:</strong> ${tempPassword}</p>
      <p>If you have any questions, please contact us.</p>
      <p style="color: #778DA9;">— The Nailed It Team</p>
    `,
  });
}

export async function sendPasswordResetEmail(
  client: { email: string; username: string },
  tempPassword: string
): Promise<void> {
  await sendBrandedEmail({
    to: client.email,
    subject: 'Nailed It — Your Password Has Been Reset',
    html: `
      <h2 style="color: #1B263B; margin-top: 0;">Password Reset</h2>
      <p>Hi ${client.username},</p>
      <p>Your password has been reset by an administrator. Use the temporary password below to log in and set a new one.</p>
      <p><strong>Username:</strong> ${client.username}</p>
      <p><strong>Temporary Password:</strong> ${tempPassword}</p>
      <p style="color: #778DA9;">— The Nailed It Team</p>
    `,
  });
}

export async function sendWorkOrderStatusEmail(
  client: { email: string },
  workOrder: { title: string; status: string }
): Promise<void> {
  await sendBrandedEmail({
    to: client.email,
    subject: `Nailed It — Work Order Update: ${workOrder.title}`,
    html: `
      <h2 style="color: #1B263B; margin-top: 0;">Work Order Status Update</h2>
      <p>Your work order <strong>${workOrder.title}</strong> has been updated.</p>
      <p><strong>New Status:</strong> ${workOrder.status.replace('_', ' ')}</p>
      <p>Log in to your portal to view details.</p>
      <p style="color: #778DA9;">— The Nailed It Team</p>
    `,
  });
}

export async function sendPaymentConfirmationEmail(
  client: { email: string },
  payment: { amount: number; method: string }
): Promise<void> {
  await sendBrandedEmail({
    to: client.email,
    subject: 'Nailed It — Payment Confirmation',
    html: `
      <h2 style="color: #1B263B; margin-top: 0;">Payment Received</h2>
      <p>We have received your payment of <strong>$${payment.amount.toFixed(2)}</strong> via ${payment.method}.</p>
      <p>Thank you for your business!</p>
      <p style="color: #778DA9;">— The Nailed It Team</p>
    `,
  });
}

export async function sendNewsletterConfirmationEmail(email: string): Promise<void> {
  await sendBrandedEmail({
    to: email,
    subject: "You're subscribed to Nailed It updates!",
    html: `
      <h2 style="color: #1B263B; margin-top: 0;">Thanks for subscribing!</h2>
      <p>You'll receive updates from Nailed It General Maintenance &amp; Property Solutions.</p>
      <p style="color: #778DA9;">— The Nailed It Team</p>
    `,
  });
}

export async function sendBookingConfirmationEmail(
  client: { email: string; name: string },
  booking: { serviceType: string; preferredDate: string }
): Promise<void> {
  await sendBrandedEmail({
    to: client.email,
    subject: 'Nailed It — Quote Request Received',
    html: `
      <h2 style="color: #1B263B; margin-top: 0;">Quote Request Received!</h2>
      <p>Hi ${client.name},</p>
      <p>Thanks for reaching out to Nailed It General Maintenance &amp; Property Solutions. We've received your quote request and will get back to you within 1–2 business days.</p>
      <p><strong>Service:</strong> ${booking.serviceType}</p>
      <p><strong>Preferred Date:</strong> ${booking.preferredDate}</p>
      <p>If you have any questions in the meantime, feel free to reply to this email.</p>
      <p style="color: #778DA9;">— The Nailed It Team</p>
    `,
  });
}
