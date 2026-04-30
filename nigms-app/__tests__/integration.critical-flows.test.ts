/**
 * Task 25.1 — Integration tests for critical user flows
 *
 * Tests three end-to-end flows by mocking Supabase and Stripe at the boundary
 * and calling the real API route handlers in sequence.
 *
 * Flow 1 — Onboarding (Req 2.1):
 *   POST /api/auth/signup → POST /api/client/properties → POST /api/promo/redeem
 *   Final assertion: onboarding_states.onboarding_complete === true
 *
 * Flow 2 — Work Order Lifecycle (Req 9.6):
 *   POST /api/client/work-orders → POST /api/admin/work-orders/[id]/accept
 *   → POST /api/admin/work-orders/[id]/estimates → POST /api/client/quotes/[id]/approve
 *   → PATCH /api/admin/work-orders/[id]/status { completed } → POST /api/client/invoices/[id]/pay
 *   Final assertion: invoice.paid_at is set, invoice.amount_paid > 0
 *
 * Flow 3 — VIP Promo Code Bypass (Req 6.6):
 *   POST /api/promo/validate → POST /api/promo/redeem
 *   → canAccessFeature('vip', 'ROI_Tracker') === true
 *   → canAccessFeature('vip', 'Emergency_Dispatch') === true
 *   Final assertion: all premium features unlocked
 *
 * Requirements: 2.1, 6.6, 9.6
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { canAccessFeature } from '@/lib/feature-access';

// ─── Shared mock state ────────────────────────────────────────────────────────

/**
 * In-memory store that simulates the Supabase database across API calls.
 * Each flow resets this store in beforeEach.
 */
interface MockStore {
  users: Record<string, Record<string, unknown>>;
  onboarding_states: Record<string, Record<string, unknown>>;
  properties: Record<string, Record<string, unknown>>;
  work_orders: Record<string, Record<string, unknown>>;
  quotes: Record<string, Record<string, unknown>>;
  invoices: Record<string, Record<string, unknown>>;
  promo_codes: Record<string, Record<string, unknown>>;
  promo_redemptions: Record<string, Record<string, unknown>>;
  subscriptions: Record<string, Record<string, unknown>>;
  audit_log: Array<Record<string, unknown>>;
  notifications: Array<Record<string, unknown>>;
}

let store: MockStore;

function resetStore(): void {
  store = {
    users: {},
    onboarding_states: {},
    properties: {},
    work_orders: {},
    quotes: {},
    invoices: {},
    promo_codes: {},
    promo_redemptions: {},
    subscriptions: {},
    audit_log: [],
    notifications: [],
  };
}

// ─── Mock helpers ─────────────────────────────────────────────────────────────

/** Builds a chainable Supabase query mock that resolves to `result`. */
function chain(result: unknown, terminalMethod = 'maybeSingle') {
  const obj: Record<string, unknown> = {};
  const terminal = vi.fn().mockResolvedValue(result);
  ['select', 'ilike', 'eq', 'order', 'limit', 'update', 'insert', 'delete', 'neq'].forEach(
    (m) => { obj[m] = vi.fn().mockReturnValue(obj); }
  );
  obj[terminalMethod] = terminal;
  return obj;
}

// ─── Supabase service-role client mock ───────────────────────────────────────

const mockServiceClient = {
  auth: {
    admin: {
      createUser: vi.fn(),
      deleteUser: vi.fn().mockResolvedValue({ error: null }),
    },
  },
  from: vi.fn(),
};

// ─── Supabase server client mock (session) ───────────────────────────────────

const mockServerClient = {
  auth: {
    getSession: vi.fn(),
  },
  from: vi.fn(),
};

vi.mock('@/lib/supabase', () => ({
  createServerClient: vi.fn(() => mockServerClient),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockServiceClient),
}));

// ─── Stripe mock ──────────────────────────────────────────────────────────────

const mockStripe = {
  paymentIntents: {
    create: vi.fn().mockResolvedValue({
      id: 'pi_test_integration',
      client_secret: 'pi_test_integration_secret',
    }),
  },
};

vi.mock('@/lib/stripe', () => ({
  stripe: mockStripe,
}));

// ─── Notifications mock ───────────────────────────────────────────────────────

vi.mock('@/lib/notifications', () => ({
  notifyAdmin: vi.fn().mockResolvedValue(undefined),
  notifyClient: vi.fn().mockResolvedValue(undefined),
}));

// ─── Request factory ──────────────────────────────────────────────────────────

