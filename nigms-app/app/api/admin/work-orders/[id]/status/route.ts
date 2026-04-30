import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabase';
import type { WorkOrderStatus } from '@/lib/types';
import { notifyClient } from '@/lib/notifications';

/**
 * PATCH /api/admin/work-orders/[id]/status
 *   Requires admin authentication
 *   Body: { status: WorkOrderStatus }
 *   Gets current status before update
 *   Updates status (sets completed_at when status='completed')
 *   Writes audit log: { action: 'status_changed', changes: { old_status, new_status } }
 *   If status='completed': auto-generates invoice, notifies client
 *   Notifies client of status change
 *
 * Requirements: 9.5, 9.7
 */

const VALID_STATUSES: WorkOrderStatus[] = [
  'pending',
  'in_progress',
  'accepted',
  'completed',
  'cancelled',
];

function getServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function getAdminSession(): Promise<{ userId: string } | null> {
  const supabase = await createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();
  if ((profile as { role: string } | null)?.role !== 'admin') return null;
  return { userId: session.user.id };
}

/** Generate an invoice receipt number in format INV-YYYYMMDD-XXXX */
function generateReceiptNumber(): string {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `INV-${datePart}-${rand}`;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  let body: { status?: WorkOrderStatus };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { status } = body;
  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const db = getServiceRoleClient();

  // Fetch current work order to capture old status and client_id
  const { data: existing, error: fetchError } = await db
    .from('work_orders')
    .select('id, client_id, status, wo_number, title')
    .eq('id', id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
  }

  const wo = existing as {
    id: string;
    client_id: string;
    status: WorkOrderStatus;
    wo_number: string | null;
    title: string;
  };

  const now = new Date().toISOString();
  const updatePayload: Record<string, unknown> = {
    status,
    updated_at: now,
  };

  if (status === 'completed') {
    updatePayload.completed_at = now;
  }

  const { data: workOrder, error } = await db
    .from('work_orders')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error || !workOrder) {
    return NextResponse.json(
      { error: error?.message ?? 'Failed to update work order' },
      { status: 500 }
    );
  }

  // Write audit log entry (Requirement 9.7)
  await db.from('audit_log').insert({
    entity_type: 'work_order',
    entity_id: id,
    action: 'status_changed',
    actor_id: admin.userId,
    actor_role: 'admin',
    changes: {
      old_status: wo.status,
      new_status: status,
      timestamp: now,
    },
  });

  // Auto-generate invoice when work order is marked completed (Requirement 9.5)
  if (status === 'completed') {
    const receiptNumber = generateReceiptNumber();

    const { data: invoice, error: invoiceError } = await db
      .from('invoices')
      .insert({
        work_order_id: id,
        client_id: wo.client_id,
        receipt_number: receiptNumber,
        materials_cost: 0,
        materials_paid_by: 'company',
        client_materials_cost: 0,
        labor_cost: 0,
        total_billed: 0,
        amount_paid: 0,
      })
      .select()
      .single();

    if (!invoiceError && invoice) {
      const inv = invoice as { id: string };

      // Write audit log for invoice creation
      await db.from('audit_log').insert({
        entity_type: 'payment',
        entity_id: inv.id,
        action: 'invoice_generated',
        actor_id: admin.userId,
        actor_role: 'admin',
        changes: {
          work_order_id: id,
          receipt_number: receiptNumber,
          auto_generated: true,
        },
      });

      // Notify client that invoice is ready via in-app + email (Requirement 9.5, 11.2)
      await notifyClient(wo.client_id, 'invoice_generated', {
        title: wo.title,
        wo_number: wo.wo_number ?? id,
        work_order_id: id,
        receipt_number: receiptNumber,
        total_billed: 0,
      }).catch((err) => console.error('[status] notifyClient invoice_generated failed', err));
    }
  }

  // Notify client of status change via in-app + email (Requirement 11.2)
  await notifyClient(wo.client_id, 'work_order_status_changed', {
    title: wo.title,
    wo_number: wo.wo_number ?? id,
    work_order_id: id,
    new_status: status,
  }).catch((err) => console.error('[status] notifyClient status_changed failed', err));

  return NextResponse.json(workOrder);
}
