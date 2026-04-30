/**
 * Feature: nigms-app
 * Property 19: Admin sees all records across all clients
 *
 * Models the RLS admin policy as a pure function and verifies that
 * querying work_orders or payments as an admin returns every record
 * regardless of which client it belongs to — no record is filtered out.
 *
 * Validates: Requirements 10.1, 10.2, 13.4
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type {
  WorkOrder,
  Payment,
  WorkOrderStatus,
  PaymentStatus,
  PaymentMethod,
} from '../../lib/types';

// ---------------------------------------------------------------------------
// Pure functions that model the RLS admin policies:
//   "admin_all_work_orders" / "admin_all_payments"
//   USING ( EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin') )
//
// For an admin session every record passes the policy — no filtering occurs.
// For a non-admin session the admin policy does not apply (returns nothing here).
// ---------------------------------------------------------------------------

type UserRole = 'admin' | 'client';

interface AdminSession {
  uid: string;
  role: UserRole;
}

function filterWorkOrdersByAdminRLS(
  records: WorkOrder[],
  session: AdminSession,
): WorkOrder[] {
  // Admin policy: full access — return all records unchanged
  if (session.role === 'admin') return records;
  // Non-admin: admin policy does not grant access
  return [];
}

function filterPaymentsByAdminRLS(
  records: Payment[],
  session: AdminSession,
): Payment[] {
  if (session.role === 'admin') return records;
  return [];
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const uuidArb = fc.uuid();

const workOrderStatusArb = fc.constantFrom<WorkOrderStatus>(
  'pending',
  'in_progress',
  'completed',
  'cancelled',
);

const paymentStatusArb = fc.constantFrom<PaymentStatus>('pending', 'paid', 'failed');
const paymentMethodArb = fc.constantFrom<PaymentMethod>('stripe', 'manual');

function workOrderArb(clientIdArb: fc.Arbitrary<string>): fc.Arbitrary<WorkOrder> {
  return fc.record<WorkOrder>({
    id: uuidArb,
    client_id: clientIdArb,
    property_id: fc.option(fc.uuid(), { nil: null }),
    title: fc.string({ minLength: 1, maxLength: 80 }),
    description: fc.option(fc.string({ maxLength: 200 }), { nil: null }),
    status: workOrderStatusArb,
    quoted_amount: fc.option(fc.float({ min: 1, max: 100_000, noNaN: true }), { nil: null }),
    wo_number: fc.option(fc.string({ minLength: 5, maxLength: 20 }), { nil: null }),
    urgency: fc.option(fc.constantFrom('low', 'medium', 'high', 'emergency'), { nil: null }),
    category: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
    property_address: fc.option(fc.string({ minLength: 10, maxLength: 100 }), { nil: null }),
    inspection_notes: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
    accepted_at: fc.option(fc.constant(new Date().toISOString()), { nil: null }),
    completed_at: fc.option(fc.constant(new Date().toISOString()), { nil: null }),
    total_billable_minutes: fc.integer({ min: 0, max: 10000 }),
    created_at: fc.constant(new Date().toISOString()),
    updated_at: fc.constant(new Date().toISOString()),
  });
}

function paymentArb(clientIdArb: fc.Arbitrary<string>): fc.Arbitrary<Payment> {
  return fc.record<Payment>({
    id: uuidArb,
    work_order_id: uuidArb,
    client_id: clientIdArb,
    amount: fc.float({ min: 1, max: 100_000, noNaN: true }),
    method: paymentMethodArb,
    status: paymentStatusArb,
    stripe_payment_intent_id: fc.option(fc.string({ minLength: 10, maxLength: 50 }), { nil: null }),
    receipt_number: fc.option(fc.string({ minLength: 5, maxLength: 20 }), { nil: null }),
    notes: fc.option(fc.string({ maxLength: 200 }), { nil: null }),
    payment_date: fc.option(fc.constant(new Date().toISOString().split('T')[0]), { nil: null }),
    created_at: fc.constant(new Date().toISOString()),
  });
}

// Generate an array of work orders spread across an arbitrary set of client IDs
const multiClientWorkOrdersArb = fc
  .array(uuidArb, { minLength: 1, maxLength: 10 })
  .chain((clientIds) =>
    fc.array(
      fc.oneof(...clientIds.map((id) => workOrderArb(fc.constant(id)))),
      { minLength: 1, maxLength: 50 },
    ).map((records) => ({ clientIds, records })),
  );

const multiClientPaymentsArb = fc
  .array(uuidArb, { minLength: 1, maxLength: 10 })
  .chain((clientIds) =>
    fc.array(
      fc.oneof(...clientIds.map((id) => paymentArb(fc.constant(id)))),
      { minLength: 1, maxLength: 50 },
    ).map((records) => ({ clientIds, records })),
  );

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Property 19: Admin sees all records across all clients', () => {
  it('work_orders: admin query returns every record regardless of client_id', () => {
    fc.assert(
      fc.property(
        uuidArb,                      // admin user ID
        multiClientWorkOrdersArb,     // records spread across multiple clients
        (adminId, { records }) => {
          const adminSession: AdminSession = { uid: adminId, role: 'admin' };
          const result = filterWorkOrdersByAdminRLS(records, adminSession);

          // Admin must see ALL records — count must match exactly
          expect(result).toHaveLength(records.length);

          // Every original record must appear in the result
          const resultIds = new Set(result.map((r) => r.id));
          records.forEach((r) => {
            expect(resultIds.has(r.id)).toBe(true);
          });
        },
      ),
      { numRuns: 20 },
    );
  });

  it('payments: admin query returns every record regardless of client_id', () => {
    fc.assert(
      fc.property(
        uuidArb,
        multiClientPaymentsArb,
        (adminId, { records }) => {
          const adminSession: AdminSession = { uid: adminId, role: 'admin' };
          const result = filterPaymentsByAdminRLS(records, adminSession);

          expect(result).toHaveLength(records.length);

          const resultIds = new Set(result.map((r) => r.id));
          records.forEach((r) => {
            expect(resultIds.has(r.id)).toBe(true);
          });
        },
      ),
      { numRuns: 20 },
    );
  });

  it('work_orders: admin sees records from all distinct clients in the result', () => {
    fc.assert(
      fc.property(
        uuidArb,
        multiClientWorkOrdersArb,
        (adminId, { records }) => {
          const adminSession: AdminSession = { uid: adminId, role: 'admin' };
          const result = filterWorkOrdersByAdminRLS(records, adminSession);

          // Every client that has at least one record must be represented in the result
          const clientsInRecords = new Set(records.map((r) => r.client_id));
          const clientsInResult = new Set(result.map((r) => r.client_id));

          clientsInRecords.forEach((cid) => {
            expect(clientsInResult.has(cid)).toBe(true);
          });
        },
      ),
      { numRuns: 20 },
    );
  });

  it('payments: admin sees records from all distinct clients in the result', () => {
    fc.assert(
      fc.property(
        uuidArb,
        multiClientPaymentsArb,
        (adminId, { records }) => {
          const adminSession: AdminSession = { uid: adminId, role: 'admin' };
          const result = filterPaymentsByAdminRLS(records, adminSession);

          const clientsInRecords = new Set(records.map((r) => r.client_id));
          const clientsInResult = new Set(result.map((r) => r.client_id));

          clientsInRecords.forEach((cid) => {
            expect(clientsInResult.has(cid)).toBe(true);
          });
        },
      ),
      { numRuns: 20 },
    );
  });

  it('work_orders: non-admin session does not receive admin-level access', () => {
    fc.assert(
      fc.property(
        uuidArb,
        multiClientWorkOrdersArb,
        (clientId, { records }) => {
          const clientSession: AdminSession = { uid: clientId, role: 'client' };
          const result = filterWorkOrdersByAdminRLS(records, clientSession);

          // The admin policy must not apply to a client — result is empty from this policy
          expect(result).toHaveLength(0);
        },
      ),
      { numRuns: 20 },
    );
  });

  it('payments: non-admin session does not receive admin-level access', () => {
    fc.assert(
      fc.property(
        uuidArb,
        multiClientPaymentsArb,
        (clientId, { records }) => {
          const clientSession: AdminSession = { uid: clientId, role: 'client' };
          const result = filterPaymentsByAdminRLS(records, clientSession);

          expect(result).toHaveLength(0);
        },
      ),
      { numRuns: 20 },
    );
  });
});
