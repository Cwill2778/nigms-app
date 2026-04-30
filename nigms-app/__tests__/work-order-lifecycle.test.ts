/**
 * Task 13.1 — Work order lifecycle unit tests
 *
 * Tests:
 *   - New work order starts with status `pending`
 *   - Accept sets `accepted_at` timestamp
 *   - Reject records reason and notifies client
 *   - Audit log entry created on every transition
 *
 * Requirements: 9.1, 9.2, 9.3, 9.7
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ─── Shared mock client ───────────────────────────────────────────────────────

const _insertMock = vi.fn().mockResolvedValue({ data: {}, error: null });
const _singleMock = vi.fn();
const _maybeSingleMock = vi.fn();
const _updateEqSelectSingleMock = vi.fn();
const _selectEqSingleMock = vi.fn();

const mockDb = {
  auth: { getSession: vi.fn() },
  from: vi.fn(),
  rpc: vi.fn(),
};

vi.mock('@/lib/supabase', () => ({
  createServerClient: vi.fn(() => mockDb),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockDb),
}));

vi.mock('@/lib/stripe', () => ({
  stripe: {
    paymentIntents: {
      create: vi.fn().mockResolvedValue({
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret',
      }),
    },
  },
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeAdminSession(userId = 'admin-1') {
  return { data: { session: { user: { id: userId } } } };
}

function makeClientSession(userId = 'client-1') {
  return { data: { session: { user: { id: userId } } } };
}

function makeNoSession() {
  return { data: { session: null } };
}

// ─── POST /api/client/work-orders ─────────────────────────────────────────────

describe('POST /api/client/work-orders', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when unauthenticated', async () => {
    const { POST } = await import('../app/api/client/work-orders/route');
    mockDb.auth.getSession.mockResolvedValue(makeNoSession());

    const req = new NextRequest('http://localhost/api/client/work-orders', {
      method: 'POST',
      body: JSON.stringify({ title: 'Fix roof' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 when title is missing', async () => {
    const { POST } = await import('../app/api/client/work-orders/route');
    mockDb.auth.getSession.mockResolvedValue(makeClientSession());

    // profile lookup
    mockDb.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { role: 'client' } }),
        }),
      }),
    });

    const req = new NextRequest('http://localhost/api/client/work-orders', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/title/i);
  });

  it('creates work order with status=pending and generates wo_number', async () => {
    const { POST } = await import('../app/api/client/work-orders/route');
    mockDb.auth.getSession.mockResolvedValue(makeClientSession('client-1'));

    const createdWo = {
      id: 'wo-new-1',
      client_id: 'client-1',
      status: 'pending',
      wo_number: 'WO-20240101-1234',
      title: 'Fix roof',
    };

    let insertedData: Record<string, unknown> | null = null;

    mockDb.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { role: 'client' } }),
            }),
          }),
        };
      }
      if (table === 'work_orders') {
        return {
          insert: vi.fn().mockImplementation((data: Record<string, unknown>) => {
            insertedData = data;
            return {
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: createdWo, error: null }),
              }),
            };
          }),
        };
      }
      if (table === 'audit_log') {
        return { insert: vi.fn().mockResolvedValue({ data: {}, error: null }) };
      }
      if (table === 'notifications') {
        return { insert: vi.fn().mockReturnValue({ then: vi.fn() }) };
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null }),
          }),
        }),
      };
    });

    const req = new NextRequest('http://localhost/api/client/work-orders', {
      method: 'POST',
      body: JSON.stringify({ title: 'Fix roof', urgency: 'high' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.work_order.status).toBe('pending');
    expect(body.work_order.wo_number).toMatch(/^WO-\d{8}-\d{4}$/);

    // Verify the insert payload had status='pending'
    expect(insertedData).not.toBeNull();
    const inserted = insertedData as unknown as Record<string, unknown>;
    expect(inserted.status).toBe('pending');
    expect(inserted.client_id).toBe('client-1');
  });

  it('writes audit log entry on creation', async () => {
    const { POST } = await import('../app/api/client/work-orders/route');
    mockDb.auth.getSession.mockResolvedValue(makeClientSession('client-1'));

    const auditInsertMock = vi.fn().mockResolvedValue({ data: {}, error: null });

    mockDb.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { role: 'client' } }),
            }),
          }),
        };
      }
      if (table === 'work_orders') {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 'wo-1', client_id: 'client-1', status: 'pending', wo_number: 'WO-20240101-1234', title: 'Fix roof' },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'audit_log') {
        return { insert: auditInsertMock };
      }
      if (table === 'notifications') {
        return { insert: vi.fn().mockReturnValue({ then: vi.fn() }) };
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null }),
          }),
        }),
      };
    });

    const req = new NextRequest('http://localhost/api/client/work-orders', {
      method: 'POST',
      body: JSON.stringify({ title: 'Fix roof' }),
    });
    await POST(req);

    expect(auditInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        entity_type: 'work_order',
        action: 'created',
        actor_role: 'client',
      })
    );
  });
});

// ─── POST /api/admin/work-orders/[id]/accept ──────────────────────────────────

describe('POST /api/admin/work-orders/[id]/accept', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 403 when not admin', async () => {
    const { POST } = await import('../app/api/admin/work-orders/[id]/accept/route');
    mockDb.auth.getSession.mockResolvedValue(makeClientSession());
    mockDb.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { role: 'client' } }),
        }),
      }),
    });

    const req = new NextRequest('http://localhost/api/admin/work-orders/wo-1/accept', { method: 'POST' });
    const res = await POST(req, { params: Promise.resolve({ id: 'wo-1' }) });
    expect(res.status).toBe(403);
  });

  it('sets status=accepted and accepted_at when admin accepts', async () => {
    const { POST } = await import('../app/api/admin/work-orders/[id]/accept/route');
    mockDb.auth.getSession.mockResolvedValue(makeAdminSession('admin-1'));

    const existingWo = { id: 'wo-1', client_id: 'client-1', status: 'pending', wo_number: 'WO-20240101-1234', title: 'Fix roof' };
    const updatedWo = { ...existingWo, status: 'accepted', accepted_at: new Date().toISOString() };

    let updatePayload: Record<string, unknown> | null = null;

    mockDb.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { role: 'admin' } }),
            }),
          }),
        };
      }
      if (table === 'work_orders') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: existingWo, error: null }),
            }),
          }),
          update: vi.fn().mockImplementation((payload: Record<string, unknown>) => {
            updatePayload = payload;
            return {
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: updatedWo, error: null }),
                }),
              }),
            };
          }),
        };
      }
      if (table === 'audit_log') {
        return { insert: vi.fn().mockResolvedValue({ data: {}, error: null }) };
      }
      if (table === 'notifications') {
        return { insert: vi.fn().mockReturnValue({ then: vi.fn() }) };
      }
      return { insert: vi.fn().mockResolvedValue({ data: {}, error: null }) };
    });

    const req = new NextRequest('http://localhost/api/admin/work-orders/wo-1/accept', { method: 'POST' });
    const res = await POST(req, { params: Promise.resolve({ id: 'wo-1' }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('accepted');

    // Verify accepted_at was set in the update payload
    expect(updatePayload).not.toBeNull();
    const acceptPayload = updatePayload as unknown as Record<string, unknown>;
    expect(acceptPayload.status).toBe('accepted');
    expect(acceptPayload.accepted_at).toBeDefined();
  });

  it('writes audit log entry on accept', async () => {
    const { POST } = await import('../app/api/admin/work-orders/[id]/accept/route');
    mockDb.auth.getSession.mockResolvedValue(makeAdminSession('admin-1'));

    const existingWo = { id: 'wo-1', client_id: 'client-1', status: 'pending', wo_number: 'WO-20240101-1234', title: 'Fix roof' };
    const updatedWo = { ...existingWo, status: 'accepted', accepted_at: new Date().toISOString() };
    const auditInsertMock = vi.fn().mockResolvedValue({ data: {}, error: null });

    mockDb.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { role: 'admin' } }),
            }),
          }),
        };
      }
      if (table === 'work_orders') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: existingWo, error: null }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: updatedWo, error: null }),
              }),
            }),
          }),
        };
      }
      if (table === 'audit_log') {
        return { insert: auditInsertMock };
      }
      if (table === 'notifications') {
        return { insert: vi.fn().mockReturnValue({ then: vi.fn() }) };
      }
      return { insert: vi.fn().mockResolvedValue({ data: {}, error: null }) };
    });

    const req = new NextRequest('http://localhost/api/admin/work-orders/wo-1/accept', { method: 'POST' });
    await POST(req, { params: Promise.resolve({ id: 'wo-1' }) });

    expect(auditInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        entity_type: 'work_order',
        entity_id: 'wo-1',
        action: 'accepted',
        actor_id: 'admin-1',
        actor_role: 'admin',
      })
    );
  });

  it('returns 404 when work order not found', async () => {
    const { POST } = await import('../app/api/admin/work-orders/[id]/accept/route');
    mockDb.auth.getSession.mockResolvedValue(makeAdminSession());

    mockDb.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { role: 'admin' } }),
            }),
          }),
        };
      }
      if (table === 'work_orders') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        };
      }
      return { insert: vi.fn().mockResolvedValue({ data: {}, error: null }) };
    });

    const req = new NextRequest('http://localhost/api/admin/work-orders/nonexistent/accept', { method: 'POST' });
    const res = await POST(req, { params: Promise.resolve({ id: 'nonexistent' }) });
    expect(res.status).toBe(404);
  });
});

// ─── POST /api/admin/work-orders/[id]/reject ──────────────────────────────────

describe('POST /api/admin/work-orders/[id]/reject', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 403 when not admin', async () => {
    const { POST } = await import('../app/api/admin/work-orders/[id]/reject/route');
    mockDb.auth.getSession.mockResolvedValue(makeClientSession());
    mockDb.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { role: 'client' } }),
        }),
      }),
    });

    const req = new NextRequest('http://localhost/api/admin/work-orders/wo-1/reject', {
      method: 'POST',
      body: JSON.stringify({ reason: 'Out of scope' }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'wo-1' }) });
    expect(res.status).toBe(403);
  });

  it('returns 400 when reason is missing', async () => {
    const { POST } = await import('../app/api/admin/work-orders/[id]/reject/route');
    mockDb.auth.getSession.mockResolvedValue(makeAdminSession());
    mockDb.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { role: 'admin' } }),
        }),
      }),
    });

    const req = new NextRequest('http://localhost/api/admin/work-orders/wo-1/reject', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'wo-1' }) });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/reason/i);
  });

  it('sets status=cancelled and records rejection reason in inspection_notes', async () => {
    const { POST } = await import('../app/api/admin/work-orders/[id]/reject/route');
    mockDb.auth.getSession.mockResolvedValue(makeAdminSession('admin-1'));

    const existingWo = { id: 'wo-1', client_id: 'client-1', status: 'pending', wo_number: 'WO-20240101-1234', title: 'Fix roof' };
    const updatedWo = { ...existingWo, status: 'cancelled', inspection_notes: 'Out of scope' };

    let updatePayload: Record<string, unknown> | null = null;

    mockDb.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { role: 'admin' } }),
            }),
          }),
        };
      }
      if (table === 'work_orders') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: existingWo, error: null }),
            }),
          }),
          update: vi.fn().mockImplementation((payload: Record<string, unknown>) => {
            updatePayload = payload;
            return {
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: updatedWo, error: null }),
                }),
              }),
            };
          }),
        };
      }
      if (table === 'audit_log') {
        return { insert: vi.fn().mockResolvedValue({ data: {}, error: null }) };
      }
      if (table === 'notifications') {
        return { insert: vi.fn().mockReturnValue({ then: vi.fn() }) };
      }
      return { insert: vi.fn().mockResolvedValue({ data: {}, error: null }) };
    });

    const req = new NextRequest('http://localhost/api/admin/work-orders/wo-1/reject', {
      method: 'POST',
      body: JSON.stringify({ reason: 'Out of scope' }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'wo-1' }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('cancelled');

    // Verify inspection_notes was set to the reason
    expect(updatePayload).not.toBeNull();
    const rejectPayload = updatePayload as unknown as Record<string, unknown>;
    expect(rejectPayload.status).toBe('cancelled');
    expect(rejectPayload.inspection_notes).toBe('Out of scope');
  });

  it('writes audit log with rejection reason', async () => {
    const { POST } = await import('../app/api/admin/work-orders/[id]/reject/route');
    mockDb.auth.getSession.mockResolvedValue(makeAdminSession('admin-1'));

    const existingWo = { id: 'wo-1', client_id: 'client-1', status: 'pending', wo_number: 'WO-20240101-1234', title: 'Fix roof' };
    const updatedWo = { ...existingWo, status: 'cancelled', inspection_notes: 'Out of scope' };
    const auditInsertMock = vi.fn().mockResolvedValue({ data: {}, error: null });

    mockDb.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { role: 'admin' } }),
            }),
          }),
        };
      }
      if (table === 'work_orders') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: existingWo, error: null }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: updatedWo, error: null }),
              }),
            }),
          }),
        };
      }
      if (table === 'audit_log') {
        return { insert: auditInsertMock };
      }
      if (table === 'notifications') {
        return { insert: vi.fn().mockReturnValue({ then: vi.fn() }) };
      }
      return { insert: vi.fn().mockResolvedValue({ data: {}, error: null }) };
    });

    const req = new NextRequest('http://localhost/api/admin/work-orders/wo-1/reject', {
      method: 'POST',
      body: JSON.stringify({ reason: 'Out of scope' }),
    });
    await POST(req, { params: Promise.resolve({ id: 'wo-1' }) });

    expect(auditInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        entity_type: 'work_order',
        entity_id: 'wo-1',
        action: 'rejected',
        actor_id: 'admin-1',
        actor_role: 'admin',
        changes: expect.objectContaining({ reason: 'Out of scope' }),
      })
    );
  });
});

// ─── PATCH /api/admin/work-orders/[id]/status ─────────────────────────────────

describe('PATCH /api/admin/work-orders/[id]/status — audit log', () => {
  beforeEach(() => vi.clearAllMocks());

  it('writes audit log with old_status and new_status on every transition', async () => {
    const { PATCH } = await import('../app/api/admin/work-orders/[id]/status/route');
    mockDb.auth.getSession.mockResolvedValue(makeAdminSession('admin-1'));

    const existingWo = { id: 'wo-1', client_id: 'client-1', status: 'pending', wo_number: 'WO-20240101-1234', title: 'Fix roof' };
    const updatedWo = { ...existingWo, status: 'in_progress' };
    const auditInsertMock = vi.fn().mockResolvedValue({ data: {}, error: null });

    mockDb.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { role: 'admin' } }),
            }),
          }),
        };
      }
      if (table === 'work_orders') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: existingWo, error: null }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: updatedWo, error: null }),
              }),
            }),
          }),
        };
      }
      if (table === 'audit_log') {
        return { insert: auditInsertMock };
      }
      if (table === 'notifications') {
        return { insert: vi.fn().mockReturnValue({ then: vi.fn() }) };
      }
      return { insert: vi.fn().mockResolvedValue({ data: {}, error: null }) };
    });

    const req = new NextRequest('http://localhost/api/admin/work-orders/wo-1/status', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'in_progress' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'wo-1' }) });
    expect(res.status).toBe(200);

    expect(auditInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        entity_type: 'work_order',
        entity_id: 'wo-1',
        action: 'status_changed',
        actor_id: 'admin-1',
        actor_role: 'admin',
        changes: expect.objectContaining({
          old_status: 'pending',
          new_status: 'in_progress',
        }),
      })
    );
  });

  it('auto-generates invoice when status is set to completed', async () => {
    const { PATCH } = await import('../app/api/admin/work-orders/[id]/status/route');
    mockDb.auth.getSession.mockResolvedValue(makeAdminSession('admin-1'));

    const existingWo = { id: 'wo-1', client_id: 'client-1', status: 'in_progress', wo_number: 'WO-20240101-1234', title: 'Fix roof' };
    const updatedWo = { ...existingWo, status: 'completed', completed_at: new Date().toISOString() };
    const invoiceInsertMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { id: 'inv-1', receipt_number: 'INV-20240101-5678' }, error: null }),
      }),
    });

    mockDb.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { role: 'admin' } }),
            }),
          }),
        };
      }
      if (table === 'work_orders') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: existingWo, error: null }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: updatedWo, error: null }),
              }),
            }),
          }),
        };
      }
      if (table === 'invoices') {
        return { insert: invoiceInsertMock };
      }
      if (table === 'audit_log') {
        return { insert: vi.fn().mockResolvedValue({ data: {}, error: null }) };
      }
      if (table === 'notifications') {
        return { insert: vi.fn().mockReturnValue({ then: vi.fn() }) };
      }
      return { insert: vi.fn().mockResolvedValue({ data: {}, error: null }) };
    });

    const req = new NextRequest('http://localhost/api/admin/work-orders/wo-1/status', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'completed' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'wo-1' }) });
    expect(res.status).toBe(200);

    // Invoice insert should have been called
    expect(invoiceInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        work_order_id: 'wo-1',
        client_id: 'client-1',
        receipt_number: expect.stringMatching(/^INV-\d{8}-\d{4}$/),
        materials_paid_by: 'company',
        total_billed: 0,
        amount_paid: 0,
      })
    );
  });
});