function makeReq(url: string, method: string, body?: unknown): NextRequest {
  return new NextRequest(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

// ─── Flow 1: Onboarding ───────────────────────────────────────────────────────

describe('Flow 1 — Onboarding: signup → property → promo redeem → onboarding_complete=true (Req 2.1)', () => {
  const CLIENT_ID = 'client-onboarding-1';
  const PROPERTY_ID = 'prop-onboarding-1';
  const PROMO_CODE_ID = 'promo-vip-1';

  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();

    // Seed a VIP promo code
    store.promo_codes[PROMO_CODE_ID] = {
      id: PROMO_CODE_ID,
      code: 'VIP2024',
      code_type: 'vip_bypass',
      discount_percentage: null,
      is_active: true,
      max_redemptions: null,
      times_redeemed: 0,
    };
  });

  it('Step 1 — POST /api/auth/signup creates user and onboarding_states with onboarding_complete=false', async () => {
    // Mock auth.admin.createUser
    mockServiceClient.auth.admin.createUser.mockResolvedValue({
      data: { user: { id: CLIENT_ID } },
      error: null,
    });

    // Mock from() for users insert and onboarding_states insert
    mockServiceClient.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          insert: vi.fn().mockImplementation((data: Record<string, unknown>) => {
            store.users[CLIENT_ID] = { ...data, id: CLIENT_ID };
            return Promise.resolve({ error: null });
          }),
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      if (table === 'onboarding_states') {
        return {
          insert: vi.fn().mockImplementation((data: Record<string, unknown>) => {
            store.onboarding_states[CLIENT_ID] = { ...data };
            return Promise.resolve({ error: null });
          }),
        };
      }
      return { insert: vi.fn().mockResolvedValue({ error: null }) };
    });

    const { POST } = await import('../app/api/auth/signup/route');
    const req = makeReq('http://localhost/api/auth/signup', 'POST', {
      name: 'Test Client',
      email: 'test@example.com',
      password: 'password123',
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);

    // Verify onboarding_states was created with onboarding_complete=false
    expect(store.onboarding_states[CLIENT_ID]).toBeDefined();
    expect(store.onboarding_states[CLIENT_ID].onboarding_complete).toBe(false);
    expect(store.onboarding_states[CLIENT_ID].onboarding_step).toBe('property_setup');
  });

  it('Step 2 — POST /api/client/properties creates property and updates onboarding_step', async () => {
    // Seed existing state
    store.users[CLIENT_ID] = { id: CLIENT_ID, role: 'client' };
    store.onboarding_states[CLIENT_ID] = {
      user_id: CLIENT_ID,
      onboarding_step: 'property_setup',
      onboarding_complete: false,
    };

    // Session returns the client
    mockServerClient.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: CLIENT_ID } } },
    });

    mockServiceClient.from.mockImplementation((table: string) => {
      if (table === 'properties') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              ilike: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
          insert: vi.fn().mockImplementation((data: Record<string, unknown>) => {
            const id = PROPERTY_ID;
            store.properties[id] = { ...data, id };
            return {
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { ...data, id },
                  error: null,
                }),
              }),
            };
          }),
        };
      }
      if (table === 'users') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: store.users[CLIENT_ID],
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'audit_log') {
        return {
          insert: vi.fn().mockImplementation((data: Record<string, unknown>) => {
            store.audit_log.push(data);
            return Promise.resolve({ error: null });
          }),
        };
      }
      return { insert: vi.fn().mockResolvedValue({ error: null }) };
    });

    const { POST } = await import('../app/api/client/properties/route');
    const req = makeReq('http://localhost/api/client/properties', 'POST', {
      address: '123 Main St, Springfield, IL 62701',
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.property).toBeDefined();
    expect(body.property.id).toBe(PROPERTY_ID);

    // Verify property was stored
    expect(store.properties[PROPERTY_ID]).toBeDefined();
    expect(store.properties[PROPERTY_ID].user_id).toBe(CLIENT_ID);
  });

  it('Step 3 — POST /api/promo/redeem with VIP code sets onboarding_complete=true', async () => {
    // Seed state from previous steps
    store.users[CLIENT_ID] = { id: CLIENT_ID, role: 'client' };
    store.properties[PROPERTY_ID] = { id: PROPERTY_ID, user_id: CLIENT_ID };
    store.onboarding_states[CLIENT_ID] = {
      user_id: CLIENT_ID,
      onboarding_step: 'assurance_upsell',
      onboarding_complete: false,
    };

    // Session returns the client
    mockServerClient.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: CLIENT_ID } } },
    });

    mockServiceClient.from.mockImplementation((table: string) => {
      if (table === 'promo_codes') {
        return {
          select: vi.fn().mockReturnValue({
            ilike: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: store.promo_codes[PROMO_CODE_ID],
                error: null,
              }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      if (table === 'promo_redemptions') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
          insert: vi.fn().mockImplementation((data: Record<string, unknown>) => {
            store.promo_redemptions[`${data.promo_code_id}-${data.user_id}`] = data;
            return Promise.resolve({ error: null });
          }),
        };
      }
      if (table === 'users') {
        return {
          update: vi.fn().mockImplementation((data: Record<string, unknown>) => {
            store.users[CLIENT_ID] = { ...store.users[CLIENT_ID], ...data };
            return {
              eq: vi.fn().mockResolvedValue({ error: null }),
            };
          }),
        };
      }
      if (table === 'properties') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: [store.properties[PROPERTY_ID]],
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      if (table === 'subscriptions') {
        return {
          insert: vi.fn().mockImplementation((data: Record<string, unknown>) => {
            const id = 'sub-vip-1';
            store.subscriptions[id] = { ...data, id };
            return Promise.resolve({ error: null });
          }),
        };
      }
      if (table === 'onboarding_states') {
        return {
          update: vi.fn().mockImplementation((data: Record<string, unknown>) => {
            store.onboarding_states[CLIENT_ID] = {
              ...store.onboarding_states[CLIENT_ID],
              ...data,
            };
            return {
              eq: vi.fn().mockResolvedValue({ error: null }),
            };
          }),
        };
      }
      return { insert: vi.fn().mockResolvedValue({ error: null }) };
    });

    const { POST } = await import('../app/api/promo/redeem/route');
    const req = makeReq('http://localhost/api/promo/redeem', 'POST', { code: 'VIP2024' });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.code_type).toBe('vip_bypass');

    // Final assertion: onboarding_complete === true
    expect(store.onboarding_states[CLIENT_ID].onboarding_complete).toBe(true);
  });

  it('Full onboarding flow: signup → property → promo redeem → onboarding_complete=true', async () => {
    // ── Step 1: Signup ──────────────────────────────────────────────────────
    mockServiceClient.auth.admin.createUser.mockResolvedValue({
      data: { user: { id: CLIENT_ID } },
      error: null,
    });

    mockServiceClient.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          insert: vi.fn().mockImplementation((data: Record<string, unknown>) => {
            store.users[CLIENT_ID] = { ...data, id: CLIENT_ID };
            return Promise.resolve({ error: null });
          }),
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      if (table === 'onboarding_states') {
        return {
          insert: vi.fn().mockImplementation((data: Record<string, unknown>) => {
            store.onboarding_states[CLIENT_ID] = { ...data };
            return Promise.resolve({ error: null });
          }),
          update: vi.fn().mockImplementation((data: Record<string, unknown>) => {
            store.onboarding_states[CLIENT_ID] = {
              ...store.onboarding_states[CLIENT_ID],
              ...data,
            };
            return { eq: vi.fn().mockResolvedValue({ error: null }) };
          }),
        };
      }
      return { insert: vi.fn().mockResolvedValue({ error: null }) };
    });

    const { POST: signupPOST } = await import('../app/api/auth/signup/route');
    const signupRes = await signupPOST(
      makeReq('http://localhost/api/auth/signup', 'POST', {
        name: 'Test Client',
        email: 'test@example.com',
        password: 'password123',
      })
    );
    expect(signupRes.status).toBe(201);
    expect(store.onboarding_states[CLIENT_ID].onboarding_complete).toBe(false);

    // ── Step 2: Add property ────────────────────────────────────────────────
    mockServerClient.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: CLIENT_ID } } },
    });

    mockServiceClient.from.mockImplementation((table: string) => {
      if (table === 'properties') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              ilike: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
          insert: vi.fn().mockImplementation((data: Record<string, unknown>) => {
            store.properties[PROPERTY_ID] = { ...data, id: PROPERTY_ID };
            return {
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { ...data, id: PROPERTY_ID },
                  error: null,
                }),
              }),
            };
          }),
        };
      }
      if (table === 'users') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: store.users[CLIENT_ID] ?? { role: 'client' },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'audit_log') {
        return { insert: vi.fn().mockResolvedValue({ error: null }) };
      }
      if (table === 'onboarding_states') {
        return {
          update: vi.fn().mockImplementation((data: Record<string, unknown>) => {
            store.onboarding_states[CLIENT_ID] = {
              ...store.onboarding_states[CLIENT_ID],
              ...data,
            };
            return { eq: vi.fn().mockResolvedValue({ error: null }) };
          }),
        };
      }
      return { insert: vi.fn().mockResolvedValue({ error: null }) };
    });

    const { POST: propertiesPOST } = await import('../app/api/client/properties/route');
    const propRes = await propertiesPOST(
      makeReq('http://localhost/api/client/properties', 'POST', {
        address: '123 Main St, Springfield, IL 62701',
      })
    );
    expect(propRes.status).toBe(201);

    // ── Step 3: Redeem VIP promo code ───────────────────────────────────────
    mockServiceClient.from.mockImplementation((table: string) => {
      if (table === 'promo_codes') {
        return {
          select: vi.fn().mockReturnValue({
            ilike: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: store.promo_codes[PROMO_CODE_ID],
                error: null,
              }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      if (table === 'promo_redemptions') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      if (table === 'users') {
        return {
          update: vi.fn().mockImplementation((data: Record<string, unknown>) => {
            store.users[CLIENT_ID] = { ...store.users[CLIENT_ID], ...data };
            return { eq: vi.fn().mockResolvedValue({ error: null }) };
          }),
        };
      }
      if (table === 'properties') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: [store.properties[PROPERTY_ID]],
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      if (table === 'subscriptions') {
        return {
          insert: vi.fn().mockImplementation((data: Record<string, unknown>) => {
            store.subscriptions['sub-vip-1'] = { ...data, id: 'sub-vip-1' };
            return Promise.resolve({ error: null });
          }),
        };
      }
      if (table === 'onboarding_states') {
        return {
          update: vi.fn().mockImplementation((data: Record<string, unknown>) => {
            store.onboarding_states[CLIENT_ID] = {
              ...store.onboarding_states[CLIENT_ID],
              ...data,
            };
            return { eq: vi.fn().mockResolvedValue({ error: null }) };
          }),
        };
      }
      return { insert: vi.fn().mockResolvedValue({ error: null }) };
    });

    const { POST: redeemPOST } = await import('../app/api/promo/redeem/route');
    const redeemRes = await redeemPOST(
      makeReq('http://localhost/api/promo/redeem', 'POST', { code: 'VIP2024' })
    );
    expect(redeemRes.status).toBe(200);

    // ── Final assertion ─────────────────────────────────────────────────────
    expect(store.onboarding_states[CLIENT_ID].onboarding_complete).toBe(true);
  });
});
// --- Flow 2: Work Order Lifecycle --------------------------------------------

