import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { notifyAdmin } from '@/lib/notifications';

/**
 * POST /api/client/emergency-dispatch
 *
 * Requires client authentication.
 * Gets client name and first property from database.
 * Notifies admin via in-app notification + email using notifyAdmin helper.
 * Returns: { success: true }
 *
 * Requirements: 8.9, 11.1
 */

function getServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export async function POST() {
  // Authenticate the client
  const supabase = await createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify the user is a client (not admin)
  const { data: profile } = await supabase
    .from('users')
    .select('role, full_name, username')
    .eq('id', session.user.id)
    .single();

  const role = (profile as { role: string } | null)?.role;
  if (!role || role === 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const clientName =
    (profile as { role: string; full_name: string | null; username: string } | null)
      ?.full_name ??
    (profile as { role: string; full_name: string | null; username: string } | null)
      ?.username ??
    'A client';

  const db = getServiceRoleClient();

  // Get the client's first property
  const { data: properties } = await db
    .from('properties')
    .select('address')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1);

  const propertyAddress =
    ((properties ?? []) as { address: string }[])[0]?.address ?? 'Unknown property';

  const timestamp = new Date().toISOString();

  // Notify admin via in-app notification + email (Requirement 8.9, 11.1)
  await notifyAdmin('emergency_dispatch', {
    client_name: clientName,
    property_address: propertyAddress,
    timestamp,
  }).catch((err) => console.error('[emergency-dispatch] notifyAdmin failed', err));

  return NextResponse.json({ success: true });
}
