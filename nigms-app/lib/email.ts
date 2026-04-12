import { resend } from "./resend";

const FROM = process.env.RESEND_FROM_EMAIL ?? "noreply@nigms.com";

export async function sendWelcomeEmail(
  client: { email: string; username: string },
  tempPassword: string
): Promise<void> {
  try {
    await resend.emails.send({
      from: FROM,
      to: client.email,
      subject: "Welcome to NIGMS — Your Account Details",
      html: `
        <h2>Welcome to Nailed It General Maintenance Services!</h2>
        <p>Hi ${client.username},</p>
        <p>Your account has been created. Use the credentials below to log in for the first time. You will be prompted to set a new password.</p>
        <p><strong>Username:</strong> ${client.username}</p>
        <p><strong>Temporary Password:</strong> ${tempPassword}</p>
        <p>If you have any questions, please contact us.</p>
        <p>— The NIGMS Team</p>
      `,
    });
  } catch (err) {
    console.error("[email] sendWelcomeEmail failed", { email: client.email, err });
  }
}

export async function sendPasswordResetEmail(
  client: { email: string; username: string },
  tempPassword: string
): Promise<void> {
  try {
    await resend.emails.send({
      from: FROM,
      to: client.email,
      subject: "NIGMS — Your Password Has Been Reset",
      html: `
        <h2>Password Reset</h2>
        <p>Hi ${client.username},</p>
        <p>Your password has been reset by an administrator. Use the temporary password below to log in and set a new one.</p>
        <p><strong>Username:</strong> ${client.username}</p>
        <p><strong>Temporary Password:</strong> ${tempPassword}</p>
        <p>— The NIGMS Team</p>
      `,
    });
  } catch (err) {
    console.error("[email] sendPasswordResetEmail failed", { email: client.email, err });
  }
}

export async function sendWorkOrderStatusEmail(
  client: { email: string },
  workOrder: { title: string; status: string }
): Promise<void> {
  try {
    await resend.emails.send({
      from: FROM,
      to: client.email,
      subject: `NIGMS — Work Order Update: ${workOrder.title}`,
      html: `
        <h2>Work Order Status Update</h2>
        <p>Your work order <strong>${workOrder.title}</strong> has been updated.</p>
        <p><strong>New Status:</strong> ${workOrder.status.replace("_", " ")}</p>
        <p>Log in to your portal to view details.</p>
        <p>— The NIGMS Team</p>
      `,
    });
  } catch (err) {
    console.error("[email] sendWorkOrderStatusEmail failed", { email: client.email, workOrder, err });
  }
}

export async function sendPaymentConfirmationEmail(
  client: { email: string },
  payment: { amount: number; method: string }
): Promise<void> {
  try {
    await resend.emails.send({
      from: FROM,
      to: client.email,
      subject: "NIGMS — Payment Confirmation",
      html: `
        <h2>Payment Received</h2>
        <p>We have received your payment of <strong>$${payment.amount.toFixed(2)}</strong> via ${payment.method}.</p>
        <p>Thank you for your business!</p>
        <p>— The NIGMS Team</p>
      `,
    });
  } catch (err) {
    console.error("[email] sendPaymentConfirmationEmail failed", { email: client.email, payment, err });
  }
}

export async function sendNewsletterConfirmationEmail(email: string): Promise<void> {
  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: "You're subscribed to NIGMS updates!",
      html: `
        <h2>Thanks for subscribing!</h2>
        <p>You'll receive updates from Nailed It General Maintenance Services.</p>
        <p>— The NIGMS Team</p>
      `,
    });
  } catch (err) {
    console.error("[email] sendNewsletterConfirmationEmail failed", { email, err });
  }
}

export async function sendBookingConfirmationEmail(
  email: string,
  booking: { serviceType: string; preferredDate: string }
): Promise<void> {
  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: "NIGMS — Booking Confirmation",
      html: `
        <h2>Booking Confirmed!</h2>
        <p>Thank you for booking with Nailed It General Maintenance Services.</p>
        <p><strong>Service:</strong> ${booking.serviceType}</p>
        <p><strong>Preferred Date:</strong> ${booking.preferredDate}</p>
        <p>We will be in touch to confirm your appointment.</p>
        <p>— The NIGMS Team</p>
      `,
    });
  } catch (err) {
    console.error("[email] sendBookingConfirmationEmail failed", { email, booking, err });
  }
}
