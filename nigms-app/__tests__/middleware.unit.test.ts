/**
 * Unit tests for middleware routing logic.
 *
 * Validates: Requirements 10.3, 10.5, 10.6, 10.7
 *
 * Strategy: mock @supabase/ssr so we can control the session and profile
 * returned, then call the middleware function directly and assert on the
 * NextResponse that comes back (status, Location header, or pass-through).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── Supabase mock ─────────────────────────────────────────────────────────────

// These are module-level mocks that vi.mock hoists to the top of the file.
const mockGetSession = vi.fn();
const mockSingle = vi.fn();
const mockMaybeSingle = vi.fn();

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getSession: mockGetSession,
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: mockSingle,
          maybeSingle: mockMaybeSingle,
        })),
      })),
    })),
  })),
}));

// Import middleware AFTER mocks are registered (vi.mock is hoisted, so this is safe).
import { middleware } from '../middleware';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Build a minimal NextRequest for a given pathname. */
function makeRequest(pathname: string): NextRequest {
  return new NextRequest(`http://localhost${pathname}`);
}

/** Extract the redirect destination from a NextResponse. */
function redirectTarget(response: Response): string | null {
  return response.headers.get('location');
}

type MockProfile = {
  role: 'admin' | 'client' | 'vip_client';
  requires_password_reset: boolean;
} | null;

/**
 * Configure the mocked Supabase client for a given test scenario.
 * onboardingComplete defaults to true so client route tests pass through.
 */
function setupMocks(
  session: { user: { id: string } } | null,
  profile: MockProfile,
  onboardingComplete = true
) {
  mockGetSession.mockResolvedValue({ data: { session } });
  mockSingle.mockResolvedValue({ data: profile, error: null });
  mockMaybeSingle.mockResolvedValue({ data: { onboarding_complete: onboardingComplete }, error: null });
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('Middleware routing — unauthenticated users (Requirement 10.3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to /login when accessing /dashboard without a session', async () => {
    setupMocks(null, null);
    const res = await middleware(makeRequest('/dashboard'));
    expect(res.status).toBe(307);
    expect(redirectTarget(res)).toContain('/login');
  });

  it('redirects to /login when accessing /admin-dashboard without a session', async () => {
    setupMocks(null, null);
    const res = await middleware(makeRequest('/admin-dashboard'));
    expect(res.status).toBe(307);
    expect(redirectTarget(res)).toContain('/login');
  });

  it('redirects to /login when accessing /work-orders/ without a session', async () => {
    setupMocks(null, null);
    const res = await middleware(makeRequest('/work-orders/'));
    expect(res.status).toBe(307);
    expect(redirectTarget(res)).toContain('/login');
  });

  it('allows unauthenticated access to /login', async () => {
    setupMocks(null, null);
    const res = await middleware(makeRequest('/login'));
    expect(res.status).toBe(200);
  });

  it('allows unauthenticated access to /signup', async () => {
    setupMocks(null, null);
    const res = await middleware(makeRequest('/signup'));
    expect(res.status).toBe(200);
  });

  it('allows unauthenticated access to /book', async () => {
    setupMocks(null, null);
    const res = await middleware(makeRequest('/book'));
    expect(res.status).toBe(200);
  });

  it('allows unauthenticated access to /legal/privacy', async () => {
    setupMocks(null, null);
    const res = await middleware(makeRequest('/legal/privacy'));
    expect(res.status).toBe(200);
  });

  it('allows unauthenticated access to /update-password', async () => {
    setupMocks(null, null);
    const res = await middleware(makeRequest('/update-password'));
    expect(res.status).toBe(200);
  });

  it('allows unauthenticated access to /api/auth/login', async () => {
    setupMocks(null, null);
    const res = await middleware(makeRequest('/api/auth/login'));
    expect(res.status).toBe(200);
  });

  it('allows unauthenticated access to /api/webhooks/stripe', async () => {
    setupMocks(null, null);
    const res = await middleware(makeRequest('/api/webhooks/stripe'));
    expect(res.status).toBe(200);
  });
});

describe('Middleware routing — admin role (Requirement 10.5)', () => {
  const adminSession = { user: { id: 'admin-user-id' } };
  const adminProfile: MockProfile = { role: 'admin', requires_password_reset: false };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows admin to access /admin-dashboard', async () => {
    setupMocks(adminSession, adminProfile);
    const res = await middleware(makeRequest('/admin-dashboard'));
    expect(res.status).toBe(200);
  });

  it('allows admin to access /clients', async () => {
    setupMocks(adminSession, adminProfile);
    const res = await middleware(makeRequest('/clients'));
    expect(res.status).toBe(200);
  });

  it('allows admin to access /api/admin/work-orders', async () => {
    setupMocks(adminSession, adminProfile);
    const res = await middleware(makeRequest('/api/admin/work-orders'));
    expect(res.status).toBe(200);
  });

  it('redirects admin to /admin-dashboard when accessing /dashboard', async () => {
    setupMocks(adminSession, adminProfile);
    const res = await middleware(makeRequest('/dashboard'));
    expect(res.status).toBe(307);
    expect(redirectTarget(res)).toContain('/admin-dashboard');
  });

  it('redirects admin to /admin-dashboard when accessing /login', async () => {
    setupMocks(adminSession, adminProfile);
    const res = await middleware(makeRequest('/login'));
    expect(res.status).toBe(307);
    expect(redirectTarget(res)).toContain('/admin-dashboard');
  });

  it('allows admin with requires_password_reset=true to access /update-password', async () => {
    setupMocks(adminSession, { role: 'admin', requires_password_reset: true });
    const res = await middleware(makeRequest('/update-password'));
    expect(res.status).toBe(200);
  });
});

