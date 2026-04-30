import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabase';

/**
 * GET  /api/client/properties — list properties for the authenticated client
 *   Returns each property joined with its active subscription status.
 *
 * POST /api/client/properties — create a new property
 *   Body: { address: string }
 *   Returns 409 if the address already exists for this client (case-insensitive).
 *   Writes an audit log entry on success.
 *
 * Requirements: 7.12, 7.13, 7.14
 */

function getServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET(_request: NextRequest) {
  const supabase = await createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getServiceRoleClient();

  // Join with subscriptions to include active subscription status per property
  const { data, error } = await db
    .from('properties')
    .select(`
      *,
      subscriptions (
        id,
        tier,
        status
      )
    `)
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Flatten: attach the first active subscription (if any) to each property
  const properties = (data ?? []).map((p: Record<string, unknown>) => {
    const subs = (p.subscriptions as Array<{ id: string; tier: string; status: string }> | null) ?? [];
    const activeSub = subs.find((s) => s.status === 'active') ?? null;
    const { subscriptions: _subs, ...rest } = p;
    void _subs;
    return { ...rest, subscription: activeSub };
  });

  return NextResponse.json({ properties });
}

export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { address?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { address } = body;
  if (!address || address.trim() === '') {
    return NextResponse.json({ error: 'Address is required' }, { status: 400 });
  }

  const normalizedAddress = address.trim();
  const db = getServiceRoleClient();

  // Check for duplicate address for this client (Requirement 7.14)
  const { data: existing } = await db
    .from('properties')
    .select('id')
    .eq('user_id', session.user.id)
    .ilike('address', normalizedAddress)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: 'This property address is already associated with your account.' },
      { status: 409 }
    );
  }

  const { data: property, error: insertError } = await db
    .from('properties')
    .insert({ user_id: session.user.id, address: normalizedAddress })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Determine actor role for audit log
  const { data: profile } = await db
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();
  const actorRole = (profile as { role: string } | null)?.role ?? 'client';

  // Write audit log entry (Requirement 7.13)
  await db.from('audit_log').insert({
    entity_type: 'property',
    entity_id: (property as { id: string }).id,
    action: 'created',
    actor_id: session.user.id,
    actor_role: actorRole,
    changes: { address: normalizedAddress },
  });

  return NextResponse.json({ property }, { status: 201 });
}
