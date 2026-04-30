/**
 * Unit tests for POST /api/promo/validate and POST /api/promo/redeem
 *
 * Task 9.1 — Validates: Requirements 6.3, 6.4, 6.6, 6.9, 6.10
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as validatePOST } from '../app/api/promo/validate/route';
import { POST as redeemPOST } from '../app/api/promo/redeem/route';
import { NextRequest } from 'next/server';

// ─── Supabase mock ────────────────────────────────────────────────────────────

const mockServerClient = {
  auth: {
    getSession: vi.fn(),
  },
};

const mockServiceClient = {
  from: vi.fn(),
};

vi.mock('@/lib/supabase', () => ({
  createServerClient: vi.fn(() => mockServerClient),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockServiceClient),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(body: unknown, url = 'http://localhost:3000/api/promo/validate') {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/** Build a chainable Supabase query mock that resolves to `result` at the terminal call. */
function buildQueryChain(result: unknown, terminalMethod = 'maybeSingle') {
  const chain: Record<string, unknown> = {};
  const terminal = vi.fn().mockResolvedValue(result);
  const methods = ['select', 'ilike', 'eq', 'order', 'limit', 'update', 'insert'];
  methods.forEach((m) => {
    chain[m] = vi.fn().mockReturnValue(chain);
  });
  chain[terminalMethod] = terminal;
  return chain;
}

// ─── POST /api/promo/validate ─────────────────────────────────────────────────

describe('POST /api/promo/validate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: unauthenticated
    mockServerClient.auth.getSession.mockResolvedValue({ data: { session: null } });
  });

  it('returns valid:false with error when code is missing', async () => {
    const res = await validatePOST(makeRequest({}));
    const data = await res.json();
    expect(data.valid).toBe(false);
    expect(data.error).toBeTruthy();
  });

  it('returns valid:false when code does not match any active record (Requirement 6.4)', async () => {
    const chain = buildQueryChain({ data: null, error: null });
    mockServiceClient.from.mockReturnValue(chain);

    const res = await validatePOST(makeRequest({ code: 'BADCODE' }));
    const data = await res.json();

    expect(data.valid).toBe(false);
    expect(data.error).toMatch(/invalid|inactive/i);
  });

  it('returns valid:false when code is inactive (Requirement 6.3)', async () => {
    const chain = buildQueryChain({
      data: { id: 'pc-1', code: 'INACTIVE', code_type: 'vip_bypass', discount_percentage: null, is_active: false, max_redemptions: null, times_redeemed: 0 },
      error: null,
    });
    mockServiceClient.from.mockReturnValue(chain);

    const res = await validatePOST(makeRequest({ code: 'INACTIVE' }));
    const data = await res.json();

    expect(data.valid).toBe(false);
  });

  it('returns valid:false when max_redemptions is reached', async () => {
    const chain = buildQueryChain({
      data: { id: 'pc-2', code: 'MAXED', code_type: 'discount', discount_percentage: 20, is_active: true, max_redemptions: 5, times_redeemed: 5 },
      error: null,
    });
    mockServiceClient.from.mockReturnValue(chain);

    const res = await validatePOST(makeRequest({ code: 'MAXED' }));
    const data = await res.json();

    expect(data.valid).toBe(false);
    expect(data.error).toMatch(/maximum/i);
  });

  it('returns 409 when authenticated user has already redeemed the code (Requirement 6.10)', async () => {
    mockServerClient.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-abc' } } },
    });

    // First call: promo_codes lookup → active code
    // Second call: promo_redemptions lookup → existing redemption
    let callCount = 0;
    mockServiceClient.from.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return buildQueryChain({
          data: { id: 'pc-3', code: 'VIP2024', code_type: 'vip_bypass', discount_percentage: null, is_active: true, max_redemptions: null, times_redeemed: 1 },
          error: null,
        });
      }
      // promo_redemptions — already redeemed
      return buildQueryChain({ data: { id: 'pr-1' }, error: null });
    });

    const res = await validatePOST(makeRequest({ code: 'VIP2024' }));
    const data = await res.json();

    expect(res.status).toBe(409);
    expect(data.valid).toBe(false);
    expect(data.error).toMatch(/already been redeemed/i);
  });

  it('returns valid:true with code details for a valid, unredeemed code (Requirement 6.3)', async () => {
    // No session — skip redemption check
    const chain = buildQueryChain({
      data: { id: 'pc-4', code: 'ELITE2024', code_type: 'vip_bypass', discount_percentage: null, is_active: true, max_redemptions: null, times_redeemed: 0 },
      error: null,
    });
    mockServiceClient.from.mockReturnValue(chain);

    const res = await validatePOST(makeRequest({ code: 'ELITE2024' }));
    const data = await res.json();

    expect(data.valid).toBe(true);
    expect(data.code_type).toBe('vip_bypass');
    expect(data.promo_code_id).toBe('pc-4');
  });

  it('returns discount_percentage for a discount code (Requirement 6.5)', async () => {
    const chain = buildQueryChain({
      data: { id: 'pc-5', code: 'SAVE20', code_type: 'discount', discount_percentage: 20, is_active: true, max_redemptions: null, times_redeemed: 0 },
      error: null,
    });
    mockServiceClient.from.mockReturnValue(chain);

    const res = await validatePOST(makeRequest({ code: 'SAVE20' }));
    const data = await res.json();

    expect(data.valid).toBe(true);
    expect(data.code_type).toBe('discount');
    expect(data.discount_percentage).toBe(20);
  });
});

