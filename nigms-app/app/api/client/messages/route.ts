import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { notifyAdmin } from '@/lib/notifications';

/**
 * GET /api/client/messages
 *   Requires client authentication
 *   Returns messages where sender_id = userId OR recipient_id = userId
 *   Ordered by created_at ascending
 *   Optional query params: work_order_id, property_id (reserved for future filtering)
 *
 * POST /api/client/messages
 *   Requires client authentication
 *   Body: { body: string, work_order_id?: string, property_id?: string }
 *   Gets admin user ID to set as recipient
 *   Creates message: { sender_id: userId, recipient_id: adminId, sender_role: 'client', body }
 *   Creates in-app notification for admin
 *   Returns created message
 *
 * Requirements: 7.7, 11.1
 */

function getServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function getClientSession() {
  const supabase = await createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return null;

  // Verify the user is a client (not admin)
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();

  const role = (profile as { role: string } | null)?.role;
  if (!role || role === 'admin') return null;

  return session;
}

// GET /api/client/messages
export async function GET(request: NextRequest) {
  const session = await getClientSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const db = getServiceRoleClient();

  // Optional filters (reserved for future use — currently returns all messages for the user)
  const { searchParams } = new URL(request.url);
  const _workOrderId = searchParams.get('work_order_id');
  const _propertyId = searchParams.get('property_id');

  const { data, error } = await db
    .from('messages')
    .select('*')
    .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
    .order('created_at', { ascending: true });

  if (error) {
    // Table may not exist yet in dev environments
    if (error.code === '42P01') {
      return NextResponse.json({ messages: [] });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ messages: data ?? [] });
}

// POST /api/client/messages
export async function POST(request: NextRequest) {
  const session = await getClientSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  let body: { body?: string; work_order_id?: string; property_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { body: messageBody, work_order_id, property_id: _property_id } = body;

  if (!messageBody || typeof messageBody !== 'string' || !messageBody.trim()) {
    return NextResponse.json({ error: 'body is required' }, { status: 400 });
  }

  const db = getServiceRoleClient();

  // Find the admin user to set as recipient
  const { data: admins, error: adminError } = await db
    .from('users')
    .select('id')
    .eq('role', 'admin')
    .limit(1);

  if (adminError || !admins || admins.length === 0) {
    return NextResponse.json({ error: 'Admin user not found' }, { status: 500 });
  }

  const adminId = (admins[0] as { id: string }).id;

  // Create the message
  const { data: message, error: insertError } = await db
    .from('messages')
    .insert({
      sender_id: userId,
      recipient_id: adminId,
      sender_role: 'client',
      body: messageBody.trim(),
    })
    .select()
    .single();

  if (insertError || !message) {
    return NextResponse.json(
      { error: insertError?.message ?? 'Failed to create message' },
      { status: 500 }
    );
  }

  // Fetch client profile for notification context
  const { data: clientProfile } = await db
    .from('users')
    .select('full_name, username')
    .eq('id', userId)
    .single();

  const clientName =
    (clientProfile as { full_name: string | null; username: string } | null)?.full_name ??
    (clientProfile as { full_name: string | null; username: string } | null)?.username ??
    'A client';

  // Notify admin via in-app + email (Requirement 11.1)
  await notifyAdmin('new_message', {
    sender_name: clientName,
    work_order_id: work_order_id ?? (message as { id: string }).id,
  }).catch((err) => console.error('[messages] notifyAdmin failed', err));

  return NextResponse.json({ message }, { status: 201 });
}
