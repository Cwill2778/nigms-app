/**
 * Feature: nigms-app
 * Property 25: Restricted session blocks work_orders and payments at DB level
 *
 * Models the RLS client_own_work_orders and client_own_payments policies as
 * pure functions and verifies that a user with requires_password_reset = true
 * receives zero rows — the policy denies access at the database level.
 *
 * RLS policy condition (both tables):
 *   client_id = auth.uid()
 *   AND EXISTS (
 *     SELECT 1 FROM public.users u
 *     WHERE u.id = auth.uid()
 *       AND u.requires_password_reset = false
 *   )
 *
 * Validates: Requirements 13.6
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type {
  UserProfile,
  WorkOrder,
  Payment,
  WorkOrderStatus,
  PaymentStatus,
  PaymentMethod,
} from '../../lib/types';

// ---------------------------------------------------------------------------
// Pure functions modelling the RLS policies
// ---------------------------------------------------------------------------

/**
 * Models "client_own_work_orders" RLS policy:
 *   client_id = auth.uid()
 *   AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND requires_password_reset = false)
 */
function filterWorkOrdersByClientRLS(
  records: WorkOrder[],
  currentUser: UserProfile,
): WorkOrder[] {
  // The EXISTS sub-select fails when requires_password_reset = true → zero rows
  if (currentUser.requires_password_reset) return [];

  return records.filter((r) => r.client_id === currentUser.id);
}

/**
 * Models "client_own_payments" RLS policy:
 *   client_id = auth.uid()
 *   AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND requires_password_reset = false)
 */
