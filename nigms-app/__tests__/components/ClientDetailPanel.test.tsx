// Unit tests for ClientDetailPanel component
// Validates: Requirements 3.4
// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ClientDetailPanel from '@/components/ClientDetailPanel';
import type { UserProfile, ClientAddress, WorkOrder, Payment, Message, WorkOrderPicture } from '@/lib/types';

// Mock child components that have complex deps
vi.mock('@/components/LoadingSpinner', () => ({
  default: ({ size }: { size?: string }) => <div data-testid="loading-spinner" data-size={size}>Loading...</div>,
}));
vi.mock('@/components/StatusBadge', () => ({
  default: ({ status }: { status: string }) => <span data-testid="status-badge">{status}</span>,
}));

const mockProfile: UserProfile = {
  id: 'client-1',
  username: 'jdoe',
  role: 'client',
  full_name: 'Test User',
  company_name: null,
  is_active: true,
  requires_password_reset: false,
  first_name: 'John',
  last_name: 'Doe',
  phone: '555-1234',
  email: 'john@example.com',
  created_at: '2024-01-01T00:00:00Z',
};

const mockAddresses: ClientAddress[] = [
  {
    id: 'addr-1',
    client_id: 'client-1',
    label: 'Home',
    street: '123 Main St',
    city: 'Rome',
    state: 'GA',
    zip: '30161',
    is_primary: true,
    created_at: '2024-01-01T00:00:00Z',
  },
];

const mockWorkOrders: WorkOrder[] = [
  {
    id: 'wo-1',
    client_id: 'client-1',
    property_id: null,
    title: 'Roof Repair',
    description: null,
    status: 'completed',
    quoted_amount: 1500,
    wo_number: 'WO-2024-0001',
    urgency: null,
    category: null,
    property_address: null,
    inspection_notes: null,
    accepted_at: null,
    completed_at: '2024-01-10T00:00:00Z',
    total_billable_minutes: 120,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-10T00:00:00Z',
  },
];

const mockPayments: Payment[] = [
  {
    id: 'pay-1',
    work_order_id: 'wo-1',
    client_id: 'client-1',
    amount: 1500,
    method: 'stripe',
    status: 'paid',
    stripe_payment_intent_id: null,
    receipt_number: 'RCT-2024-0001',
    notes: null,
    payment_date: '2024-01-10T00:00:00Z',
    created_at: '2024-01-10T00:00:00Z',
  },
];

const mockMessages: Message[] = [
  {
    id: 'msg-1',
    sender_id: 'client-1',
    recipient_id: 'admin-1',
    sender_role: 'client',
    body: 'When will you start?',
    read_at: null,
    created_at: '2024-01-05T00:00:00Z',
  },
];

const mockPictures: WorkOrderPicture[] = [];

const mockClientDetail = {
  profile: mockProfile,
  addresses: mockAddresses,
  workOrders: mockWorkOrders,
  payments: mockPayments,
  messages: mockMessages,
  pictures: mockPictures,
};

describe('ClientDetailPanel', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('shows loading spinner while fetching', () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {}));
    render(<ClientDetailPanel clientId="client-1" onClose={() => {}} />);
    expect(screen.getByTestId('loading-spinner')).toBeTruthy();
  });

  it('displays client name in header after loading', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockClientDetail,
    } as Response);

    render(<ClientDetailPanel clientId="client-1" onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
    });
  });

  it('displays client email in header', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockClientDetail,
    } as Response);

    render(<ClientDetailPanel clientId="client-1" onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getAllByText('john@example.com').length).toBeGreaterThan(0);
    });
  });

  it('renders all tabs', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockClientDetail,
    } as Response);

    render(<ClientDetailPanel clientId="client-1" onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Contact')).toBeTruthy();
      expect(screen.getByText('Work Orders')).toBeTruthy();
      expect(screen.getByText('Payments')).toBeTruthy();
      expect(screen.getByText('Messages')).toBeTruthy();
      expect(screen.getByText('Pictures')).toBeTruthy();
    });
  });

  it('shows contact info by default', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockClientDetail,
    } as Response);

    render(<ClientDetailPanel clientId="client-1" onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('555-1234')).toBeTruthy();
    });
  });

  it('shows address in contact tab', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockClientDetail,
    } as Response);

    render(<ClientDetailPanel clientId="client-1" onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('123 Main St')).toBeTruthy();
    });
  });

  it('switches to Work Orders tab and shows work orders', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockClientDetail,
    } as Response);

    render(<ClientDetailPanel clientId="client-1" onClose={() => {}} />);

    await waitFor(() => screen.getByText('Work Orders'));
    fireEvent.click(screen.getByText('Work Orders'));

    await waitFor(() => {
      expect(screen.getByText('WO-2024-0001')).toBeTruthy();
    });
  });

  it('switches to Payments tab and shows payments', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockClientDetail,
    } as Response);

    render(<ClientDetailPanel clientId="client-1" onClose={() => {}} />);

    await waitFor(() => screen.getByText('Payments'));
    fireEvent.click(screen.getByText('Payments'));

    await waitFor(() => {
      expect(screen.getByText('$1,500.00')).toBeTruthy();
    });
  });

  it('switches to Messages tab and shows messages', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockClientDetail,
    } as Response);

    render(<ClientDetailPanel clientId="client-1" onClose={() => {}} />);

    await waitFor(() => screen.getByText('Messages'));
    fireEvent.click(screen.getByText('Messages'));

    await waitFor(() => {
      expect(screen.getByText('When will you start?')).toBeTruthy();
    });
  });

  it('shows empty state for pictures when none exist', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockClientDetail,
    } as Response);

    render(<ClientDetailPanel clientId="client-1" onClose={() => {}} />);

    await waitFor(() => screen.getByText('Pictures'));
    fireEvent.click(screen.getByText('Pictures'));

    await waitFor(() => {
      expect(screen.getByText('No pictures yet.')).toBeTruthy();
    });
  });

  it('shows error state and retry button on fetch failure', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Not found' }),
    } as Response);

    render(<ClientDetailPanel clientId="client-1" onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Not found')).toBeTruthy();
      expect(screen.getByText('Retry')).toBeTruthy();
    });
  });

  it('shows empty state for work orders', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...mockClientDetail, workOrders: [] }),
    } as Response);

    render(<ClientDetailPanel clientId="client-1" onClose={() => {}} />);

    await waitFor(() => screen.getByText('Work Orders'));
    fireEvent.click(screen.getByText('Work Orders'));

    await waitFor(() => {
      expect(screen.getByText('No work orders yet.')).toBeTruthy();
    });
  });
});
