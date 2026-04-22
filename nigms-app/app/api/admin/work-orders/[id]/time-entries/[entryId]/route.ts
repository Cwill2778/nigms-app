import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabase';

function getServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function verifyAdmin(): Promise<boolean> {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();
  return profile?.role === 'admin';
}

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id, entryId } = await params;
  const db = getServiceRoleClient();

  // Fetch the time entry
  const { data: entry, error: fetchError } = await db
    .from('time_entries')
    .select('*')
    .eq('id', entryId)
    .eq('work_order_id', id)
    .single();

  if (fetchError || !entry) {
    return NextResponse.json({ error: 'Time entry not found' }, { status: 404 });
  }

  if (entry.stopped_at !== null) {
    return NextResponse.json({ error: 'Time entry already stopped' }, { status: 400 });
  }

  const stoppedAt = new Date();
  const startedAt = new Date(entry.started_at);
  const durationMinutes = Math.floor((stoppedAt.getTime() - startedAt.getTime()) / 60000);

  // Stop the time entry
  const { data: updatedEntry, error: updateError } = await db
    .from('time_entries')
    .update({ stopped_at: stoppedAt.toISOString() })
    .eq('id', entryId)
    .select()
    .single();

  if (updateError || !updatedEntry) {
    return NextResponse.json(
      { error: updateError?.message ?? 'Failed to update time entry' },
      { status: 500 }
    );
  }

  // Add duration to work order's total_billable_minutes
  const { data: wo } = await db
    .from('work_orders')
    .select('total_billable_minutes')
    .eq('id', id)
    .single();

  const current = wo?.total_billable_minutes ?? 0;
  await db
    .from('work_orders')
    .update({
      total_billable_minutes: current + durationMinutes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  return NextResponse.json(updatedEntry);
}
