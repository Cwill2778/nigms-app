import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabase';

/**
 * POST /api/notifications/[id]/read
 *   Requires authentication
 *   Sets read_at = now() for the notification
 *   Verifies notification belongs to authenticated user
 *
 * Requirements: 11.3, 11.4
 */

function getServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(
  _request: NextRequest,
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
  const db = getServiceRoleClient();

  // Verify notification belongs to the authenticated user
  const { data: existing, error: fetchError } = await db
    .from('notifications')
    .select('id, user_id, read_at')
    .eq('id', id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
  }

  const notif = existing as { id: string; user_id: string; read_at: string | null };

  if (notif.user_id !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (notif.read_at) {
    // Already marked as read — idempotent success
    return NextResponse.json({ success: true });
  }

  const { error: updateError } = await db
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