describe('Flow 2 � Work Order Lifecycle: submit ? accept ? estimate ? approve ? complete ? pay (Req 9.6)', () => {
  const CLIENT_ID = 'client-wo-1';
  const ADMIN_ID = 'admin-wo-1';
  const WO_ID = 'wo-lifecycle-1';
  const QUOTE_ID = 'quote-lifecycle-1';
  const INVOICE_ID = 'invoice-lifecycle-1';

  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();

    store.users[CLIENT_ID] = { id: CLIENT_ID, role: 'client' };
    store.users[ADMIN_ID] = { id: ADMIN_ID, role: 'admin' };
  });

  it('Full work order lifecycle: submit ? accept ? estimate ? approve ? complete ? pay ? invoice.paid_at set', async () => {
    // -- Step 1: Client submits work order -----------------------------------
    mockServerClient.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: CLIENT_ID } } },
    });

    mockServiceClient.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { role: 'client' }, error: null }),
            }),
          }),
        };
      }
      if (table === 'work_orders') {
        return {
          insert: vi.fn().mockImplementation((data: Record<string, unknown>) => {
            store.work_orders[WO_ID] = { ...data, id: WO_ID };
            return {
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { ...data, id: WO_ID },
                  error: null,
                }),
              }),
            };
          }),
        };
      }
      if (table === 'audit_log') {
        return {
          insert: vi.fn().mockImplementation((data: Record<string, unknown>) => {
            store.audit_log.push(data);
            return Promise.resolve({ error: null });
          }),
        };
      }
      if (table === 'notifications') {
        return { insert: vi.fn().mockReturnValue({ then: vi.fn() }) };
      }
      return { insert: vi.fn().mockResolvedValue({ error: null }) };
    });

    const { POST: woPost } = await import('../app/api/client/work-orders/route');
    const woRes = await woPost(
      makeReq('http://localhost/api/client/work-orders', 'POST', {
        title: 'Fix leaking roof',
        urgency: 'high',
      })
    );
    expect(woRes.status).toBe(201);
    const woBody = await woRes.json();
    expect(woBody.work_order.status).toBe('pending');
    expect(store.work_orders[WO_ID].status).toBe('pending');

    // -- Step 2: Admin accepts work order ------------------------------------
    mockServerClient.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: ADMIN_ID } } },
    });

    mockServiceClient.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { role: 'admin' }, error: null }),
            }),
          }),
        };
      }
      if (table === 'work_orders') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: store.work_orders[WO_ID], error: null }),
            }),
          }),
          update: vi.fn().mockImplementation((data: Record<string, unknown>) => {
            store.work_orders[WO_ID] = { ...store.work_orders[WO_ID], ...data };
            return {
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: store.work_orders[WO_ID],
                    error: null,
                  }),
                }),
              }),
            };
          }),
        };
      }
      if (table === 'audit_log') {
        return {
          insert: vi.fn().mockImplementation((data: Record<string, unknown>) => {
            store.audit_log.push(data);
            return Promise.resolve({ error: null });
          }),
        };
      }
      if (table === 'notifications') {
        return { insert: vi.fn().mockReturnValue({ then: vi.fn() }) };
      }
      return { insert: vi.fn().mockResolvedValue({ error: null }) };
    });

    const { POST: acceptPost } = await import('../app/api/admin/work-orders/[id]/accept/route');
    const acceptRes = await acceptPost(
      makeReq('http://localhost/api/admin/work-orders/wo-lifecycle-1/accept', 'POST'),
      { params: Promise.resolve({ id: WO_ID }) }
    );
    expect(acceptRes.status).toBe(200);
    expect(store.work_orders[WO_ID].status).toBe('accepted');
    expect(store.work_orders[WO_ID].accepted_at).toBeDefined();

    // -- Step 3: Admin creates estimate (quote) ------------------------------
    mockServiceClient.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { role: 'admin' }, error: null }),
            }),
          }),
        };
      }
      if (table === 'work_orders') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { ...store.work_orders[WO_ID], client_id: CLIENT_ID, title: 'Fix leaking roof', wo_number: 'WO-20240101-1234' },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'quotes') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
          insert: vi.fn().mockImplementation((data: Record<string, unknown>) => {
            store.quotes[QUOTE_ID] = { ...data, id: QUOTE_ID };
            return {
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { ...data, id: QUOTE_ID },
                  error: null,
                }),
              }),
            };
          }),
        };
      }
      if (table === 'audit_log') {
        return {
          insert: vi.fn().mockImplementation((data: Record<string, unknown>) => {
            store.audit_log.push(data);
            return Promise.resolve({ error: null });
          }),
        };
      }
      if (table === 'notifications') {
        return { insert: vi.fn().mockReturnValue({ then: vi.fn() }) };
      }
      return { insert: vi.fn().mockResolvedValue({ error: null }) };
    });

    const { POST: estimatesPost } = await import('../app/api/admin/work-orders/[id]/estimates/route');
    const estimateRes = await estimatesPost(
      makeReq('http://localhost/api/admin/work-orders/wo-lifecycle-1/estimates', 'POST', {
        line_items: [{ description: 'Labor', quantity: 2, unit_price: 150 }],
        total_amount: 300,
        notes: 'Roof repair estimate',
      }),
      { params: Promise.resolve({ id: WO_ID }) }
    );
    expect(estimateRes.status).toBe(201);
    expect(store.quotes[QUOTE_ID]).toBeDefined();
    expect(store.quotes[QUOTE_ID].total_amount).toBe(300);

    // -- Step 4: Client approves quote ---------------------------------------
    mockServerClient.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: CLIENT_ID } } },
    });

    mockServiceClient.from.mockImplementation((table: string) => {
      if (table === 'quotes') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { ...store.quotes[QUOTE_ID], client_id: CLIENT_ID, work_order_id: WO_ID, approved_at: null },
                error: null,
              }),
            }),
          }),
          update: vi.fn().mockImplementation((data: Record<string, unknown>) => {
            store.quotes[QUOTE_ID] = { ...store.quotes[QUOTE_ID], ...data };
            return {
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: store.quotes[QUOTE_ID],
                    error: null,
                  }),
                }),
              }),
            };
          }),
        };
      }
      if (table === 'work_orders') {
        return {
          update: vi.fn().mockImplementation((data: Record<string, unknown>) => {
            store.work_orders[WO_ID] = { ...store.work_orders[WO_ID], ...data };
            return { eq: vi.fn().mockResolvedValue({ error: null }) };
          }),
        };
      }
      if (table === 'users') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { role: 'client' }, error: null }),
            }),
          }),
        };
      }
      if (table === 'audit_log') {
        return {
          insert: vi.fn().mockImplementation((data: Record<string, unknown>) => {
            store.audit_log.push(data);
            return Promise.resolve({ error: null });
          }),
        };
      }
      if (table === 'notifications') {
        return { insert: vi.fn().mockReturnValue({ then: vi.fn() }) };
      }
      return { insert: vi.fn().mockResolvedValue({ error: null }) };
    });

    const { POST: approvePost } = await import('../app/api/client/quotes/[id]/approve/route');
    const approveRes = await approvePost(
      makeReq('http://localhost/api/client/quotes/quote-lifecycle-1/approve', 'POST'),
      { params: Promise.resolve({ id: QUOTE_ID }) }
    );
    expect(approveRes.status).toBe(200);
    expect(store.quotes[QUOTE_ID].approved_at).toBeDefined();

    // -- Step 5: Admin marks work order completed ? auto-generates invoice ---
    mockServerClient.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: ADMIN_ID } } },
    });

    mockServiceClient.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { role: 'admin' }, error: null }),
            }),
          }),
        };
      }
      if (table === 'work_orders') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { ...store.work_orders[WO_ID], client_id: CLIENT_ID, title: 'Fix leaking roof', wo_number: 'WO-20240101-1234' },
                error: null,
              }),
            }),
          }),
          update: vi.fn().mockImplementation((data: Record<string, unknown>) => {
            store.work_orders[WO_ID] = { ...store.work_orders[WO_ID], ...data };
            return {
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: store.work_orders[WO_ID],
                    error: null,
                  }),
                }),
              }),
            };
          }),
        };
      }
      if (table === 'invoices') {
        return {
          insert: vi.fn().mockImplementation((data: Record<string, unknown>) => {
            store.invoices[INVOICE_ID] = { ...data, id: INVOICE_ID, paid_at: null, amount_paid: 0, balance_remaining: data.total_billed };
            return {
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: store.invoices[INVOICE_ID],
                  error: null,
                }),
              }),
            };
          }),
        };
      }
      if (table === 'audit_log') {
        return {
          insert: vi.fn().mockImplementation((data: Record<string, unknown>) => {
            store.audit_log.push(data);
            return Promise.resolve({ error: null });
          }),
        };
      }
      if (table === 'notifications') {
        return { insert: vi.fn().mockReturnValue({ then: vi.fn() }) };
      }
      return { insert: vi.fn().mockResolvedValue({ error: null }) };
    });

    const { PATCH: statusPatch } = await import('../app/api/admin/work-orders/[id]/status/route');
    const statusRes = await statusPatch(
      makeReq('http://localhost/api/admin/work-orders/wo-lifecycle-1/status', 'PATCH', {
        status: 'completed',
      }),
      { params: Promise.resolve({ id: WO_ID }) }
    );
    expect(statusRes.status).toBe(200);
    expect(store.work_orders[WO_ID].status).toBe('completed');
    expect(store.invoices[INVOICE_ID]).toBeDefined();

    // -- Step 6: Client pays invoice -----------------------------------------
    mockServerClient.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: CLIENT_ID } } },
    });

    // Set a non-zero balance so the pay route proceeds
    store.invoices[INVOICE_ID].total_billed = 300;
    store.invoices[INVOICE_ID].amount_paid = 0;
    store.invoices[INVOICE_ID].balance_remaining = 300;

    mockServiceClient.from.mockImplementation((table: string) => {
      if (table === 'invoices') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { ...store.invoices[INVOICE_ID], client_id: CLIENT_ID },
                error: null,
              }),
            }),
          }),
          update: vi.fn().mockImplementation((data: Record<string, unknown>) => {
            store.invoices[INVOICE_ID] = { ...store.invoices[INVOICE_ID], ...data };
            return { eq: vi.fn().mockResolvedValue({ error: null }) };
          }),
        };
      }
      if (table === 'users') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { role: 'client' }, error: null }),
            }),
          }),
        };
      }
      if (table === 'audit_log') {
        return {
          insert: vi.fn().mockImplementation((data: Record<string, unknown>) => {
            store.audit_log.push(data);
            return Promise.resolve({ error: null });
          }),
        };
      }
      if (table === 'notifications') {
        return { insert: vi.fn().mockReturnValue({ then: vi.fn() }) };
      }
      return { insert: vi.fn().mockResolvedValue({ error: null }) };
    });

    const { POST: payPost } = await import('../app/api/client/invoices/[id]/pay/route');
    const payRes = await payPost(
      makeReq('http://localhost/api/client/invoices/invoice-lifecycle-1/pay', 'POST'),
      { params: Promise.resolve({ id: INVOICE_ID }) }
    );
    expect(payRes.status).toBe(200);
    const payBody = await payRes.json();
    expect(payBody.client_secret).toBeDefined();

    // -- Final assertions ----------------------------------------------------
    // invoice.paid_at is set
    expect(store.invoices[INVOICE_ID].paid_at).toBeDefined();
    expect(store.invoices[INVOICE_ID].paid_at).not.toBeNull();
    // invoice.amount_paid > 0
    expect(Number(store.invoices[INVOICE_ID].amount_paid)).toBeGreaterThan(0);
  });

  it('work order starts with status=pending', async () => {
    mockServerClient.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: CLIENT_ID } } },
    });

    mockServiceClient.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { role: 'client' }, error: null }),
            }),
          }),
        };
      }
      if (table === 'work_orders') {
        return {
          insert: vi.fn().mockImplementation((data: Record<string, unknown>) => {
            store.work_orders[WO_ID] = { ...data, id: WO_ID };
            return {
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { ...data, id: WO_ID }, error: null }),
              }),
            };
          }),
        };
      }
      if (table === 'audit_log') {
        return { insert: vi.fn().mockResolvedValue({ error: null }) };
      }
      if (table === 'notifications') {
        return { insert: vi.fn().mockReturnValue({ then: vi.fn() }) };
      }
      return { insert: vi.fn().mockResolvedValue({ error: null }) };
    });

    const { POST: woPost } = await import('../app/api/client/work-orders/route');
    const res = await woPost(
      makeReq('http://localhost/api/client/work-orders', 'POST', { title: 'Plumbing repair' })
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.work_order.status).toBe('pending');
  });

  it('invoice is auto-generated when work order is marked completed', async () => {
    store.work_orders[WO_ID] = {
      id: WO_ID,
      client_id: CLIENT_ID,
      status: 'accepted',
      title: 'Fix leaking roof',
      wo_number: 'WO-20240101-1234',
    };

    mockServerClient.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: ADMIN_ID } } },
    });

    const invoiceInsertMock = vi.fn().mockImplementation((data: Record<string, unknown>) => {
      store.invoices[INVOICE_ID] = { ...data, id: INVOICE_ID };
      return {
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: store.invoices[INVOICE_ID], error: null }),
        }),
      };
    });

    mockServiceClient.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { role: 'admin' }, error: null }),
            }),
          }),
        };
      }
      if (table === 'work_orders') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: store.work_orders[WO_ID], error: null }),
            }),
          }),
          update: vi.fn().mockImplementation((data: Record<string, unknown>) => {
            store.work_orders[WO_ID] = { ...store.work_orders[WO_ID], ...data };
            return {
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: store.work_orders[WO_ID], error: null }),
                }),
              }),
            };
          }),
        };
      }
      if (table === 'invoices') {
        return { insert: invoiceInsertMock };
      }
      if (table === 'audit_log') {
        return { insert: vi.fn().mockResolvedValue({ error: null }) };
      }
      if (table === 'notifications') {
        return { insert: vi.fn().mockReturnValue({ then: vi.fn() }) };
      }
      return { insert: vi.fn().mockResolvedValue({ error: null }) };
    });

    const { PATCH: statusPatch } = await import('../app/api/admin/work-orders/[id]/status/route');
    const res = await statusPatch(
      makeReq('http://localhost/api/admin/work-orders/wo-lifecycle-1/status', 'PATCH', { status: 'completed' }),
      { params: Promise.resolve({ id: WO_ID }) }
    );
    expect(res.status).toBe(200);
    expect(invoiceInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        work_order_id: WO_ID,
        client_id: CLIENT_ID,
        receipt_number: expect.stringMatching(/^INV-\d{8}-\d{4}$/),
      })
    );
  });
});

