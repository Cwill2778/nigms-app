import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabase';
import { chargeOverage } from '@/lib/overage-billing';

function getServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function verifyAdmin(): Promise<{ authenticated: boolean; isAdmin: boolean }> {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { authenticated: false, isAdmin: false };
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();
  return { authenticated: true, isAdmin: (profile as { role: string } | null)?.role === 'admin' };
}

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  const { authenticated, isAdmin } = await verifyAdmin();
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id, entryId } = await params;
  const db = getServiceRoleClient();

  // Fetch the time entry, scoped to the work order
  const { data: entry, error: fetchError } = await db
    .from('time_entries')
    .select('*')
    .eq('id', entryId)
    .eq('work_order_id', id)
    .single();

  if (fetchError || !entry) {
    return NextResponse.json({ error: 'Time entry not found' }, { status: 404 });
  }

  // Set stopped_at to current timestamp
  const stoppedAt = new Date().toISOString();
  const { data: updatedEntry, error: updateError } = await db
    .from('time_entries')
    .update({ stopped_at: stoppedAt })
    .eq('id', entryId)
    .select()
    .single();

  if (updateError || !updatedEntry) {
    return NextResponse.json(
      { error: updateError?.message ?? 'Failed to update time entry' },
      { status: 500 }
    );
  }

  // Compute duration_minutes from the DB-generated column (or calculate manually)
  const durationMinutes: number =
    (updatedEntry as { duration_minutes: number | null }).duration_minutes ??
    Math.floor(
      (new Date(stoppedAt).getTime() - new Date((entry as { started_at: string }).started_at).getTime()) / 60000
    );

  // Recompute total_billable_minutes by summing duration_minutes from all completed entries
  const { data: completedEntries } = await db
    .from('time_entries')
    .select('duration_minutes')
    .eq('work_order_id', id)
    .not('stopped_at', 'is', null);

  const totalBillableMinutes = (completedEntries ?? []).reduce(
    (sum: number, e: { duration_minutes: number | null }) => sum + (e.duration_minutes ?? 0),
    0
  );

  await db
    .from('work_orders')
    .update({
      total_billable_minutes: totalBillableMinutes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  // ── Subscription deduction & overage billing ──────────────────────────────
  // Find the work order's property to locate the client's active subscription
  const { data: workOrder } = await db
    .from('work_orders')
    .select('property_id, client_id')
    .eq('id', id)
    .single();

  if (workOrder && (workOrder as { property_id: string | null }).property_id) {
    const { data: subscription } = await db
      .from('subscriptions')
      .select('id, minutes_used, monthly_allocation_minutes, tier, stripe_customer_id')
      .eq('property_id', (workOrder as { property_id: string }).property_id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subscription) {
      const sub = subscription as {
        id: string;
        minutes_used: number;
        monthly_allocation_minutes: number;
        tier: string;
        stripe_customer_id: string | null;
      };

      const newMinutesUsed = sub.minutes_used + durationMinutes;

      // Update subscription minutes_used
      await db
        .from('subscriptions')
        .update({
          minutes_used: newMinutesUsed,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sub.id);

      // Trigger overage billing if usage exceeds allocation
      if (newMinutesUsed > sub.monthly_allocation_minutes && sub.stripe_customer_id) {
        // Calculate overage minutes only for the portion that exceeds allocation
        const overageMinutes = newMinutesUsed - sub.monthly_allocation_minutes;
        try {
          await chargeOverage(sub.stripe_customer_id, overageMinutes, sub.tier);
        } catch (overageError) {
          // Log but don't fail the request — the time entry is already recorded
          console.error('Overage billing failed:', overageError);
        }
      }
    }
  }

  return NextResponse.json(updatedEntry);
}