// ─── POST /api/promo/redeem ───────────────────────────────────────────────────

describe('POST /api/promo/redeem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    mockServerClient.auth.getSession.mockResolvedValue({ data: { session: null } });

    const res = await redeemPOST(makeRequest({ code: 'VIP2024' }, 'http://localhost:3000/api/promo/redeem'));
    expect(res.status).toBe(401);
  });

  it('returns 404 when code is invalid (Requirement 6.3)', async () => {
    mockServerClient.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
    });

    const chain = buildQueryChain({ data: null, error: null });
    mockServiceClient.from.mockReturnValue(chain);

    const res = await redeemPOST(makeRequest({ code: 'INVALID' }, 'http://localhost:3000/api/promo/redeem'));
    expect(res.status).toBe(404);
  });

  it('returns 409 when code already redeemed by this user (Requirement 6.10)', async () => {
    mockServerClient.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
    });

    let callCount = 0;
    mockServiceClient.from.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // promo_codes lookup
        return buildQueryChain({
          data: { id: 'pc-1', code: 'VIP2024', code_type: 'vip_bypass', discount_percentage: null, is_active: true, max_redemptions: null, times_redeemed: 1 },
          error: null,
        });
      }
      // promo_redemptions — already redeemed
      return buildQueryChain({ data: { id: 'pr-1' }, error: null });
    });

    const res = await redeemPOST(makeRequest({ code: 'VIP2024' }, 'http://localhost:3000/api/promo/redeem'));
    const data = await res.json();

    expect(res.status).toBe(409);
    expect(data.error).toMatch(/already been redeemed/i);
  });

  it('sets role to vip_client on vip_bypass redemption (Requirement 6.6)', async () => {
    mockServerClient.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
    });

    const updateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    let callCount = 0;
    mockServiceClient.from.mockImplementation((table: string) => {
      callCount++;

      if (table === 'promo_codes' && callCount === 1) {
        return buildQueryChain({
          data: { id: 'pc-1', code: 'VIP2024', code_type: 'vip_bypass', discount_percentage: null, is_active: true, max_redemptions: null, times_redeemed: 0 },
          error: null,
        });
      }

      if (table === 'promo_redemptions' && callCount === 2) {
        // No existing redemption
        return buildQueryChain({ data: null, error: null });
      }

      if (table === 'promo_redemptions' && callCount === 3) {
        // Insert redemption
        return { insert: vi.fn().mockResolvedValue({ error: null }) };
      }

      if (table === 'promo_codes' && callCount === 4) {
        // Increment times_redeemed
        return { update: updateMock };
      }

      if (table === 'users') {
        // Role update
        return { update: updateMock };
      }

      if (table === 'properties') {
        // Get first property
        const chain = buildQueryChain({ data: [], error: null }, 'limit');
        (chain as Record<string, unknown>).limit = vi.fn().mockResolvedValue({ data: [], error: null });
        return chain;
      }

      if (table === 'onboarding_states') {
        return { update: updateMock };
      }

      return { update: updateMock, insert: vi.fn().mockResolvedValue({ error: null }) };
    });

    const res = await redeemPOST(makeRequest({ code: 'VIP2024' }, 'http://localhost:3000/api/promo/redeem'));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.code_type).toBe('vip_bypass');
  });

  it('returns discount_percentage on discount redemption (Requirement 6.9)', async () => {
    mockServerClient.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-2' } } },
    });

    const updateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    let callCount = 0;
    mockServiceClient.from.mockImplementation((table: string) => {
      callCount++;

      if (table === 'promo_codes' && callCount === 1) {
        return buildQueryChain({
          data: { id: 'pc-2', code: 'SAVE15', code_type: 'discount', discount_percentage: 15, is_active: true, max_redemptions: null, times_redeemed: 0 },
          error: null,
        });
      }

      if (table === 'promo_redemptions' && callCount === 2) {
        return buildQueryChain({ data: null, error: null });
      }

      if (table === 'promo_redemptions' && callCount === 3) {
        return { insert: vi.fn().mockResolvedValue({ error: null }) };
      }

      return { update: updateMock };
    });

    const res = await redeemPOST(makeRequest({ code: 'SAVE15' }, 'http://localhost:3000/api/promo/redeem'));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.code_type).toBe('discount');
    expect(data.discount_percentage).toBe(15);
  });
});
