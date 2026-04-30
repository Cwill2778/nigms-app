// Feature: comprehensive-implementation-fixes — Task 5.3: PATCH /api/admin/work-orders/[id]
// Bug Condition 2.3: Update work order fields endpoint

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PATCH } from '../app/api/admin/work-orders/[id]/route';
import { NextRequest } from 'next/server';

// Mock Supabase
const mockSupabaseClient = {
  auth: {
    getSession: vi.fn(),
  },
  from: vi.fn(),
};

vi.mock('@/lib/supabase', () => ({
  createServerClient: vi.fn(() => mockSupabaseClient),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

describe('PATCH /api/admin/work-orders/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 403 when user is not authenticated', async () => {
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: null },
    });

    const request = new NextRequest('http://localhost:3000/api/admin/work-orders/123', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Updated Title' }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: '123' }) });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Forbidden');
  });

  it('returns 403 when user is not admin', async () => {
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-123' } } },
    });

    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { role: 'client' },
          }),
        }),
      }),
    });

    const request = new NextRequest('http://localhost:3000/api/admin/work-orders/123', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Updated Title' }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: '123' }) });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Forbidden');
  });

  it('updates work order fields when admin makes request', async () => {
    const mockWorkOrder = {
      id: 'wo-123',
      title: 'Updated Title',
      description: 'Updated Description',
      urgency: 'high',
      category: 'plumbing',
      updated_at: expect.any(String),
    };

    // Mock admin authentication
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'admin-123' } } },
    });

    let updateCalled = false;
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { role: 'admin' },
              }),
            }),
          }),
        };
      }
      if (table === 'work_orders') {
        return {
          update: vi.fn().mockImplementation((updates) => {
            updateCalled = true;
            expect(updates).toHaveProperty('title', 'Updated Title');
            expect(updates).toHaveProperty('description', 'Updated Description');
            expect(updates).toHaveProperty('urgency', 'high');
            expect(updates).toHaveProperty('category', 'plumbing');
            expect(updates).toHaveProperty('updated_at');
            return {
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: mockWorkOrder,
                    error: null,
                  }),
                }),
              }),
            };
          }),
        };
      }
      return {};
    });

    const request = new NextRequest('http://localhost:3000/api/admin/work-orders/wo-123', {
      method: 'PATCH',
      body: JSON.stringify({
        title: 'Updated Title',
        description: 'Updated Description',
        urgency: 'high',
        category: 'plumbing',
      }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: 'wo-123' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.title).toBe('Updated Title');
    expect(data.description).toBe('Updated Description');
    expect(data.urgency).toBe('high');
    expect(data.category).toBe('plumbing');
    expect(updateCalled).toBe(true);
  });

  it('only updates allowed fields', async () => {
    const mockWorkOrder = {
      id: 'wo-123',
      title: 'Updated Title',
      updated_at: expect.any(String),
    };

    // Mock admin authentication
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'admin-123' } } },
    });

    let updatePayload: Record<string, unknown> = {};
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { role: 'admin' },
              }),
            }),
          }),
        };
      }
      if (table === 'work_orders') {
        return {
          update: vi.fn().mockImplementation((updates) => {
            updatePayload = updates;
            return {
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: mockWorkOrder,
                    error: null,
                  }),
                }),
              }),
            };
          }),
        };
      }
      return {};
    });

    const request = new NextRequest('http://localhost:3000/api/admin/work-orders/wo-123', {
      method: 'PATCH',
      body: JSON.stringify({
        title: 'Updated Title',
        malicious_field: 'should not be included',
        id: 'should not be updated',
      }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: 'wo-123' }) });
    await response.json();

    expect(response.status).toBe(200);
    expect(updatePayload).toHaveProperty('title', 'Updated Title');
    expect(updatePayload).toHaveProperty('updated_at');
    expect(updatePayload).not.toHaveProperty('malicious_field');
    expect(updatePayload).not.toHaveProperty('id');
  });

  it('returns 404 when work order not found', async () => {
    // Mock admin authentication
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'admin-123' } } },
    });

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { role: 'admin' },
              }),
            }),
          }),
        };
      }
      if (table === 'work_orders') {
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      return {};
    });

    const request = new NextRequest('http://localhost:3000/api/admin/work-orders/nonexistent', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Updated Title' }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: 'nonexistent' }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Work order not found');
  });

  it('returns 500 when database error occurs', async () => {
    // Mock admin authentication
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'admin-123' } } },
    });

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { role: 'admin' },
              }),
            }),
          }),
        };
      }
      if (table === 'work_orders') {
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Database connection failed' },
                }),
              }),
            }),
          }),
        };
      }
      return {};
    });

    const request = new NextRequest('http://localhost:3000/api/admin/work-orders/wo-123', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Updated Title' }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: 'wo-123' }) });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Database connection failed');
  });

  it('updates multiple allowed fields at once', async () => {
    const mockWorkOrder = {
      id: 'wo-123',
      title: 'New Title',
      description: 'New Description',
      urgency: 'low',
      category: 'electrical',
      property_address: '123 Main St',
      inspection_notes: 'Looks good',
      quoted_amount: 500.00,
      status: 'in_progress',
      updated_at: expect.any(String),
    };

    // Mock admin authentication
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'admin-123' } } },
    });

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { role: 'admin' },
              }),
            }),
          }),
        };
      }
      if (table === 'work_orders') {
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockWorkOrder,
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      return {};
    });

    const request = new NextRequest('http://localhost:3000/api/admin/work-orders/wo-123', {
      method: 'PATCH',
      body: JSON.stringify({
        title: 'New Title',
        description: 'New Description',
        urgency: 'low',
        category: 'electrical',
        property_address: '123 Main St',
        inspection_notes: 'Looks good',
        quoted_amount: 500.00,
        status: 'in_progress',
      }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: 'wo-123' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toMatchObject({
      title: 'New Title',
      description: 'New Description',
      urgency: 'low',
      category: 'electrical',
      property_address: '123 Main St',
      inspection_notes: 'Looks good',
      quoted_amount: 500.00,
      status: 'in_progress',
    });
  });
});
