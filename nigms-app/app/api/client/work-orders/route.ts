import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabase';
import type { WorkOrderStatus } from '@/lib/types';
import { notifyAdmin } from '@/lib/notifications';

/**
 * GET  /api/client/work-orders — list work orders for the authenticated client
 * POST /api/client/work-orders — create a new work order
 *   Body: { title, description?, urgency?, category?, property_id?, property_address? }
 *   Generates wo_number in format WO-YYYYMMDD-XXXX
 *   Creates work order with status='pending'
 *   Writes audit log entry
 *   Creates in-app notification for admin
 *
 * Requirements: 9.1, 9.7
 */

function getServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/** Generate a WO number in format WO-YYYYMMDD-XXXX */
function generateWoNumber(): string {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `WO-${datePart}-${rand}`;
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

  const { data, error } = await db
    .from('work_orders')
    .select('*')
    .eq('client_id', session.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ work_orders: data ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: {
    title?: string;
    description?: string;
    urgency?: string;
    category?: string;
    property_id?: string;
    property_address?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { title, description, urgency, category, property_id, property_address } = body;

  if (!title || title.trim() === '') {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  const db = getServiceRoleClient();

  // Get actor role for audit log
  const { data: profile } = await db
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();
  const actorRole = (profile as { role: string } | null)?.role ?? 'client';

  // Generate unique wo_number
  const woNumber = generateWoNumber();

  const { data: workOrder, error: insertError } = await db
    .from('work_orders')
    .insert({
      client_id: session.user.id,
      property_id: property_id ?? null,
      wo_number: woNumber,
      title: title.trim(),
      description: description ?? null,
      status: 'pending' as WorkOrderStatus,
      urgency: (urgency as 'low' | 'medium' | 'high' | 'emergency' | null) ?? null,
      category: category ?? null,
      property_address: property_address ?? null,
    })
    .select()
    .single();

  if (insertError || !workOrder) {
    return NextResponse.json(
      { error: insertError?.message ?? 'Failed to create work order' },
      { status: 500 }
    );
  }

  const wo = workOrder as { id: string; client_id: string };

  // Write audit log entry (Requirement 9.7)
  await db.from('audit_log').insert({
    entity_type: 'work_order',
    entity_id: wo.id,
    action: 'created',
    actor_id: session.user.id,
    actor_role: actorRole,
    changes: { status: 'pending', wo_number: woNumber },
  });

  // Notify admin via in-app notification + email (Requirement 9.1, 11.1)
  await notifyAdmin('work_order_submitted', {
    title: title.trim(),
    wo_number: woNumber,
    work_order_id: wo.id,
    urgency: urgency ?? 'standard',
  }).catch((err) => console.error('[work-orders] notifyAdmin failed', err));

  return NextResponse.json({ work_order: workOrder }, { status: 201 });
}