// --- Flow 3: VIP Promo Code Bypass -------------------------------------------

describe('Flow 3 � VIP Promo Code Bypass: validate ? redeem ? all premium features unlocked (Req 6.6)', () => {
  const CLIENT_ID = 'client-vip-1';
  const PROPERTY_ID = 'prop-vip-1';
  const PROMO_CODE_ID = 'promo-vip-flow-1';

  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();

    store.users[CLIENT_ID] = { id: CLIENT_ID, role: 'client' };
    store.properties[PROPERTY_ID] = { id: PROPERTY_ID, user_id: CLIENT_ID };
    store.promo_codes[PROMO_CODE_ID] = {
      id: PROMO_CODE_ID,
      code: 'VIP2024',
      code_type: 'vip_bypass',
      discount_percentage: null,
      is_active: true,
      max_redemptions: null,
      times_redeemed: 0,
    };

    mockServerClient.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: CLIENT_ID } } },
    });
  });

  it('POST /api/promo/validate returns valid:true and code_type:vip_bypass for VIP2024', async () => {
    mockServiceClient.from.mockImplementation((table: string) => {
      if (table === 'promo_codes') {
        return {
          select: vi.fn().mockReturnValue({
            ilike: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: store.promo_codes[PROMO_CODE_ID],
                error: null,
              }),
            }),
          }),
        };
      }
      // No existing redemption
      if (table === 'promo_redemptions') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
        };
      }
      return chain({ data: null, error: null });
    });

    const { POST: validatePost } = await import('../app/api/promo/validate/route');
    const res = await validatePost(
      makeReq('http://localhost/api/promo/validate', 'POST', { code: 'VIP2024' })
    );
    const body = await res.json();

    expect(body.valid).toBe(true);
    expect(body.code_type).toBe('vip_bypass');
  });

  it('POST /api/promo/redeem sets user role to vip_client and creates $0 subscription', async () => {
    mockServiceClient.from.mockImplementation((table: string) => {
      if (table === 'promo_codes') {
        return {
          select: vi.fn().mockReturnValue({
            ilike: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: store.promo_codes[PROMO_CODE_ID],
                error: null,
              }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      if (table === 'promo_redemptions') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      if (table === 'users') {
        return {
          update: vi.fn().mockImplementation((data: Record<string, unknown>) => {
            store.users[CLIENT_ID] = { ...store.users[CLIENT_ID], ...data };
            return { eq: vi.fn().mockResolvedValue({ error: null }) };
          }),
        };
      }
      if (table === 'properties') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: [store.properties[PROPERTY_ID]],
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      if (table === 'subscriptions') {
        return {
          insert: vi.fn().mockImplementation((data: Record<string, unknown>) => {
            store.subscriptions['sub-vip-flow-1'] = { ...data, id: 'sub-vip-flow-1' };
            return Promise.resolve({ error: null });
          }),
        };
      }
      if (table === 'onboarding_states') {
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      return { insert: vi.fn().mockResolvedValue({ error: null }) };
    });

    const { POST: redeemPost } = await import('../app/api/promo/redeem/route');
    const res = await redeemPost(
      makeReq('http://localhost/api/promo/redeem', 'POST', { code: 'VIP2024' })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.code_type).toBe('vip_bypass');

    // User role updated to vip_client
    expect(store.users[CLIENT_ID].role).toBe('vip_client');

    // $0 VIP subscription created
    const vipSub = store.subscriptions['sub-vip-flow-1'];
    expect(vipSub).toBeDefined();
    expect(vipSub.tier).toBe('vip');
    expect(vipSub.monthly_allocation_minutes).toBe(240);
  });

  it('canAccessFeature("vip", "ROI_Tracker") returns true after VIP redemption', () => {
    // After redemption, user has tier='vip'
    expect(canAccessFeature('vip', 'ROI_Tracker')).toBe(true);
  });

  it('canAccessFeature("vip", "Emergency_Dispatch") returns true after VIP redemption', () => {
    expect(canAccessFeature('vip', 'Emergency_Dispatch')).toBe(true);
  });

  it('canAccessFeature("vip", "Priority_Dispatch") returns true after VIP redemption', () => {
    expect(canAccessFeature('vip', 'Priority_Dispatch')).toBe(true);
  });

  it('Full VIP flow: validate ? redeem ? all premium features unlocked', async () => {
    // -- Step 1: Validate code -----------------------------------------------
    mockServiceClient.from.mockImplementation((table: string) => {
      if (table === 'promo_codes') {
        return {
          select: vi.fn().mockReturnValue({
            ilike: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: store.promo_codes[PROMO_CODE_ID],
                error: null,
              }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      if (table === 'promo_redemptions') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      if (table === 'users') {
        return {
          update: vi.fn().mockImplementation((data: Record<string, unknown>) => {
            store.users[CLIENT_ID] = { ...store.users[CLIENT_ID], ...data };
            return { eq: vi.fn().mockResolvedValue({ error: null }) };
          }),
        };
      }
      if (table === 'properties') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: [store.properties[PROPERTY_ID]],
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      if (table === 'subscriptions') {
        return {
          insert: vi.fn().mockImplementation((data: Record<string, unknown>) => {
            store.subscriptions['sub-vip-flow-1'] = { ...data, id: 'sub-vip-flow-1' };
            return Promise.resolve({ error: null });
          }),
        };
      }
      if (table === 'onboarding_states') {
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      return { insert: vi.fn().mockResolvedValue({ error: null }) };
    });

    const { POST: validatePost } = await import('../app/api/promo/validate/route');
    const validateRes = await validatePost(
      makeReq('http://localhost/api/promo/validate', 'POST', { code: 'VIP2024' })
    );
    const validateBody = await validateRes.json();
    expect(validateBody.valid).toBe(true);
    expect(validateBody.code_type).toBe('vip_bypass');

    // -- Step 2: Redeem code -------------------------------------------------
    const { POST: redeemPost } = await import('../app/api/promo/redeem/route');
    const redeemRes = await redeemPost(
      makeReq('http://localhost/api/promo/redeem', 'POST', { code: 'VIP2024' })
    );
    expect(redeemRes.status).toBe(200);

    // User is now vip_client
    const userTier = (store.users[CLIENT_ID].role === 'vip_client') ? 'vip' : null;

    // -- Final assertions: all premium features unlocked ---------------------
    expect(canAccessFeature(userTier, 'ROI_Tracker')).toBe(true);
    expect(canAccessFeature(userTier, 'Emergency_Dispatch')).toBe(true);
    expect(canAccessFeature(userTier, 'Priority_Dispatch')).toBe(true);
  });
});