describe('Middleware routing — client with requires_password_reset=true (Requirement 10.6)', () => {
  const clientSession = { user: { id: 'client-user-id' } };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows client with reset=true to access /update-password', async () => {
    setupMocks(clientSession, { role: 'client', requires_password_reset: true });
    const res = await middleware(makeRequest('/update-password'));
    expect(res.status).toBe(200);
  });

  it('redirects client with reset=true to /update-password when accessing /dashboard', async () => {
    setupMocks(clientSession, { role: 'client', requires_password_reset: true });
    const res = await middleware(makeRequest('/dashboard'));
    expect(res.status).toBe(307);
    expect(redirectTarget(res)).toContain('/update-password');
  });

  it('redirects client with reset=true to /update-password when accessing /messages', async () => {
    setupMocks(clientSession, { role: 'client', requires_password_reset: true });
    const res = await middleware(makeRequest('/messages'));
    expect(res.status).toBe(307);
    expect(redirectTarget(res)).toContain('/update-password');
  });

  it('redirects client with reset=true to /update-password when accessing /work-orders/', async () => {
    setupMocks(clientSession, { role: 'client', requires_password_reset: true });
    const res = await middleware(makeRequest('/work-orders/'));
    expect(res.status).toBe(307);
    expect(redirectTarget(res)).toContain('/update-password');
  });

  it('redirects client with reset=false away from /update-password to /dashboard', async () => {
    setupMocks(clientSession, { role: 'client', requires_password_reset: false });
    const res = await middleware(makeRequest('/update-password'));
    expect(res.status).toBe(307);
    expect(redirectTarget(res)).toContain('/dashboard');
  });
});

describe('Middleware routing — client accessing admin routes (Requirement 10.7)', () => {
  const clientSession = { user: { id: 'client-user-id' } };
  const clientProfile: MockProfile = { role: 'client', requires_password_reset: false };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects client accessing /admin-dashboard to /dashboard', async () => {
    setupMocks(clientSession, clientProfile);
    const res = await middleware(makeRequest('/admin-dashboard'));
    expect(res.status).toBe(307);
    expect(redirectTarget(res)).toContain('/dashboard');
  });

  it('redirects client accessing /clients to /dashboard', async () => {
    setupMocks(clientSession, clientProfile);
    const res = await middleware(makeRequest('/clients'));
    expect(res.status).toBe(307);
    expect(redirectTarget(res)).toContain('/dashboard');
  });

  it('redirects client accessing /payments to /dashboard', async () => {
    setupMocks(clientSession, clientProfile);
    const res = await middleware(makeRequest('/payments'));
    expect(res.status).toBe(307);
    expect(redirectTarget(res)).toContain('/dashboard');
  });

  it('redirects client accessing /api/admin/clients to /dashboard', async () => {
    setupMocks(clientSession, clientProfile);
    const res = await middleware(makeRequest('/api/admin/clients'));
    expect(res.status).toBe(307);
    expect(redirectTarget(res)).toContain('/dashboard');
  });

  it('allows client to access /dashboard', async () => {
    setupMocks(clientSession, clientProfile);
    const res = await middleware(makeRequest('/dashboard'));
    expect(res.status).toBe(200);
  });

  it('allows client to access /messages', async () => {
    setupMocks(clientSession, clientProfile);
    const res = await middleware(makeRequest('/messages'));
    expect(res.status).toBe(200);
  });

  it('allows vip_client to access /dashboard', async () => {
    setupMocks(clientSession, { role: 'vip_client', requires_password_reset: false });
    const res = await middleware(makeRequest('/dashboard'));
    expect(res.status).toBe(200);
  });

  it('redirects vip_client accessing /admin-dashboard to /dashboard', async () => {
    setupMocks(clientSession, { role: 'vip_client', requires_password_reset: false });
    const res = await middleware(makeRequest('/admin-dashboard'));
    expect(res.status).toBe(307);
    expect(redirectTarget(res)).toContain('/dashboard');
  });
});

describe('Middleware routing — graceful fallback when profile is missing', () => {
  const orphanSession = { user: { id: 'orphan-user-id' } };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('treats missing profile as client with reset=true and redirects to /update-password', async () => {
    setupMocks(orphanSession, null);
    const res = await middleware(makeRequest('/dashboard'));
    expect(res.status).toBe(307);
    expect(redirectTarget(res)).toContain('/update-password');
  });
});
