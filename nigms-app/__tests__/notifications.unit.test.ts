/**
 * Unit tests for notification helpers.
 * Task 22.1 — Requirements: 11.1, 11.2, 11.5
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildBrandedHtml } from '../lib/email';

// ─── Hoisted mocks ────────────────────────────────────────────────────────────

const mockSendBrandedEmail = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockInsert = vi.hoisted(() => vi.fn());
const mockFrom = vi.hoisted(() => vi.fn());
const mockSelect = vi.hoisted(() => vi.fn());
const mockEq = vi.hoisted(() => vi.fn());
const mockSingle = vi.hoisted(() => vi.fn());

// ─── Mock @supabase/supabase-js ───────────────────────────────────────────────

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

// ─── Mock lib/email ───────────────────────────────────────────────────────────

vi.mock('../lib/email', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/email')>();
  return {
    ...actual,
    sendBrandedEmail: mockSendBrandedEmail,
  };
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function setupAdminQuery(admins: { id: string; email: string | null }[]) {
  // Chain: from('users').select('id, email').eq('role', 'admin')
  const eqMock = vi.fn().mockResolvedValue({ data: admins, error: null });
  const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
  mockFrom.mockReturnValue({ select: selectMock, insert: mockInsert });
  mockInsert.mockReturnValue({ then: (cb: (v: unknown) => void) => cb(undefined) });
  return { eqMock, selectMock };
}

function setupClientQuery(client: { id: string; email: string | null } | null) {
  // Chain: from('users').select('id, email').eq('id', clientId).single()
  mockSingle.mockResolvedValue({ data: client, error: client ? null : { message: 'not found' } });
  mockEq.mockReturnValue({ single: mockSingle });
  mockSelect.mockReturnValue({ eq: mockEq });
  mockFrom.mockReturnValue({ select: mockSelect, insert: mockInsert });
  mockInsert.mockReturnValue({ then: (cb: (v: unknown) => void) => cb(undefined) });
}

// ─── buildBrandedHtml ─────────────────────────────────────────────────────────

describe('buildBrandedHtml — branded email template (Requirement 11.5)', () => {
  it('includes trust-navy (#1B263B) header background', () => {
    const html = buildBrandedHtml('<p>Test content</p>');
    expect(html).toContain('#1B263B');
  });

  it('includes precision-coral (#FF7F7F) accent', () => {
    const html = buildBrandedHtml('<p>Test content</p>');
    expect(html).toContain('#FF7F7F');
  });

  it('includes NAILED IT logo text', () => {
    const html = buildBrandedHtml('<p>Test content</p>');
    expect(html).toContain('NAILED IT');
  });

  it('includes the provided content in the body', () => {
    const content = '<p>Hello, this is a test message.</p>';
    const html = buildBrandedHtml(content);
    expect(html).toContain(content);
  });

  it('includes the company tagline', () => {
    const html = buildBrandedHtml('<p>Test</p>');
    expect(html).toContain('General Maintenance');
  });

  it('includes footer copyright', () => {
    const html = buildBrandedHtml('<p>Test</p>');
    expect(html).toContain('Nailed It');
  });
});

// ─── notifyAdmin ─────────────────────────────────────────────────────────────

describe('notifyAdmin (Requirement 11.1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSendBrandedEmail.mockResolvedValue(undefined);
  });

  it('creates in-app notification for each admin on work_order_submitted event', async () => {
    const admins = [
      { id: 'admin-1', email: 'admin@example.com' },
    ];
    setupAdminQuery(admins);

    const { notifyAdmin } = await import('../lib/notifications');
    await notifyAdmin('work_order_submitted', {
      title: 'Fix the roof',
      wo_number: 'WO-20240101-1234',
      work_order_id: 'wo-uuid-1',
    });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'admin-1',
        type: 'work_order_submitted',
        title: 'New Work Order Submitted',
      })
    );
  });

  it('sends branded email to admin on work_order_submitted event', async () => {
    const admins = [{ id: 'admin-1', email: 'admin@example.com' }];
    setupAdminQuery(admins);

    const { notifyAdmin } = await import('../lib/notifications');
    await notifyAdmin('work_order_submitted', {
      title: 'Fix the roof',
      wo_number: 'WO-20240101-1234',
      work_order_id: 'wo-uuid-1',
    });

    expect(mockSendBrandedEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'admin@example.com',
        subject: expect.stringContaining('Fix the roof'),
      })
    );
  });

  it('notifies all admin users when multiple admins exist', async () => {
    const admins = [
      { id: 'admin-1', email: 'admin1@example.com' },
      { id: 'admin-2', email: 'admin2@example.com' },
    ];
    setupAdminQuery(admins);

    const { notifyAdmin } = await import('../lib/notifications');
    await notifyAdmin('quote_approved', {
      estimate_number: 'EST-001',
      work_order_id: 'wo-uuid-1',
      title: 'Roof repair',
    });

    expect(mockSendBrandedEmail).toHaveBeenCalledTimes(2);
  });

  it('does not throw when no admin users are found', async () => {
    setupAdminQuery([]);

    const { notifyAdmin } = await import('../lib/notifications');
    await expect(
      notifyAdmin('work_order_submitted', { title: 'Test', wo_number: 'WO-001' })
    ).resolves.toBeUndefined();
  });

  it('skips email when admin has no email address', async () => {
    const admins = [{ id: 'admin-1', email: null }];
    setupAdminQuery(admins);

    const { notifyAdmin } = await import('../lib/notifications');
    await notifyAdmin('new_message', { sender_name: 'Client A' });

    // In-app notification should still be created
    expect(mockInsert).toHaveBeenCalled();
    // Email should NOT be sent
    expect(mockSendBrandedEmail).not.toHaveBeenCalled();
  });
});

// ─── notifyClient ─────────────────────────────────────────────────────────────

describe('notifyClient (Requirement 11.2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSendBrandedEmail.mockResolvedValue(undefined);
  });

  it('creates in-app notification for client on work_order_status_changed event', async () => {
    setupClientQuery({ id: 'client-1', email: 'client@example.com' });

    const { notifyClient } = await import('../lib/notifications');
    await notifyClient('client-1', 'work_order_status_changed', {
      title: 'Fix the roof',
      wo_number: 'WO-001',
      work_order_id: 'wo-uuid-1',
      new_status: 'in_progress',
    });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'client-1',
        type: 'work_order_status_changed',
        title: 'Work Order Status Updated',
      })
    );
  });

  it('sends branded email to client on status change', async () => {
    setupClientQuery({ id: 'client-1', email: 'client@example.com' });

    const { notifyClient } = await import('../lib/notifications');
    await notifyClient('client-1', 'work_order_status_changed', {
      title: 'Fix the roof',
      wo_number: 'WO-001',
      work_order_id: 'wo-uuid-1',
      new_status: 'completed',
    });

    expect(mockSendBrandedEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'client@example.com',
      })
    );
  });

  it('creates in-app notification for client on invoice_generated event', async () => {
    setupClientQuery({ id: 'client-1', email: 'client@example.com' });

    const { notifyClient } = await import('../lib/notifications');
    await notifyClient('client-1', 'invoice_generated', {
      title: 'Roof repair',
      receipt_number: 'INV-001',
      work_order_id: 'wo-uuid-1',
      total_billed: 250,
    });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'client-1',
        type: 'invoice_generated',
        title: 'Invoice Ready',
      })
    );
  });

  it('creates in-app notification for client on time_allocation_alert event', async () => {
    setupClientQuery({ id: 'client-1', email: 'client@example.com' });

    const { notifyClient } = await import('../lib/notifications');
    await notifyClient('client-1', 'time_allocation_alert', {
      minutes_remaining: 30,
      days_remaining: 3,
      subscription_id: 'sub-uuid-1',
    });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'client-1',
        type: 'time_allocation_alert',
        title: 'Time Allocation Expiring Soon',
      })
    );
  });

  it('does not throw when client is not found', async () => {
    setupClientQuery(null);

    const { notifyClient } = await import('../lib/notifications');
    await expect(
      notifyClient('nonexistent-id', 'work_order_accepted', { title: 'Test' })
    ).resolves.toBeUndefined();
  });

  it('skips email when client has no email address', async () => {
    setupClientQuery({ id: 'client-1', email: null });

    const { notifyClient } = await import('../lib/notifications');
    await notifyClient('client-1', 'quote_generated', {
      title: 'Roof repair',
      estimate_number: 'EST-001',
      work_order_id: 'wo-uuid-1',
      total_amount: 500,
    });

    // In-app notification should still be created
    expect(mockInsert).toHaveBeenCalled();
    // Email should NOT be sent
    expect(mockSendBrandedEmail).not.toHaveBeenCalled();
  });
});
