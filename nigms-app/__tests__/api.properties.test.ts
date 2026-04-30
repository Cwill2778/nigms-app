/**
 * Unit tests for property API routes
 *
 * Task 7.1 — Validates: Requirements 7.14, 7.18
 *
 * POST /api/client/properties  — duplicate address returns 409
 * DELETE /api/client/properties/[id] — blocked when active subscription exists
 * DELETE /api/client/properties/[id] — blocked when open work order exists
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../app/api/client/properties/route';
import { DELETE } from '../app/api/client/properties/[id]/route';
import { NextRequest } from 'next/server';

// ─── Supabase mocks ───────────────────────────────────────────────────────────

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

function makePostRequest(body: unknown) {
  return new NextRequest('http://localhost:3000/api/client/properties', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeDeleteRequest(id: string) {
  return new NextRequest(`http://localhost:3000/api/client/properties/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Build a chainable Supabase query mock that resolves to `result` at the
 * terminal call (defaults to `maybeSingle`).
 */
function buildQueryChain(
  result: unknown,
  terminalMethod: string = 'maybeSingle'
) {
  const chain: Record<string, unknown> = {};
  const methods = ['select', 'eq', 'ilike', 'not', 'order', 'limit', 'update', 'insert', 'delete'];
  methods.forEach((m) => {
    chain[m] = vi.fn().mockReturnValue(chain);
  });
  chain[terminalMethod] = vi.fn().mockResolvedValue(result);
  return chain;
}

// ─── POST /api/client/properties ─────────────────────────────────────────────

describe('POST /api/client/properties', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockServerClient.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
    });
  });

  it('returns 401 when user is not authenticated', async () => {
    mockServerClient.auth.getSession.mockResolvedValue({ data: { session: null } });

    const res = await POST(makePostRequest({ address: '123 Main St' }));
    expect(res.status).toBe(401);
  });

  it('returns 400 when address is missing', async () => {
    const res = await POST(makePostRequest({}));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/address/i);
  });

  it('returns 400 when address is empty string', async () => {
    const res = await POST(makePostRequest({ address: '   ' }));
    expect(res.status).toBe(400);
  });

  /**
   * Requirement 7.14 — duplicate address returns 409
   * If a client submits a property address already associated with their account,
   * the platform SHALL return an error and NOT create a duplicate record.
   */
  it('returns 409 when address already exists for this client (Requirement 7.14)', async () => {
    // ilike query finds an existing property with the same address
    const chain = buildQueryChain({ data: { id: 'prop-existing' }, error: null });
    mockServiceClient.from.mockReturnValue(chain);

    const res = await POST(makePostRequest({ address: '123 Main St' }));
    const data = await res.json();

    expect(res.status).toBe(409);
    expect(data.error).toMatch(/already associated/i);
  });

  it('returns 201 and the new property when address is unique', async () => {
    const newProperty = { id: 'prop-new', user_id: 'user-1', address: '456 Oak Ave', created_at: new Date().toISOString() };

    let callCount = 0;
    mockServiceClient.from.mockImplementation((table: string) => {
      callCount++;

      // First call: duplicate check (properties ilike)
      if (table === 'properties' && callCount === 1) {
        return buildQueryChain({ data: null, error: null });
      }

      // Second call: insert new property
      if (table === 'properties' && callCount === 2) {
        const chain: Record<string, unknown> = {};
        chain.insert = vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: newProperty, error: null }),
          }),
        });
        return chain;
      }

      // Third call: users role lookup for audit log
      if (table === 'users') {
        return buildQueryChain({ data: { role: 'client' }, error: null }, 'single');
      }

      // Fourth call: audit_log insert
      if (table === 'audit_log') {
        return { insert: vi.fn().mockResolvedValue({ data: {}, error: null }) };
      }

      return buildQueryChain({ data: null, error: null });
    });

    const res = await POST(makePostRequest({ address: '456 Oak Ave' }));
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.property).toBeDefined();
    expect(data.property.address).toBe('456 Oak Ave');
  });
});

