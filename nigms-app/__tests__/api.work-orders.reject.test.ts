// Task 13 — POST /api/admin/work-orders/[id]/reject
// Sets status='cancelled', records rejection reason in inspection_notes
// Writes audit log, notifies client with reason
// Requirements: 9.3, 9.7

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../app/api/admin/work-orders/[id]/reject/route';
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

function setupAdminMocks(opts: { role?: string; woData?: object | null; updateData?: object | null } = {}) {
  const { role = 'admin', woData = existingWo, updateData = { ...existingWo, status: 'cancelled', inspection_notes: 'Out of scope' } } = opts;

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
    if (table === 'audit_log') {
      return { insert: vi.fn().mockResolvedValue({ data: {}, error: null }) };
    }
    if (table === 'notifications') {
      return { insert: vi.fn().mockReturnValue({ then: vi.fn() }) };
    }
    return { insert: vi.fn().mockResolvedValue({ data: {}, error: null }) };
  });
}

describe('POST /api/admin/work-orders/[id]/reject', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 403 when user is not authenticated', async () => {
    mockSupabaseClient.auth.getSession.mockResolvedValue({ data: { session: null } });

    const req = new NextRequest('http://localhost/api/admin/work-orders/123/reject', {
      method: 'POST',
      body: JSON.stringify({ reason: 'Out of scope' }),
    });
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

    const req = new NextRequest('http://localhost/api/admin/work-orders/123/reject', {
      method: 'POST',
      body: JSON.stringify({ reason: 'Out of scope' }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: '123' }) });
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toBe('Forbidden');
  });

  it('returns 400 when reason is missing', async () => {
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'admin-1' } } },
    });
    setupAdminMocks();

    const req = new NextRequest('http://localhost/api/admin/work-orders/wo-123/reject', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'wo-123' }) });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/reason/i);
  });

  it('sets status=cancelled and records reason in inspection_notes', async () => {
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'admin-1' } } },
    });
    setupAdminMocks();

    const req = new NextRequest('http://localhost/api/admin/work-orders/wo-123/reject', {
      method: 'POST',
      body: JSON.stringify({ reason: 'Out of scope' }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'wo-123' }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.status).toBe('cancelled');
    expect(data.inspection_notes).toBe('Out of scope');
  });

  it('returns 404 when work order not found', async () => {
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'admin-1' } } },
    });
    setupAdminMocks({ woData: null });

    const req = new NextRequest('http://localhost/api/admin/work-orders/nonexistent/reject', {
      method: 'POST',
      body: JSON.stringify({ reason: 'Out of scope' }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'nonexistent' }) });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe('Work order not found');
  });

  it('returns 500 when database update fails', async () => {
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'admin-1' } } },
    });

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
                single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } }),
              }),
            }),
          }),
        };
      }
      return { insert: vi.fn().mockResolvedValue({ data: {}, error: null }) };
    });

    const req = new NextRequest('http://localhost/api/admin/work-orders/wo-123/reject', {
      method: 'POST',
      body: JSON.stringify({ reason: 'Out of scope' }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'wo-123' }) });
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe('Database error');
  });

  it('writes audit log with rejection reason', async () => {
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
                  data: { ...existingWo, status: 'cancelled', inspection_notes: 'Out of scope' },
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

    const req = new NextRequest('http://localhost/api/admin/work-orders/wo-123/reject', {
      method: 'POST',
      body: JSON.stringify({ reason: 'Out of scope' }),
    });
    await POST(req, { params: Promise.resolve({ id: 'wo-123' }) });

    expect(auditInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        entity_type: 'work_order',
        entity_id: 'wo-123',
        action: 'rejected',
        actor_role: 'admin',
        changes: expect.objectContaining({ reason: 'Out of scope' }),
      })
    );
  });
});
