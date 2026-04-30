import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabase';

/**
 * GET /api/notifications
 *   Requires authentication
 *   Returns unread in-app notifications for the authenticated user
 *   Ordered by created_at DESC
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

export async function GET() {
  const supabase = await createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getServiceRoleClient();

  const { data, error } = await db
    .from('notifications')
    .select('*')
    .eq('user_id', session.user.id)
    .is('read_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    // Gracefully handle missing table in dev environments
    if (error.code === '42P01') {
      return NextResponse.json({ notifications: [] });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ notifications: data ?? [] });
}