// ─── DELETE /api/client/properties/[id] ──────────────────────────────────────

describe('DELETE /api/client/properties/[id]', () => {
  const propertyId = 'prop-123';
  const routeContext = { params: Promise.resolve({ id: propertyId }) };

  beforeEach(() => {
    vi.clearAllMocks();
    mockServerClient.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
    });
  });

  it('returns 401 when user is not authenticated', async () => {
    mockServerClient.auth.getSession.mockResolvedValue({ data: { session: null } });

    const res = await DELETE(makeDeleteRequest(propertyId), routeContext);
    expect(res.status).toBe(401);
  });

  it('returns 404 when property does not belong to this client', async () => {
    // maybeSingle returns null — property not found for this user
    const chain = buildQueryChain({ data: null, error: null });
    mockServiceClient.from.mockReturnValue(chain);

    const res = await DELETE(makeDeleteRequest(propertyId), routeContext);
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toMatch(/not found/i);
  });

  /**
   * Requirement 7.18 — delete blocked when active subscription exists
   * If a client attempts to remove a property that has an active subscription,
   * the platform SHALL display an error and SHALL NOT delete the record.
   */
  it('returns 400 when property has an active subscription (Requirement 7.18)', async () => {
    let callCount = 0;
    mockServiceClient.from.mockImplementation((table: string) => {
      callCount++;

      // First call: verify property ownership
      if (table === 'properties' && callCount === 1) {
        return buildQueryChain({ data: { id: propertyId, user_id: 'user-1' }, error: null });
      }

      // Second call: active subscriptions check — returns one active sub
      if (table === 'subscriptions') {
        const chain: Record<string, unknown> = {};
        chain.select = vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [{ id: 'sub-1' }], error: null }),
            }),
          }),
        });
        return chain;
      }

      return buildQueryChain({ data: null, error: null });
    });

    const res = await DELETE(makeDeleteRequest(propertyId), routeContext);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/active subscription/i);
  });

  /**
   * Requirement 7.18 — delete blocked when open work order exists
   * If a client attempts to remove a property that has an open work order,
   * the platform SHALL display an error and SHALL NOT delete the record.
   */
  it('returns 400 when property has open work orders (Requirement 7.18)', async () => {
    let callCount = 0;
    mockServiceClient.from.mockImplementation((table: string) => {
      callCount++;

      // First call: verify property ownership
      if (table === 'properties' && callCount === 1) {
        return buildQueryChain({ data: { id: propertyId, user_id: 'user-1' }, error: null });
      }

      // Second call: active subscriptions check — none found
      if (table === 'subscriptions') {
        const chain: Record<string, unknown> = {};
        chain.select = vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        });
        return chain;
      }

      // Third call: open work orders check — returns one open work order
      if (table === 'work_orders') {
        const chain: Record<string, unknown> = {};
        chain.select = vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            not: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [{ id: 'wo-1' }], error: null }),
            }),
          }),
        });
        return chain;
      }

      return buildQueryChain({ data: null, error: null });
    });

    const res = await DELETE(makeDeleteRequest(propertyId), routeContext);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/open work orders/i);
  });

  it('returns 200 and success:true when property is safe to delete', async () => {
    let callCount = 0;
    mockServiceClient.from.mockImplementation((table: string) => {
      callCount++;

      // First call: verify property ownership
      if (table === 'properties' && callCount === 1) {
        return buildQueryChain({ data: { id: propertyId, user_id: 'user-1' }, error: null });
      }

      // Second call: active subscriptions check — none
      if (table === 'subscriptions') {
        const chain: Record<string, unknown> = {};
        chain.select = vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        });
        return chain;
      }

      // Third call: open work orders check — none
      if (table === 'work_orders') {
        const chain: Record<string, unknown> = {};
        chain.select = vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            not: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        });
        return chain;
      }

      // Fourth call: delete the property
      if (table === 'properties' && callCount >= 4) {
        return {
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      }

      return buildQueryChain({ data: null, error: null });
    });

    const res = await DELETE(makeDeleteRequest(propertyId), routeContext);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
