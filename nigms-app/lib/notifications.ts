/**
 * Notification helpers — create in-app notification records and send branded emails.
 *
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
 */

import { createClient } from '@supabase/supabase-js';
import { sendBrandedEmail } from './email';

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationEvent =
  | 'work_order_submitted'
  | 'work_order_accepted'
  | 'work_order_rejected'
  | 'work_order_status_changed'
  | 'quote_generated'
  | 'quote_approved'
  | 'invoice_generated'
  | 'invoice_paid'
  | 'appointment_rescheduled'
  | 'appointment_cancelled'
  | 'new_message'
  | 'time_allocation_alert'
  | 'emergency_dispatch';

interface NotificationPayload {
  title: string;
  body: string;
  emailSubject: string;
  emailHtml: string;
  entityType?: string;
  entityId?: string;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function getServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

function buildPayload(
  event: NotificationEvent,
  data: Record<string, unknown>
): NotificationPayload {
  switch (event) {
    case 'work_order_submitted':
      return {
        title: 'New Work Order Submitted',
        body: `A new work order "${data.title ?? ''}" (${data.wo_number ?? ''}) has been submitted.`,
        emailSubject: `New Work Order: ${data.title ?? ''}`,
        emailHtml: `
          <h2 style="color:#1B263B;margin-top:0;">New Work Order Submitted</h2>
          <p>A client has submitted a new work order.</p>
          <p><strong>Title:</strong> ${data.title ?? ''}</p>
          <p><strong>WO Number:</strong> ${data.wo_number ?? 'N/A'}</p>
          <p><strong>Urgency:</strong> ${data.urgency ?? 'standard'}</p>
          <p>Log in to the admin dashboard to review and accept.</p>
        `,
        entityType: 'work_order',
        entityId: data.work_order_id as string | undefined,
      };

    case 'work_order_accepted':
      return {
        title: 'Work Order Accepted',
        body: `Your work order "${data.title ?? ''}" (${data.wo_number ?? ''}) has been accepted.`,
        emailSubject: `Work Order Accepted: ${data.title ?? ''}`,
        emailHtml: `
          <h2 style="color:#1B263B;margin-top:0;">Work Order Accepted</h2>
          <p>Great news! Your work order has been accepted.</p>
          <p><strong>Title:</strong> ${data.title ?? ''}</p>
          <p><strong>WO Number:</strong> ${data.wo_number ?? 'N/A'}</p>
          <p>We'll be in touch to schedule the work. Log in to your portal to track progress.</p>
        `,
        entityType: 'work_order',
        entityId: data.work_order_id as string | undefined,
      };

    case 'work_order_rejected':
      return {
        title: 'Work Order Rejected',
        body: `Your work order "${data.title ?? ''}" has been rejected. Reason: ${data.reason ?? ''}`,
        emailSubject: `Work Order Update: ${data.title ?? ''}`,
        emailHtml: `
          <h2 style="color:#1B263B;margin-top:0;">Work Order Update</h2>
          <p>Unfortunately, your work order could not be accepted at this time.</p>
          <p><strong>Title:</strong> ${data.title ?? ''}</p>
          <p><strong>Reason:</strong> ${data.reason ?? 'No reason provided'}</p>
          <p>Please contact us if you have questions or would like to resubmit.</p>
        `,
        entityType: 'work_order',
        entityId: data.work_order_id as string | undefined,
      };

    case 'work_order_status_changed':
      return {
        title: 'Work Order Status Updated',
        body: `Your work order "${data.title ?? ''}" status changed to "${data.new_status ?? ''}".`,
        emailSubject: `Work Order Update: ${data.title ?? ''}`,
        emailHtml: `
          <h2 style="color:#1B263B;margin-top:0;">Work Order Status Update</h2>
          <p>Your work order status has been updated.</p>
          <p><strong>Title:</strong> ${data.title ?? ''}</p>
          <p><strong>New Status:</strong> ${String(data.new_status ?? '').replace('_', ' ')}</p>
          <p>Log in to your portal to view the latest details.</p>
        `,
        entityType: 'work_order',
        entityId: data.work_order_id as string | undefined,
      };

    case 'quote_generated':
      return {
        title: 'Quote Ready for Review',
        body: `A quote (${data.estimate_number ?? ''}) is ready for your work order "${data.title ?? ''}".`,
        emailSubject: `Quote Ready: ${data.estimate_number ?? ''}`,
        emailHtml: `
          <h2 style="color:#1B263B;margin-top:0;">Quote Ready for Review</h2>
          <p>A quote has been prepared for your work order.</p>
          <p><strong>Work Order:</strong> ${data.title ?? ''}</p>
          <p><strong>Quote Number:</strong> ${data.estimate_number ?? ''}</p>
          <p><strong>Total Amount:</strong> $${Number(data.total_amount ?? 0).toFixed(2)}</p>
          <p>Please log in to your portal to review and approve the quote.</p>
        `,
        entityType: 'work_order',
        entityId: data.work_order_id as string | undefined,
      };

    case 'quote_approved':
      return {
        title: 'Quote Approved by Client',
        body: `Client approved quote ${data.estimate_number ?? ''} for work order "${data.title ?? ''}".`,
        emailSubject: `Quote Approved: ${data.estimate_number ?? ''}`,
        emailHtml: `
          <h2 style="color:#1B263B;margin-top:0;">Quote Approved</h2>
          <p>A client has approved a quote. You can now proceed with the work.</p>
          <p><strong>Quote Number:</strong> ${data.estimate_number ?? ''}</p>
          <p><strong>Work Order:</strong> ${data.title ?? ''}</p>
        `,
        entityType: 'work_order',
        entityId: data.work_order_id as string | undefined,
      };

    case 'invoice_generated':
      return {
        title: 'Invoice Ready',
        body: `Your invoice (${data.receipt_number ?? ''}) for work order "${data.title ?? ''}" is ready.`,
        emailSubject: `Invoice Ready: ${data.receipt_number ?? ''}`,
        emailHtml: `
          <h2 style="color:#1B263B;margin-top:0;">Invoice Ready</h2>
          <p>An invoice has been generated for your completed work order.</p>
          <p><strong>Work Order:</strong> ${data.title ?? ''}</p>
          <p><strong>Invoice Number:</strong> ${data.receipt_number ?? ''}</p>
          <p><strong>Amount Due:</strong> $${Number(data.total_billed ?? 0).toFixed(2)}</p>
          <p>Please log in to your portal to review and pay your invoice.</p>
        `,
        entityType: 'work_order',
        entityId: data.work_order_id as string | undefined,
      };

    case 'invoice_paid':
      return {
        title: 'Payment Received',
        body: `Payment received for invoice ${data.receipt_number ?? ''}.`,
        emailSubject: `Payment Confirmation: ${data.receipt_number ?? ''}`,
        emailHtml: `
          <h2 style="color:#1B263B;margin-top:0;">Payment Received</h2>
          <p>We have received your payment. Thank you!</p>
          <p><strong>Invoice Number:</strong> ${data.receipt_number ?? ''}</p>
          <p><strong>Amount Paid:</strong> $${Number(data.amount ?? 0).toFixed(2)}</p>
        `,
        entityType: 'payment',
        entityId: data.invoice_id as string | undefined,
      };

    case 'appointment_rescheduled':
      return {
        title: 'Appointment Rescheduled',
        body: `An appointment has been rescheduled to ${data.scheduled_at ?? ''}.`,
        emailSubject: 'Appointment Rescheduled',
        emailHtml: `
          <h2 style="color:#1B263B;margin-top:0;">Appointment Rescheduled</h2>
          <p>${data.client_name ?? 'A client'} has rescheduled an appointment.</p>
          <p><strong>New Date/Time:</strong> ${data.scheduled_at ?? 'N/A'}</p>
          <p>Log in to the admin dashboard to review your schedule.</p>
        `,
        entityType: 'appointment',
        entityId: data.appointment_id as string | undefined,
      };

    case 'appointment_cancelled':
      return {
        title: 'Appointment Cancelled',
        body: `An appointment has been cancelled by ${data.client_name ?? 'a client'}.`,
        emailSubject: 'Appointment Cancelled',
        emailHtml: `
          <h2 style="color:#1B263B;margin-top:0;">Appointment Cancelled</h2>
          <p>${data.client_name ?? 'A client'} has cancelled an appointment.</p>
          <p>Log in to the admin dashboard to review your schedule.</p>
        `,
        entityType: 'appointment',
        entityId: data.appointment_id as string | undefined,
      };

    case 'new_message':
      return {
        title: 'New Message',
        body: `${data.sender_name ?? 'Someone'} sent you a message.`,
        emailSubject: 'New Message — Nailed It',
        emailHtml: `
          <h2 style="color:#1B263B;margin-top:0;">New Message</h2>
          <p>You have a new message from ${data.sender_name ?? 'a user'}.</p>
          <p>Log in to your portal to read and reply.</p>
        `,
        entityType: 'work_order',
        entityId: data.work_order_id as string | undefined,
      };

    case 'time_allocation_alert':
      return {
        title: 'Time Allocation Expiring Soon',
        body: `You have ${data.minutes_remaining ?? 0} unused minutes expiring in ${data.days_remaining ?? 0} days.`,
        emailSubject: 'Action Required: Unused Service Minutes Expiring Soon',
        emailHtml: `
          <h2 style="color:#1B263B;margin-top:0;">Your Service Minutes Are Expiring Soon</h2>
          <p>You have unused service minutes that will expire at the end of your current billing period.</p>
          <p><strong>Unused Minutes:</strong> ${data.minutes_remaining ?? 0}</p>
          <p><strong>Days Remaining:</strong> ${data.days_remaining ?? 0}</p>
          <p>Schedule a preventative maintenance check before your minutes expire — log in to your portal to book now.</p>
        `,
        entityType: 'subscription',
        entityId: data.subscription_id as string | undefined,
      };

    case 'emergency_dispatch':
      return {
        title: 'Emergency Dispatch Activated',
        body: `${data.client_name ?? 'A client'} has activated Emergency Dispatch for ${data.property_address ?? 'their property'}.`,
        emailSubject: '🚨 Emergency Dispatch Activated',
        emailHtml: `
          <h2 style="color:#FF7F7F;margin-top:0;">Emergency Dispatch Activated</h2>
          <p>A client has activated the Emergency Dispatch feature.</p>
          <p><strong>Client:</strong> ${data.client_name ?? 'Unknown'}</p>
          <p><strong>Property:</strong> ${data.property_address ?? 'Unknown'}</p>
          <p><strong>Time:</strong> ${data.timestamp ?? new Date().toISOString()}</p>
          <p>Please contact the client immediately.</p>
        `,
        entityType: 'work_order',
        entityId: data.work_order_id as string | undefined,
      };

    default:
      return {
        title: 'Notification',
        body: 'You have a new notification.',
        emailSubject: 'Nailed It Notification',
        emailHtml: '<p>You have a new notification. Log in to your portal for details.</p>',
      };
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Notify all admin users of an event.
 * Creates an in-app notification record and sends a branded email.
 *
 * Requirement 11.1, 11.3
 */
export async function notifyAdmin(
  event: NotificationEvent,
  data: Record<string, unknown>
): Promise<void> {
  const db = getServiceRoleClient();

  // Find all admin users
  const { data: admins, error: adminError } = await db
    .from('users')
    .select('id, email')
    .eq('role', 'admin');

  if (adminError || !admins || admins.length === 0) {
    console.warn('[notifications] notifyAdmin: no admin users found');
    return;
  }

  const payload = buildPayload(event, data);

  for (const admin of admins as { id: string; email: string | null }[]) {
    // Create in-app notification record
    await db
      .from('notifications')
      .insert({
        user_id: admin.id,
        type: event,
        title: payload.title,
        body: payload.body,
        entity_type: payload.entityType ?? null,
        entity_id: payload.entityId ?? null,
        read_at: null,
      })
      .then(() => {});

    // Send branded email
    if (admin.email) {
      await sendBrandedEmail({
        to: admin.email,
        subject: payload.emailSubject,
        html: payload.emailHtml,
      });
    }
  }
}

/**
 * Notify a specific client of an event.
 * Creates an in-app notification record and sends a branded email.
 *
 * Requirement 11.2, 11.4
 */
export async function notifyClient(
  clientId: string,
  event: NotificationEvent,
  data: Record<string, unknown>
): Promise<void> {
  const db = getServiceRoleClient();

  // Get client email
  const { data: client, error: clientError } = await db
    .from('users')
    .select('id, email')
    .eq('id', clientId)
    .single();

  if (clientError || !client) {
    console.warn('[notifications] notifyClient: client not found', { clientId });
    return;
  }

  const c = client as { id: string; email: string | null };
  const payload = buildPayload(event, data);

  // Create in-app notification record
  await db
    .from('notifications')
    .insert({
      user_id: c.id,
      type: event,
      title: payload.title,
      body: payload.body,
      entity_type: payload.entityType ?? null,
      entity_id: payload.entityId ?? null,
      read_at: null,
    })
    .then(() => {});

  // Send branded email
  if (c.email) {
    await sendBrandedEmail({
      to: c.email,
      subject: payload.emailSubject,
      html: payload.emailHtml,
    });
  }
}
