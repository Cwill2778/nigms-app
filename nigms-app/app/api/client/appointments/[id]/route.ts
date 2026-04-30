import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabase';
import { notifyAdmin } from '@/lib/notifications';

/**
 * PATCH /api/client/appointments/[id] — reschedule or cancel an appointment.
 *
 * Body: { status?: 'scheduled' | 'cancelled', scheduled_at?: string }
 *
 * - Verifies the appointment belongs to the authenticated client.
 * - Updates the appointment record.
 * - Sends an in-app notification to admin.
 *
 * Requirements: 7.3, 7.4
 */

function getServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  let body: { status?: string; scheduled_at?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { status, scheduled_at } = body;

  // Validate status value
  if (status && !['scheduled', 'cancelled'].includes(status)) {
    return NextResponse.json(
      { error: 'status must be "scheduled" or "cancelled"' },
      { status: 400 }
    );
  }

  // Validate scheduled_at when rescheduling
  if (status === 'scheduled' && !scheduled_at) {
    return NextResponse.json(
      { error: 'scheduled_at is required when rescheduling' },
      { status: 400 }
    );
  }

  const db = getServiceRoleClient();

  // Verify the appointment belongs to the authenticated client
  const { data: existing, error: fetchError } = await db
    .from('appointments')
    .select('id, client_id, status')
    .eq('id', id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
  }

  const appt = existing as { id: string; client_id: string; status: string };

  if (appt.client_id !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (appt.status === 'cancelled') {
    return NextResponse.json(
      { error: 'Cannot modify a cancelled appointment' },
      { status: 400 }
    );
  }

  // Build update payload
  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (status) updatePayload.status = status;
  if (scheduled_at) updatePayload.scheduled_at = scheduled_at;

  const { data: updated, error: updateError } = await db
    .from('appointments')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (updateError || !updated) {
    return NextResponse.json(
      { error: updateError?.message ?? 'Failed to update appointment' },
      { status: 500 }
    );
  }

  // Determine action label for notification
  // Get client profile for notification body
  const { data: clientProfile } = await db
    .from('users')
    .select('full_name, email')
    .eq('id', session.user.id)
    .single();

  const clientName =
    (clientProfile as { full_name: string | null; email: string | null } | null)?.full_name ??
    (clientProfile as { full_name: string | null; email: string | null } | null)?.email ??
    'A client';

  // Notify admin via in-app + email (Requirement 7.4, 11.1)
  const notifEvent = status === 'cancelled' ? 'appointment_cancelled' : 'appointment_rescheduled';
  await notifyAdmin(notifEvent, {
    client_name: clientName,
    appointment_id: id,
    scheduled_at: scheduled_at
      ? new Date(scheduled_at).toLocaleString()
      : undefined,
  }).catch((err) => console.error('[appointments] notifyAdmin failed', err));

  return NextResponse.json({ appointment: updated });
}
