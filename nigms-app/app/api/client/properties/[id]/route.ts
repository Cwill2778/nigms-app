import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabase';

/**
 * PATCH  /api/client/properties/[id] — update property address
 *   Body: { address: string }
 *   Verifies property belongs to authenticated client.
 *   Writes audit log entry with old and new address.
 *
 * DELETE /api/client/properties/[id] — remove a property
 *   Verifies property belongs to authenticated client.
 *   Returns 400 if active subscription or open work orders exist.
 *   Deletes record if safe.
 *
 * Requirements: 7.15, 7.16, 7.17, 7.18
 */

function getServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

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

  const newAddress = address.trim();
  const db = getServiceRoleClient();

  // Verify property belongs to this client
  const { data: existing, error: fetchError } = await db
    .from('properties')
    .select('id, address, user_id')
    .eq('id', id)
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: 'Property not found' }, { status: 404 });
  }

  const oldAddress = (existing as { address: string }).address;

  // Update the address (Requirement 7.16)
  const { data: updated, error: updateError } = await db
    .from('properties')
    .update({ address: newAddress })
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Determine actor role for audit log
  const { data: profile } = await db
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();
  const actorRole = (profile as { role: string } | null)?.role ?? 'client';

  // Write audit log entry
  await db.from('audit_log').insert({
    entity_type: 'property',
    entity_id: id,
    action: 'address_updated',
    actor_id: session.user.id,
    actor_role: actorRole,
    changes: { old_address: oldAddress, new_address: newAddress },
  });

  return NextResponse.json({ property: updated });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  const supabase = await createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getServiceRoleClient();

  // Verify property belongs to this client
  const { data: property, error: fetchError } = await db
    .from('properties')
    .select('id, user_id')
    .eq('id', id)
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }
  if (!property) {
    return NextResponse.json({ error: 'Property not found' }, { status: 404 });
  }

  // Check for active subscriptions (Requirement 7.18)
  const { data: activeSubs } = await db
    .from('subscriptions')
    .select('id')
    .eq('property_id', id)
    .eq('status', 'active')
    .limit(1);

  if (activeSubs && activeSubs.length > 0) {
    return NextResponse.json(
      {
        error:
          'Cannot remove property with an active subscription. Please cancel your subscription first.',
      },
      { status: 400 }
    );
  }

  // Check for open work orders (Requirement 7.18)
  const { data: openWorkOrders } = await db
    .from('work_orders')
    .select('id')
    .eq('property_id', id)
    .not('status', 'in', '("completed","cancelled")')
    .limit(1);

  if (openWorkOrders && openWorkOrders.length > 0) {
    return NextResponse.json(
      {
        error:
          'Cannot remove property with open work orders. Please wait for all work orders to be completed or cancelled.',
      },
      { status: 400 }
    );
  }

  // Safe to delete (Requirement 7.17)
  const { error: deleteError } = await db
    .from('properties')
    .delete()
    .eq('id', id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
