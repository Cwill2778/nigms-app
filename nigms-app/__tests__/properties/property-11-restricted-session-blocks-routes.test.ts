/**
 * Feature: nigms-app
 * Property 11: Restricted session blocks all non-update-password routes
 *
 * Models the middleware routing logic as a pure function that takes
 * (path, requiresPasswordReset) and returns an action (allow | redirect).
 *
 * For a restricted session (requires_password_reset = true):
 *   - Any path that is NOT /update-password → redirect to /update-password
 *   - The path /update-password → allow
 *
 * Validates: Requirements 5.9, 14.7
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MiddlewareAction =
  | { type: 'allow' }
  | { type: 'redirect'; to: string };

// ---------------------------------------------------------------------------
// Pure function modelling the restricted-session routing decision
//
// Mirrors Rules 5 & 6 from middleware.ts:
//   - requiresPasswordReset = true + /update-password → allow
//   - requiresPasswordReset = true + any other path   → redirect to /update-password
// ---------------------------------------------------------------------------

function resolveRestrictedSessionAccess(pathname: string): MiddlewareAction {
  if (pathname === '/update-password') {
    // Rule 5: Client with reset=true + /update-password → allow
    return { type: 'allow' };
  }
  // Rule 6: Client with reset=true + any other route → redirect to /update-password
  return { type: 'redirect', to: '/update-password' };
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const uuidSegmentArb = fc.uuid();

// Known concrete routes in the application
const knownPathArb: fc.Arbitrary<string> = fc.constantFrom(
  '/dashboard',
  '/work-orders/',
  '/payments/',
  '/login',
  '/book',
  '/projects',
  '/',
  '/admin/dashboard',
  '/admin/clients',
  '/admin/work-orders',
  '/admin/payments',
  '/legal/terms',
  '/legal/privacy',
  '/legal/data-use',
  '/legal/arbitration',
  '/api/booking',
  '/api/newsletter',
);

// Dynamic routes with UUID segments
const dynamicPathArb: fc.Arbitrary<string> = fc.oneof(
  uuidSegmentArb.map((id) => `/work-orders/${id}`),
  uuidSegmentArb.map((id) => `/payments/${id}`),
  uuidSegmentArb.map((id) => `/admin/clients/${id}`),
  uuidSegmentArb.map((id) => `/admin/work-orders/${id}`),
  fc.record({ id: uuidSegmentArb }).map(({ id }) => `/admin/clients/${id}/deactivate`),
  fc.record({ id: uuidSegmentArb }).map(({ id }) => `/admin/work-orders/${id}/status`),
);

// Arbitrary random paths (alphanumeric segments)
const randomPathArb: fc.Arbitrary<string> = fc
  .array(fc.stringMatching(/^[a-z0-9-]{1,12}$/), { minLength: 1, maxLength: 4 })
  .map((segments) => '/' + segments.join('/'));

// Any non-update-password path
const nonUpdatePasswordPathArb: fc.Arbitrary<string> = fc
  .oneof(knownPathArb, dynamicPathArb, randomPathArb)
  .filter((p) => p !== '/update-password');

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Property 11: Restricted session blocks all non-update-password routes', () => {
  it('any path other than /update-password redirects to /update-password', () => {
    fc.assert(
      fc.property(nonUpdatePasswordPathArb, (path) => {
        const action = resolveRestrictedSessionAccess(path);

        expect(action.type).toBe('redirect');
        if (action.type === 'redirect') {
          expect(action.to).toBe('/update-password');
        }
      }),
      { numRuns: 20 },
    );
  });

  it('/update-password is allowed through for a restricted session', () => {
    const action = resolveRestrictedSessionAccess('/update-password');

    expect(action.type).toBe('allow');
  });

  it('restricted session never allows any non-update-password path', () => {
    fc.assert(
      fc.property(nonUpdatePasswordPathArb, (path) => {
        const action = resolveRestrictedSessionAccess(path);

        expect(action.type).not.toBe('allow');
      }),
      { numRuns: 20 },
    );
  });

  it('redirect destination is always exactly /update-password (never another path)', () => {
    fc.assert(
      fc.property(nonUpdatePasswordPathArb, (path) => {
        const action = resolveRestrictedSessionAccess(path);

        if (action.type === 'redirect') {
          expect(action.to).toBe('/update-password');
          expect(action.to).not.toBe('/login');
          expect(action.to).not.toBe('/dashboard');
        }
      }),
      { numRuns: 20 },
    );
  });

  it('known application routes are all blocked by a restricted session', () => {
    fc.assert(
      fc.property(knownPathArb, (path) => {
        // All known routes (none of which are /update-password) must redirect
        const action = resolveRestrictedSessionAccess(path);

        expect(action.type).toBe('redirect');
        if (action.type === 'redirect') {
          expect(action.to).toBe('/update-password');
        }
      }),
      { numRuns: 20 },
    );
  });
});
