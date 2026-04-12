/**
 * Feature: nigms-app
 * Property 16: Admin routes deny access to all non-admin users
 *
 * Models the middleware routing logic as a pure function that takes
 * (path, session) and returns an action (allow | redirect-login | forbidden).
 *
 * For any admin route path:
 *   - Unauthenticated session → redirect to /login
 *   - Authenticated client (role = 'client') → 403 forbidden
 *   - Authenticated admin (role = 'admin') → allow
 *
 * Validates: Requirements 8.1, 8.2, 8.3
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type UserRole = 'admin' | 'client';

interface AuthenticatedSession {
  uid: string;
  role: UserRole;
}

type Session = AuthenticatedSession | null;

type MiddlewareAction =
  | { type: 'allow' }
  | { type: 'redirect'; to: string }
  | { type: 'forbidden'; status: 403 };

// ---------------------------------------------------------------------------
// Pure function modelling the middleware admin-route decision
//
// Mirrors the logic in middleware.ts:
//   - No session + admin route → redirect to /login
//   - Admin session + admin route → allow
//   - Client session + admin route → 403
// ---------------------------------------------------------------------------

const ADMIN_PREFIXES = ['/admin/'];

function isAdminRoute(pathname: string): boolean {
  return ADMIN_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function resolveAdminRouteAccess(pathname: string, session: Session): MiddlewareAction {
  if (!isAdminRoute(pathname)) {
    throw new Error(`resolveAdminRouteAccess called with non-admin path: ${pathname}`);
  }

  if (session === null) {
    // Rule 1: No session + protected route → redirect to /login
    return { type: 'redirect', to: '/login' };
  }

  if (session.role === 'admin') {
    // Rule 3: Admin session + admin route → allow
    return { type: 'allow' };
  }

  // Rule 9: Authenticated client accessing admin route → 403
  return { type: 'forbidden', status: 403 };
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const uuidArb = fc.uuid();

// Known admin route segments from the (admin) route group
const adminSegmentArb = fc.constantFrom(
  'dashboard',
  'clients',
  'work-orders',
  'payments',
);

// Generate a concrete admin path like /admin/clients or /admin/work-orders/some-id
const adminPathArb: fc.Arbitrary<string> = fc.oneof(
  // Top-level admin routes: /admin/<segment>
  adminSegmentArb.map((seg) => `/admin/${seg}`),
  // Dynamic admin routes: /admin/<segment>/<id>
  fc.record({ seg: adminSegmentArb, id: uuidArb }).map(({ seg, id }) => `/admin/${seg}/${id}`),
  // Deeply nested: /admin/<segment>/<id>/<action>
  fc.record({
    seg: adminSegmentArb,
    id: uuidArb,
    action: fc.constantFrom('status', 'deactivate', 'reset-password'),
  }).map(({ seg, id, action }) => `/admin/${seg}/${id}/${action}`),
);

// Unauthenticated session
const unauthenticatedSessionArb: fc.Arbitrary<null> = fc.constant(null);

// Authenticated client session
const clientSessionArb: fc.Arbitrary<AuthenticatedSession> = fc.record({
  uid: uuidArb,
  role: fc.constant<UserRole>('client'),
});

// Authenticated admin session
const adminSessionArb: fc.Arbitrary<AuthenticatedSession> = fc.record({
  uid: uuidArb,
  role: fc.constant<UserRole>('admin'),
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Property 16: Admin routes deny access to all non-admin users', () => {
  it('unauthenticated users are redirected to /login for any admin route', () => {
    fc.assert(
      fc.property(adminPathArb, unauthenticatedSessionArb, (path, session) => {
        const action = resolveAdminRouteAccess(path, session);

        expect(action.type).toBe('redirect');
        if (action.type === 'redirect') {
          expect(action.to).toBe('/login');
        }
      }),
      { numRuns: 20 },
    );
  });

  it('authenticated clients receive 403 Forbidden for any admin route', () => {
    fc.assert(
      fc.property(adminPathArb, clientSessionArb, (path, session) => {
        const action = resolveAdminRouteAccess(path, session);

        expect(action.type).toBe('forbidden');
        if (action.type === 'forbidden') {
          expect(action.status).toBe(403);
        }
      }),
      { numRuns: 20 },
    );
  });

  it('authenticated admins are allowed through for any admin route', () => {
    fc.assert(
      fc.property(adminPathArb, adminSessionArb, (path, session) => {
        const action = resolveAdminRouteAccess(path, session);

        expect(action.type).toBe('allow');
      }),
      { numRuns: 20 },
    );
  });

  it('unauthenticated users never receive allow or forbidden — only redirect to /login', () => {
    fc.assert(
      fc.property(adminPathArb, (path) => {
        const action = resolveAdminRouteAccess(path, null);

        expect(action.type).not.toBe('allow');
        expect(action.type).not.toBe('forbidden');
        expect(action.type).toBe('redirect');
        if (action.type === 'redirect') {
          expect(action.to).toBe('/login');
        }
      }),
      { numRuns: 20 },
    );
  });

  it('clients never receive allow — only forbidden', () => {
    fc.assert(
      fc.property(adminPathArb, clientSessionArb, (path, session) => {
        const action = resolveAdminRouteAccess(path, session);

        expect(action.type).not.toBe('allow');
        expect(action.type).not.toBe('redirect');
      }),
      { numRuns: 20 },
    );
  });

  it('all generated paths are recognised as admin routes', () => {
    fc.assert(
      fc.property(adminPathArb, (path) => {
        expect(isAdminRoute(path)).toBe(true);
      }),
      { numRuns: 20 },
    );
  });
});
