/**
 * Feature: nigms-app
 * Property 29: Normal session cannot access /update-password
 *
 * Models the middleware routing logic as a pure function that takes
 * (path, requiresPasswordReset=false) and returns an action (allow | redirect).
 *
 * For a normal session (requires_password_reset = false):
 *   - /update-password → redirect to /dashboard
 *   - Any other client route → allow
 *
 * Validates: Requirements 14.8
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
// Pure function modelling the normal-session routing decision
//
// Mirrors Rules 7 & 8 from middleware.ts (requiresPasswordReset = false branch):
//   - /update-password → redirect to /dashboard
//   - any other route  → allow
// ---------------------------------------------------------------------------

function resolveNormalSessionAccess(pathname: string): MiddlewareAction {
  if (pathname === '/update-password') {
    // Rule 7: Client with reset=false + /update-password → redirect to /dashboard
    return { type: 'redirect', to: '/dashboard' };
  }
  // Rule 8: Client with reset=false + client route → allow
  return { type: 'allow' };
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const uuidSegmentArb = fc.uuid();

// Known concrete client routes in the application
const knownClientPathArb: fc.Arbitrary<string> = fc.constantFrom(
  '/dashboard',
  '/work-orders/',
  '/payments/',
  '/login',
  '/book',
  '/projects',
  '/',
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
);

// Arbitrary random paths (alphanumeric segments)
const randomPathArb: fc.Arbitrary<string> = fc
  .array(fc.stringMatching(/^[a-z0-9-]{1,12}$/), { minLength: 1, maxLength: 4 })
  .map((segments) => '/' + segments.join('/'));

// Any path that is NOT /update-password
const nonUpdatePasswordPathArb: fc.Arbitrary<string> = fc
  .oneof(knownClientPathArb, dynamicPathArb, randomPathArb)
  .filter((p) => p !== '/update-password');

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Property 29: Normal session cannot access /update-password', () => {
  it('/update-password always redirects to /dashboard for a normal session', () => {
    const action = resolveNormalSessionAccess('/update-password');

    expect(action.type).toBe('redirect');
    if (action.type === 'redirect') {
      expect(action.to).toBe('/dashboard');
    }
  });

  it('redirect destination is /dashboard, not any other path', () => {
    const action = resolveNormalSessionAccess('/update-password');

    expect(action.type).toBe('redirect');
    if (action.type === 'redirect') {
      expect(action.to).toBe('/dashboard');
      expect(action.to).not.toBe('/login');
      expect(action.to).not.toBe('/update-password');
    }
  });

  it('for any normal session, /update-password is never allowed through', () => {
    // This is a deterministic check — no arbitrary needed — but we run it
    // inside fc.assert to be consistent with the property-based style.
    fc.assert(
      fc.property(fc.constant('/update-password'), (path) => {
        const action = resolveNormalSessionAccess(path);
        expect(action.type).not.toBe('allow');
      }),
      { numRuns: 20 },
    );
  });

  it('normal session can access any non-update-password route', () => {
    fc.assert(
      fc.property(nonUpdatePasswordPathArb, (path) => {
        const action = resolveNormalSessionAccess(path);
        expect(action.type).toBe('allow');
      }),
      { numRuns: 20 },
    );
  });

  it('known client routes are all accessible in a normal session', () => {
    fc.assert(
      fc.property(knownClientPathArb, (path) => {
        const action = resolveNormalSessionAccess(path);
        expect(action.type).toBe('allow');
      }),
      { numRuns: 20 },
    );
  });
});
