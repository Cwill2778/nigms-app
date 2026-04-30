// Task 13 — POST /api/admin/work-orders/[id]/accept
// Sets status='accepted', accepted_at=now(), writes audit log, notifies client
// Requirements: 9.2, 9.7

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../app/api/admin/work-orders/[id]/accept/route';
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

const updatedWo = {
  ...existingWo,
  status: 'accepted',
  accepted_at: new Date().toISOString(),
};

function setupAdminMocks(opts: { role?: string; woData?: object | null; updateData?: object | null } = {}) {
  const { role = 'admin', woData = existingWo, updateData = updatedWo } = opts;

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
            single: vi.fn().mockResolvedValue({ data: woData, error: woData ? null : null }),
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
    if (table === 'audit_log') {
      return { insert: vi.fn().mockResolvedValue({ data: {}, error: null }) };
    }
    if (table === 'notifications') {
      return { insert: vi.fn().mockReturnValue({ then: vi.fn() }) };
    }
    return { insert: vi.fn().mockResolvedValue({ data: {}, error: null }) };
  });
}

describe('POST /api/admin/work-orders/[id]/accept', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 403 when user is not authenticated', async () => {
    mockSupabaseClient.auth.getSession.mockResolvedValue({ data: { session: null } });

    const req = new NextRequest('http://localhost/api/admin/work-orders/123/accept', { method: 'POST' });
    const res = await POST(req, { params: Promise.resolve({ id: '123' }) });
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toBe('Forbidden');
  });

  it('returns 403 when user is not admin', async () => {
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
    });
    setupAdminMocks({ role: 'client' });

    const req = new NextRequest('http://localhost/api/admin/work-orders/123/accept', { method: 'POST' });
    const res = await POST(req, { params: Promise.resolve({ id: '123' }) });
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toBe('Forbidden');
  });

  it('sets status=accepted and accepted_at when admin accepts', async () => {
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'admin-1' } } },
    });
    setupAdminMocks();

    const req = new NextRequest('http://localhost/api/admin/work-orders/wo-123/accept', { method: 'POST' });
    const res = await POST(req, { params: Promise.resolve({ id: 'wo-123' }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.status).toBe('accepted');
    expect(data.accepted_at).toBeDefined();
  });

  it('returns 404 when work order not found', async () => {
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'admin-1' } } },
    });
    setupAdminMocks({ woData: null, updateData: null });

    const req = new NextRequest('http://localhost/api/admin/work-orders/nonexistent/accept', { method: 'POST' });
    const res = await POST(req, { params: Promise.resolve({ id: 'nonexistent' }) });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe('Work order not found');
  });

  it('writes audit log entry with action=accepted', async () => {
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

    const req = new NextRequest('http://localhost/api/admin/work-orders/wo-123/accept', { method: 'POST' });
    await POST(req, { params: Promise.resolve({ id: 'wo-123' }) });

    expect(auditInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        entity_type: 'work_order',
        entity_id: 'wo-123',
        action: 'accepted',
        actor_role: 'admin',
      })
    );
  });
});
