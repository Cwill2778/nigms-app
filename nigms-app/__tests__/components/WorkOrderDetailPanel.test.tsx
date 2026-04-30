// Unit tests for WorkOrderDetailPanel component
// Validates: Requirements 3.5
// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WorkOrderDetailPanel from '@/components/WorkOrderDetailPanel';
import type { WorkOrder, ChangeOrder, TimeEntry, UserProfile, WorkOrderPicture } from '@/lib/types';

// Mock child components
vi.mock('@/components/LoadingSpinner', () => ({
  default: ({ size }: { size?: string }) => <div data-testid="loading-spinner" data-size={size}>Loading...</div>,
}));
vi.mock('@/components/StatusBadge', () => ({
  default: ({ status }: { status: string }) => <span data-testid="status-badge">{status}</span>,
}));
vi.mock('@/components/TimeTracker', () => ({
  default: () => <div data-testid="time-tracker">TimeTracker</div>,
}));
vi.mock('@/components/EstimateDocument', () => ({
  default: () => <div data-testid="estimate-document">EstimateDocument</div>,
}));
vi.mock('@/components/BillDocument', () => ({
  default: () => <div data-testid="bill-document">BillDocument</div>,
}));
vi.mock('@/components/ICAgreement', () => ({
  default: () => <div data-testid="ic-agreement">ICAgreement</div>,
}));
vi.mock('@/components/ChangeOrderForm', () => ({
  default: () => <div data-testid="change-order-form">ChangeOrderForm</div>,
}));

const mockWorkOrder: WorkOrder = {
  id: 'wo-1',
  client_id: 'client-1',
  property_id: null,
  title: 'Roof Repair',
  description: 'Fix the roof shingles',
  status: 'pending',
  quoted_amount: 1500,
  wo_number: null,
  urgency: 'high',
  category: 'roof repair',
  property_address: '123 Main St, Rome, GA',
  inspection_notes: 'Needs immediate attention',
  accepted_at: null,
  completed_at: null,
  total_billable_minutes: 0,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockClient: UserProfile = {
  id: 'client-1',
  username: 'jdoe',
  role: 'client',
  full_name: 'Test User',
  company_name: null,
  is_active: true,
  requires_password_reset: false,
  first_name: 'John',
  last_name: 'Doe',
  phone: null,
  email: 'john@example.com',
  created_at: '2024-01-01T00:00:00Z',
};

const mockDetail = {
  workOrder: mockWorkOrder,
  estimate: null,
  bill: null,
  changeOrders: [] as ChangeOrder[],
  timeEntries: [] as TimeEntry[],
  client: mockClient,
  pictures: [] as WorkOrderPicture[],
};

describe('WorkOrderDetailPanel', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('shows loading spinner while fetching', () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {}));
    render(<WorkOrderDetailPanel workOrderId="wo-1" onClose={() => {}} />);
    expect(screen.getByTestId('loading-spinner')).toBeTruthy();
  });

  it('displays work order title after loading', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockDetail,
    } as Response);

    render(<WorkOrderDetailPanel workOrderId="wo-1" onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Roof Repair')).toBeTruthy();
    });
  });

  it('shows "Pending Assignment" when no wo_number', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockDetail,
    } as Response);

    render(<WorkOrderDetailPanel workOrderId="wo-1" onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getAllByText('Pending Assignment').length).toBeGreaterThan(0);
    });
  });

  it('shows status badge', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockDetail,
    } as Response);

    render(<WorkOrderDetailPanel workOrderId="wo-1" onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByTestId('status-badge')).toBeTruthy();
    });
  });

  it('shows Accept and Reject buttons for pending work orders', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockDetail,
    } as Response);

    render(<WorkOrderDetailPanel workOrderId="wo-1" onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Accept')).toBeTruthy();
      expect(screen.getByText('Reject')).toBeTruthy();
    });
  });

  it('shows Modify button for actionable work orders', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockDetail,
    } as Response);

    render(<WorkOrderDetailPanel workOrderId="wo-1" onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Modify')).toBeTruthy();
    });
  });

  it('renders Overview tab by default', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockDetail,
    } as Response);

    render(<WorkOrderDetailPanel workOrderId="wo-1" onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeTruthy();
    });
  });

  it('shows property address in overview', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockDetail,
    } as Response);

    render(<WorkOrderDetailPanel workOrderId="wo-1" onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('123 Main St, Rome, GA')).toBeTruthy();
    });
  });

  it('shows client name in overview', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockDetail,
    } as Response);

    render(<WorkOrderDetailPanel workOrderId="wo-1" onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeTruthy();
    });
  });

  it('calls accept API when Accept is clicked', async () => {
    const acceptedWO = { ...mockWorkOrder, status: 'accepted' as const, wo_number: 'WO-2024-0001' };
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockDetail,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => acceptedWO,
      } as Response);

    render(<WorkOrderDetailPanel workOrderId="wo-1" onClose={() => {}} />);

    await waitFor(() => screen.getByText('Accept'));
    fireEvent.click(screen.getByText('Accept'));

    await waitFor(() => {
      const calls = vi.mocked(fetch).mock.calls;
      const acceptCall = calls.find(
        ([url, opts]) => url === '/api/admin/work-orders/wo-1/accept' && (opts as RequestInit)?.method === 'POST'
      );
      expect(acceptCall).toBeTruthy();
    });
  });

  it('calls reject API when Reject is clicked', async () => {
    const rejectedWO = { ...mockWorkOrder, status: 'cancelled' as const };
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockDetail,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => rejectedWO,
      } as Response);

    render(<WorkOrderDetailPanel workOrderId="wo-1" onClose={() => {}} />);

    await waitFor(() => screen.getByText('Reject'));
    fireEvent.click(screen.getByText('Reject'));

    await waitFor(() => {
      const calls = vi.mocked(fetch).mock.calls;
      const rejectCall = calls.find(
        ([url, opts]) => url === '/api/admin/work-orders/wo-1/reject' && (opts as RequestInit)?.method === 'POST'
      );
      expect(rejectCall).toBeTruthy();
    });
  });

  it('shows error state and retry button on fetch failure', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Work order not found' }),
    } as Response);

    render(<WorkOrderDetailPanel workOrderId="wo-1" onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Work order not found')).toBeTruthy();
      expect(screen.getByText('Retry')).toBeTruthy();
    });
  });

  it('does not show action buttons for completed work orders', async () => {
    const completedDetail = {
      ...mockDetail,
      workOrder: { ...mockWorkOrder, status: 'completed' as const, wo_number: 'WO-2024-0001' },
    };
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => completedDetail,
    } as Response);

    render(<WorkOrderDetailPanel workOrderId="wo-1" onClose={() => {}} />);

    // Wait for data to load - use getAllByText since WO number appears in header and overview
    await waitFor(() => {
      expect(screen.getAllByText('WO-2024-0001').length).toBeGreaterThan(0);
    });

    // For completed status, isActionable is false so no Accept/Reject buttons
    const acceptBtn = screen.queryByRole('button', { name: /^Accept$/ });
    const rejectBtn = screen.queryByRole('button', { name: /^Reject$/ });
    expect(acceptBtn).toBeNull();
    expect(rejectBtn).toBeNull();
  });
});
