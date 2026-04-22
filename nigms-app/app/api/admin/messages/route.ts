import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

function getServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function getAdminSession() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (profile?.role !== 'admin') return null;
  return session;
}

// GET /api/admin/messages
// - Without clientId: returns all conversations grouped by client
// - With ?clientId=xxx: returns messages for that conversation ordered by created_at ASC
export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const adminId = session.user.id;
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('clientId');

  const serviceClient = getServiceRoleClient();

  // Return messages for a specific conversation
  if (clientId) {
    const { data, error } = await serviceClient
      .from('messages')
      .select('*')
      .or(
        `and(sender_id.eq.${clientId},recipient_id.eq.${adminId}),and(sender_id.eq.${adminId},recipient_id.eq.${clientId})`
      )
      .order('created_at', { ascending: true });

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ messages: [] });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ messages: data ?? [] });
  }

  // Return all conversations grouped by client
  const { data: messages, error } = await serviceClient
    .from('messages')
    .select('*')
    .or(`sender_id.eq.${adminId},recipient_id.eq.${adminId}`)
    .order('created_at', { ascending: false });

  if (error) {
    if (error.code === '42P01') {
      return NextResponse.json({ conversations: [] });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Group by client (the non-admin party)
  const clientMap = new Map<string, {
    clientId: string;
    unreadCount: number;
    lastMessage: string;
    lastMessageAt: string;
  }>();

  for (const msg of messages ?? []) {
    const clientPartyId = msg.sender_id === adminId ? msg.recipient_id : msg.sender_id;

    if (!clientMap.has(clientPartyId)) {
      clientMap.set(clientPartyId, {
        clientId: clientPartyId,
        unreadCount: 0,
        lastMessage: msg.body,
        lastMessageAt: msg.created_at,
      });
    }

    // Count unread messages sent by the client to the admin
    if (msg.sender_id === clientPartyId && msg.recipient_id === adminId && !msg.read_at) {
      const entry = clientMap.get(clientPartyId)!;
      entry.unreadCount += 1;
    }
  }

  // Fetch profiles for all client IDs
  const clientIds = Array.from(clientMap.keys());
  const profileMap = new Map<string, { first_name: string | null; last_name: string | null; username: string }>();

  if (clientIds.length > 0) {
    const { data: profiles } = await serviceClient
      .from('users')
      .select('id, first_name, last_name, username')
      .in('id', clientIds);

    for (const p of profiles ?? []) {
      profileMap.set(p.id, p);
    }
  }

  const conversations = Array.from(clientMap.values()).map((entry) => {
    const profile = profileMap.get(entry.clientId);
    const clientName = profile
      ? (profile.first_name && profile.last_name
          ? `${profile.first_name} ${profile.last_name}`
          : profile.username)
      : entry.clientId;

    return {
      clientId: entry.clientId,
      clientName,
      unreadCount: entry.unreadCount,
      lastMessage: entry.lastMessage,
    };
  });

  return NextResponse.json({ conversations });
}

// POST /api/admin/messages — send a message to a client
export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { recipientId, body: messageBody } = body as { recipientId?: string; body?: string };

  if (!recipientId || !messageBody) {
    return NextResponse.json({ error: 'recipientId and body are required' }, { status: 400 });
  }

  const serviceClient = getServiceRoleClient();

  const { data, error } = await serviceClient
    .from('messages')
    .insert({
      sender_id: session.user.id,
      recipient_id: recipientId,
      sender_role: 'admin',
      body: messageBody,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: data }, { status: 201 });
}
