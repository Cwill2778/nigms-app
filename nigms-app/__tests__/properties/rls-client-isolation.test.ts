/**
 * Feature: nigms-app
 * Property 10: Client data isolation via RLS
 *
 * Models the RLS filtering logic as a pure function and verifies that
 * querying work_orders or payments as client A never returns records
 * belonging to client B.
 *
 * Validates: Requirements 5.6, 13.3
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { WorkOrder, Payment, WorkOrderStatus, PaymentStatus, PaymentMethod } from '../../lib/types';

// ---------------------------------------------------------------------------
// Pure functions that model the RLS policy enforced at the DB level:
//   client_id = auth.uid() AND requires_password_reset = false
// ---------------------------------------------------------------------------

interface ClientSession {
  uid: string;
  requires_password_reset: boolean;
}

function filterWorkOrdersByRLS(
  records: WorkOrder[],
  session: ClientSession,
): WorkOrder[] {
  if (session.requires_password_reset) return [];
  return records.filter((r) => r.client_id === session.uid);
}

function filterPaymentsByRLS(
  records: Payment[],
  session: ClientSession,
): Payment[] {
  if (session.requires_password_reset) return [];
  return records.filter((r) => r.client_id === session.uid);
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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Property 10: Client data isolation via RLS', () => {
  it('work_orders: filtering as client A never returns records belonging to client B', () => {
    fc.assert(
      fc.property(
        // Two distinct client UUIDs
        fc.tuple(uuidArb, uuidArb).filter(([a, b]) => a !== b),
        // A mix of work orders belonging to A, B, or neither
        fc.array(
          fc.oneof(
            workOrderArb(uuidArb),          // random client (could be A, B, or other)
            workOrderArb(fc.constant('')),  // no client
          ),
          { minLength: 0, maxLength: 50 },
        ),
        ([clientA, clientB], randomRecords) => {
          // Seed some records explicitly for A and B
          const recordsForA = Array.from({ length: 3 }, (_, i) => ({
            id: `a-${i}`,
            client_id: clientA,
            property_id: null,
            title: `Work order for A ${i}`,
            description: null,
            status: 'pending' as WorkOrderStatus,
            quoted_amount: null,
            wo_number: null,
            urgency: null,
            category: null,
            property_address: null,
            inspection_notes: null,
            accepted_at: null,
            completed_at: null,
            total_billable_minutes: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }));

          const recordsForB = Array.from({ length: 3 }, (_, i) => ({
            id: `b-${i}`,
            client_id: clientB,
            property_id: null,
            title: `Work order for B ${i}`,
            description: null,
            status: 'pending' as WorkOrderStatus,
            quoted_amount: null,
            wo_number: null,
            urgency: null,
            category: null,
            property_address: null,
            inspection_notes: null,
            accepted_at: null,
            completed_at: null,
            total_billable_minutes: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }));

          const allRecords = [...recordsForA, ...recordsForB, ...randomRecords];

          const sessionA: ClientSession = { uid: clientA, requires_password_reset: false };
          const result = filterWorkOrdersByRLS(allRecords, sessionA);

          // No record in the result should belong to client B
          const leakedRecords = result.filter((r) => r.client_id === clientB);
          expect(leakedRecords).toHaveLength(0);

          // All returned records must belong to client A
          result.forEach((r) => {
            expect(r.client_id).toBe(clientA);
          });
        },
      ),
      { numRuns: 20 },
    );
  });

  it('payments: filtering as client A never returns records belonging to client B', () => {
    fc.assert(
      fc.property(
        fc.tuple(uuidArb, uuidArb).filter(([a, b]) => a !== b),
        fc.array(
          fc.oneof(
            paymentArb(uuidArb),
            paymentArb(fc.constant('')),
          ),
          { minLength: 0, maxLength: 50 },
        ),
        ([clientA, clientB], randomRecords) => {
          const paymentsForA = Array.from({ length: 3 }, (_, i) => ({
            id: `pa-${i}`,
            work_order_id: `wo-a-${i}`,
            client_id: clientA,
            amount: 100,
            method: 'stripe' as PaymentMethod,
            status: 'paid' as PaymentStatus,
            stripe_payment_intent_id: null,
            receipt_number: null,
            notes: null,
            payment_date: null,
            created_at: new Date().toISOString(),
          }));

          const paymentsForB = Array.from({ length: 3 }, (_, i) => ({
            id: `pb-${i}`,
            work_order_id: `wo-b-${i}`,
            client_id: clientB,
            amount: 200,
            method: 'manual' as PaymentMethod,
            status: 'pending' as PaymentStatus,
            stripe_payment_intent_id: null,
            receipt_number: null,
            notes: null,
            payment_date: null,
            created_at: new Date().toISOString(),
          }));

          const allRecords = [...paymentsForA, ...paymentsForB, ...randomRecords];

          const sessionA: ClientSession = { uid: clientA, requires_password_reset: false };
          const result = filterPaymentsByRLS(allRecords, sessionA);

          const leakedRecords = result.filter((r) => r.client_id === clientB);
          expect(leakedRecords).toHaveLength(0);

          result.forEach((r) => {
            expect(r.client_id).toBe(clientA);
          });
        },
      ),
      { numRuns: 20 },
    );
  });

  it('work_orders: result contains all records belonging to client A', () => {
    fc.assert(
      fc.property(
        fc.tuple(uuidArb, uuidArb).filter(([a, b]) => a !== b),
        fc.array(workOrderArb(fc.constant('')), { minLength: 0, maxLength: 20 }),
        fc.integer({ min: 1, max: 10 }),
        ([clientA, clientB], otherRecords, countA) => {
          const recordsForA: WorkOrder[] = Array.from({ length: countA }, (_, i) => ({
            id: `a-${i}`,
            client_id: clientA,
            property_id: null,
            title: `WO ${i}`,
            description: null,
            status: 'pending' as WorkOrderStatus,
            quoted_amount: null,
            wo_number: null,
            urgency: null,
            category: null,
            property_address: null,
            inspection_notes: null,
            accepted_at: null,
            completed_at: null,
            total_billable_minutes: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }));

          const recordsForB: WorkOrder[] = Array.from({ length: 3 }, (_, i) => ({
            id: `b-${i}`,
            client_id: clientB,
            property_id: null,
            title: `WO B ${i}`,
            description: null,
            status: 'pending' as WorkOrderStatus,
            quoted_amount: null,
            wo_number: null,
            urgency: null,
            category: null,
            property_address: null,
            inspection_notes: null,
            accepted_at: null,
            completed_at: null,
            total_billable_minutes: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }));

          const allRecords = [...recordsForA, ...recordsForB, ...otherRecords];
          const sessionA: ClientSession = { uid: clientA, requires_password_reset: false };
          const result = filterWorkOrdersByRLS(allRecords, sessionA);

          // Must return exactly the records for A
          expect(result).toHaveLength(countA);
          result.forEach((r) => expect(r.client_id).toBe(clientA));
        },
      ),
      { numRuns: 20 },
    );
  });

  it('work_orders: restricted session (requires_password_reset=true) returns zero records', () => {
    fc.assert(
      fc.property(
        uuidArb,
        fc.array(workOrderArb(uuidArb), { minLength: 1, maxLength: 30 }),
        (clientId, records) => {
          const restrictedSession: ClientSession = {
            uid: clientId,
            requires_password_reset: true,
          };
          const result = filterWorkOrdersByRLS(records, restrictedSession);
          expect(result).toHaveLength(0);
        },
      ),
      { numRuns: 20 },
    );
  });

  it('payments: restricted session (requires_password_reset=true) returns zero records', () => {
    fc.assert(
      fc.property(
        uuidArb,
        fc.array(paymentArb(uuidArb), { minLength: 1, maxLength: 30 }),
        (clientId, records) => {
          const restrictedSession: ClientSession = {
            uid: clientId,
            requires_password_reset: true,
          };
          const result = filterPaymentsByRLS(records, restrictedSession);
          expect(result).toHaveLength(0);
        },
      ),
      { numRuns: 20 },
    );
  });
});