function filterPaymentsByClientRLS(
  records: Payment[],
  currentUser: UserProfile,
): Payment[] {
  if (currentUser.requires_password_reset) return [];

  return records.filter((r) => r.client_id === currentUser.id);
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

function userProfileArb(requiresPasswordReset: boolean): fc.Arbitrary<UserProfile> {
  return fc.record<UserProfile>({
    id: uuidArb,
    username: fc.string({ minLength: 3, maxLength: 20 }),
    role: fc.constant('client'),
    is_active: fc.boolean(),
    requires_password_reset: fc.constant(requiresPasswordReset),
    created_at: fc.constant(new Date().toISOString()),
  });
}

function workOrderArb(clientIdArb: fc.Arbitrary<string>): fc.Arbitrary<WorkOrder> {
  return fc.record<WorkOrder>({
    id: uuidArb,
    client_id: clientIdArb,
    title: fc.string({ minLength: 1, maxLength: 80 }),
    description: fc.option(fc.string({ maxLength: 200 }), { nil: null }),
    status: workOrderStatusArb,
    quoted_amount: fc.option(fc.float({ min: 1, max: 100_000, noNaN: true }), { nil: null }),
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
    created_at: fc.constant(new Date().toISOString()),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Property 25: Restricted session blocks work_orders and payments at DB level', () => {
  // -------------------------------------------------------------------------
  // Restricted session (requires_password_reset = true) → zero rows
  // -------------------------------------------------------------------------

  it('work_orders: restricted user receives zero rows even when they own records', () => {
    fc.assert(
      fc.property(
        userProfileArb(true).chain((user) =>
          fc
            .array(workOrderArb(fc.constant(user.id)), { minLength: 1, maxLength: 20 })
            .map((records) => ({ user, records })),
        ),
        ({ user, records }) => {
          // All records belong to this user — but the session is restricted
          expect(user.requires_password_reset).toBe(true);

          const result = filterWorkOrdersByClientRLS(records, user);

          // RLS must return zero rows for a restricted session
          expect(result).toHaveLength(0);
        },
      ),
      { numRuns: 20 },
    );
  });

  it('payments: restricted user receives zero rows even when they own records', () => {
    fc.assert(
      fc.property(
        userProfileArb(true).chain((user) =>
          fc
            .array(paymentArb(fc.constant(user.id)), { minLength: 1, maxLength: 20 })
            .map((records) => ({ user, records })),
        ),
        ({ user, records }) => {
          expect(user.requires_password_reset).toBe(true);

          const result = filterPaymentsByClientRLS(records, user);

          expect(result).toHaveLength(0);
        },
      ),
      { numRuns: 20 },
    );
  });

  it('work_orders: restricted user receives zero rows from a mixed-client dataset', () => {
    fc.assert(
      fc.property(
        userProfileArb(true),
        fc.array(uuidArb, { minLength: 1, maxLength: 5 }).chain((otherIds) =>
          fc.array(
            fc.oneof(...otherIds.map((id) => workOrderArb(fc.constant(id)))),
            { minLength: 0, maxLength: 30 },
          ),
        ),
        (restrictedUser, otherRecords) => {
          // Mix in some records that belong to the restricted user
          const ownRecords = Array.from({ length: 3 }, (_, i) => ({
            id: `own-${i}`,
            client_id: restrictedUser.id,
            title: `My Work Order ${i}`,
            description: null,
            status: 'pending' as WorkOrderStatus,
            quoted_amount: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }));

          const allRecords = [...otherRecords, ...ownRecords];
          const result = filterWorkOrdersByClientRLS(allRecords, restrictedUser);

          expect(result).toHaveLength(0);
        },
      ),
      { numRuns: 20 },
    );
  });

  it('payments: restricted user receives zero rows from a mixed-client dataset', () => {
    fc.assert(
      fc.property(
        userProfileArb(true),
        fc.array(uuidArb, { minLength: 1, maxLength: 5 }).chain((otherIds) =>
          fc.array(
            fc.oneof(...otherIds.map((id) => paymentArb(fc.constant(id)))),
            { minLength: 0, maxLength: 30 },
          ),
        ),
        (restrictedUser, otherRecords) => {
          const ownRecords = Array.from({ length: 3 }, (_, i) => ({
            id: `own-pay-${i}`,
            work_order_id: `wo-${i}`,
            client_id: restrictedUser.id,
            amount: 100,
            method: 'stripe' as PaymentMethod,
            status: 'paid' as PaymentStatus,
            stripe_payment_intent_id: null,
            created_at: new Date().toISOString(),
          }));

          const allRecords = [...otherRecords, ...ownRecords];
          const result = filterPaymentsByClientRLS(allRecords, restrictedUser);

          expect(result).toHaveLength(0);
        },
      ),
      { numRuns: 20 },
    );
  });

  // -------------------------------------------------------------------------
  // Non-restricted session (requires_password_reset = false) → own rows only
  // -------------------------------------------------------------------------

  it('work_orders: non-restricted user can see their own records', () => {
    fc.assert(
      fc.property(
        userProfileArb(false).chain((user) =>
          fc
            .array(workOrderArb(fc.constant(user.id)), { minLength: 1, maxLength: 20 })
            .map((ownRecords) => ({ user, ownRecords })),
        ),
        ({ user, ownRecords }) => {
          expect(user.requires_password_reset).toBe(false);

          const result = filterWorkOrdersByClientRLS(ownRecords, user);

          // All own records must be visible
          expect(result).toHaveLength(ownRecords.length);
          result.forEach((r) => expect(r.client_id).toBe(user.id));
        },
      ),
      { numRuns: 20 },
    );
  });

  it('payments: non-restricted user can see their own records', () => {
    fc.assert(
      fc.property(
        userProfileArb(false).chain((user) =>
          fc
            .array(paymentArb(fc.constant(user.id)), { minLength: 1, maxLength: 20 })
            .map((ownRecords) => ({ user, ownRecords })),
        ),
        ({ user, ownRecords }) => {
          expect(user.requires_password_reset).toBe(false);

          const result = filterPaymentsByClientRLS(ownRecords, user);

          expect(result).toHaveLength(ownRecords.length);
          result.forEach((r) => expect(r.client_id).toBe(user.id));
        },
      ),
      { numRuns: 20 },
    );
  });

  it('work_orders: non-restricted user only sees their own records, not others', () => {
    fc.assert(
      fc.property(
        userProfileArb(false),
        fc.array(uuidArb, { minLength: 1, maxLength: 5 }).chain((otherIds) =>
          fc.array(
            fc.oneof(...otherIds.map((id) => workOrderArb(fc.constant(id)))),
            { minLength: 1, maxLength: 20 },
          ),
        ),
        (user, otherRecords) => {
          // None of these records belong to the current user
          const result = filterWorkOrdersByClientRLS(otherRecords, user);

          result.forEach((r) => expect(r.client_id).toBe(user.id));
        },
      ),
      { numRuns: 20 },
    );
  });

  it('payments: non-restricted user only sees their own records, not others', () => {
    fc.assert(
      fc.property(
        userProfileArb(false),
        fc.array(uuidArb, { minLength: 1, maxLength: 5 }).chain((otherIds) =>
          fc.array(
            fc.oneof(...otherIds.map((id) => paymentArb(fc.constant(id)))),
            { minLength: 1, maxLength: 20 },
          ),
        ),
        (user, otherRecords) => {
          const result = filterPaymentsByClientRLS(otherRecords, user);

          result.forEach((r) => expect(r.client_id).toBe(user.id));
        },
      ),
      { numRuns: 20 },
    );
  });
});
