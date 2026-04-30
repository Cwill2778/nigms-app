// Unit tests for ChangeOrderForm component
// Validates: Requirements 3.10
// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChangeOrderForm from '@/components/ChangeOrderForm';
import type { ChangeOrder } from '@/lib/types';

// Mock PrintButton
vi.mock('@/components/PrintButton', () => ({
  default: () => <button data-testid="print-button">Print</button>,
}));

const mockChangeOrders: ChangeOrder[] = [
  {
    id: 'co-1',
    work_order_id: 'wo-1',
    description: 'Add extra drywall',
    additional_cost: 250,
    status: 'accepted',
    created_at: '2024-01-05T00:00:00Z',
  },
  {
    id: 'co-2',
    work_order_id: 'wo-1',
    description: 'Replace window frame',
    additional_cost: 150,
    status: 'pending',
    created_at: '2024-01-06T00:00:00Z',
  },
];

describe('ChangeOrderForm', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('renders existing change orders', () => {
    render(<ChangeOrderForm workOrderId="wo-1" changeOrders={mockChangeOrders} />);
    expect(screen.getByText('Add extra drywall')).toBeTruthy();
    expect(screen.getByText('Replace window frame')).toBeTruthy();
  });

  it('shows empty state when no change orders', () => {
    render(<ChangeOrderForm workOrderId="wo-1" changeOrders={[]} />);
    expect(screen.getByText('No change orders yet.')).toBeTruthy();
  });

  it('renders change order statuses', () => {
    render(<ChangeOrderForm workOrderId="wo-1" changeOrders={mockChangeOrders} />);
    expect(screen.getByText('accepted')).toBeTruthy();
    expect(screen.getByText('pending')).toBeTruthy();
  });

  it('renders additional costs', () => {
    render(<ChangeOrderForm workOrderId="wo-1" changeOrders={mockChangeOrders} />);
    expect(screen.getByText('+$250.00')).toBeTruthy();
    expect(screen.getByText('+$150.00')).toBeTruthy();
  });

  it('renders the add change order form', () => {
    render(<ChangeOrderForm workOrderId="wo-1" changeOrders={[]} />);
    // Use getAllByText since "Add Change Order" appears as both heading and button
    expect(screen.getAllByText('Add Change Order').length).toBeGreaterThan(0);
    // Labels don't have htmlFor, so query by placeholder/role
    expect(screen.getByRole('textbox')).toBeTruthy(); // textarea for description
    expect(screen.getByRole('spinbutton')).toBeTruthy(); // number input for cost
  });

  it('submits new change order and appends to list', async () => {
    const newOrder: ChangeOrder = {
      id: 'co-3',
      work_order_id: 'wo-1',
      description: 'New scope item',
      additional_cost: 100,
      status: 'pending',
      created_at: '2024-01-07T00:00:00Z',
    };
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => newOrder,
    } as Response);

    render(<ChangeOrderForm workOrderId="wo-1" changeOrders={[]} />);

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'New scope item' },
    });
    fireEvent.change(screen.getByRole('spinbutton'), {
      target: { value: '100' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Add Change Order/i }));

    await waitFor(() => {
      expect(screen.getByText('New scope item')).toBeTruthy();
    });
  });

  it('shows error message on failed submission', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Server error' }),
    } as Response);

    render(<ChangeOrderForm workOrderId="wo-1" changeOrders={[]} />);

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Test' },
    });
    fireEvent.change(screen.getByRole('spinbutton'), {
      target: { value: '50' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Add Change Order/i }));

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeTruthy();
    });
  });

  it('renders PrintButton', () => {
    render(<ChangeOrderForm workOrderId="wo-1" changeOrders={[]} />);
    expect(screen.getByTestId('print-button')).toBeTruthy();
  });
});
