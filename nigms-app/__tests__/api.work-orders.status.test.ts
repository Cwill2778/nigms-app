// Task 13 — PATCH /api/admin/work-orders/[id]/status
// Updates status, writes audit log with actor/timestamp/old+new status
// Auto-generates invoice when status=completed
// Requirements: 9.5, 9.7

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PATCH } from '../app/api/admin/work-orders/[id]/status/route';
import { NextRequest } from 'next/server';

const mockSupabaseClient = {
  auth: { getSession: vi.fn() },
  from: vi.fn(),
};

vi.mock('@/lib/supabase', () => ({
  createServerClient: vi.fn(() => mockSupabaseClient),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

const existingWo = {
  id: 'wo-123',
  client_id: 'client-1',
  status: 'pending',
  wo_number: 'WO-20240101-1234',
  title: 'Fix roof',
};

function setupAdminMocks(opts: {
  role?: string;
  woData?: object | null;
  updateData?: object | null;
  invoiceInsert?: ReturnType<typeof vi.fn>;
} = {}) {
  const {
    role = 'admin',
    woData = existingWo,
    updateData = { ...existingWo, status: 'in_progress' },
    invoiceInsert,
  } = opts;

  mockSupabaseClient.from.mockImplementation((table: string) => {
    if (table === 'users') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { role } }),
          }),
        }),
      };
    }
    if (table === 'work_orders') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: woData, error: null }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: updateData, error: null }),
            }),
          }),
        }),
      };
    }
    if (table === 'invoices' && invoiceInsert) {
      return { insert: invoiceInsert };
    }
    if (table === 'audit_log') {
      return { insert: vi.fn().mockResolvedValue({ data: {}, error: null }) };
    }
    if (table === 'notifications') {
      return { insert: vi.fn().mockReturnValue({ then: vi.fn() }) };
    }
    return { insert: vi.fn().mockResolvedValue({ data: {}, error: null }) };
  });
}

describe('PATCH /api/admin/work-orders/[id]/status', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 403 when user is not authenticated', async () => {
    mockSupabaseClient.auth.getSession.mockResolvedValue({ data: { session: null } });

    const req = new NextRequest('http://localhost/api/admin/work-orders/123/status', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'in_progress' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: '123' }) });
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toBe('Forbidden');
  });

  it('returns 403 when user is not admin', async () => {
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
    });
    setupAdminMocks({ role: 'client' });

    const req = new NextRequest('http://localhost/api/admin/work-orders/123/status', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'in_progress' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: '123' }) });
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toBe('Forbidden');
  });

  it('returns 400 when status is missing', async () => {
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'admin-1' } } },
    });
    setupAdminMocks();

    const req = new NextRequest('http://localhost/api/admin/work-orders/123/status', {
      method: 'PATCH',
      body: JSON.stringify({}),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: '123' }) });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('Invalid status');
  });

  it('returns 400 when status is invalid', async () => {
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'admin-1' } } },
    });
    setupAdminMocks();

    const req = new NextRequest('http://localhost/api/admin/work-orders/123/status', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'invalid_status' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: '123' }) });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('Invalid status');
  });

  it('updates work order status when admin provides valid status', async () => {
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'admin-1' } } },
    });
    setupAdminMocks({ updateData: { ...existingWo, status: 'in_progress' } });

    const req = new NextRequest('http://localhost/api/admin/work-orders/wo-123/status', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'in_progress' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'wo-123' }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.status).toBe('in_progress');
  });

  it('accepts all valid status values', async () => {
    const validStatuses = ['pending', 'in_progress', 'accepted', 'completed', 'cancelled'];

    for (const status of validStatuses) {
      vi.clearAllMocks();
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'admin-1' } } },
      });
      setupAdminMocks({
        updateData: { ...existingWo, status },
        invoiceInsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: 'inv-1', receipt_number: 'INV-20240101-1234' }, error: null }),
          }),
        }),
      });

      const req = new NextRequest('http://localhost/api/admin/work-orders/wo-123/status', {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      const res = await PATCH(req, { params: Promise.resolve({ id: 'wo-123' }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.status).toBe(status);
    }
  });

  it('returns 404 when work order not found', async () => {
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'admin-1' } } },
    });
    setupAdminMocks({ woData: null });

    const req = new NextRequest('http://localhost/api/admin/work-orders/nonexistent/status', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'in_progress' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'nonexistent' }) });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe('Work order not found');
  });

  it('writes audit log with old_status and new_status', async () => {
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'admin-1' } } },
    });

    const auditInsertMock = vi.fn().mockResolvedValue({ data: {}, error: null });

    mockSupabaseClient.from.mockImplementation((table: string) => {
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
                single: vi.fn().mockResolvedValue({
                  data: { ...existingWo, status: 'in_progress' },
                  error: null,
                }),
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

    const req = new NextRequest('http://localhost/api/admin/work-orders/wo-123/status', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'in_progress' }),
    });
    await PATCH(req, { params: Promise.resolve({ id: 'wo-123' }) });

    expect(auditInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        entity_type: 'work_order',
        entity_id: 'wo-123',
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
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'admin-1' } } },
    });

    const invoiceInsertMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: 'inv-1', receipt_number: 'INV-20240101-5678' },
          error: null,
        }),
      }),
    });

    setupAdminMocks({
      woData: { ...existingWo, status: 'in_progress' },
      updateData: { ...existingWo, status: 'completed', completed_at: new Date().toISOString() },
      invoiceInsert: invoiceInsertMock,
    });

    const req = new NextRequest('http://localhost/api/admin/work-orders/wo-123/status', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'completed' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'wo-123' }) });
    expect(res.status).toBe(200);

    expect(invoiceInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        work_order_id: 'wo-123',
        client_id: 'client-1',
        receipt_number: expect.stringMatching(/^INV-\d{8}-\d{4}$/),
        materials_paid_by: 'company',
        total_billed: 0,
        amount_paid: 0,
      })
    );
  });
});
