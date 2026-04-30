// Unit tests for BillDocument component
// Validates: Requirements 3.8
// @vitest-environment jsdom

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import BillDocument from '@/components/BillDocument';
import type { Bill, WorkOrder, UserProfile } from '@/lib/types';

// Mock PrintButton
vi.mock('@/components/PrintButton', () => ({
  default: () => <button data-testid="print-button">Print</button>,
}));

const mockClient: UserProfile = {
  id: 'client-1',
  username: 'jdoe',
  role: 'client',
  full_name: 'Test User',
  company_name: null,
  is_active: true,
  requires_password_reset: false,
  first_name: 'Jane',
  last_name: 'Smith',
  phone: '555-9999',
  email: 'jane@example.com',
  created_at: '2024-01-01T00:00:00Z',
};

const mockWorkOrder: WorkOrder = {
  id: 'wo-1',
  client_id: 'client-1',
  property_id: null,
  title: 'Plumbing Fix',
  description: null,
  status: 'completed',
  quoted_amount: null,
  wo_number: 'WO-2024-0002',
  urgency: null,
  category: 'plumbing',
  property_address: '456 Oak Ave, Rome, GA',
  inspection_notes: null,
  accepted_at: null,
  completed_at: '2024-01-10T00:00:00Z',
  total_billable_minutes: 120,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-10T00:00:00Z',
};

const mockBill: Bill = {
  id: 'bill-1',
  work_order_id: 'wo-1',
  client_id: 'client-1',
  receipt_number: 'RCT-2024-0001',
  materials_cost: 200,
  materials_paid_by: 'company',
  client_materials_cost: 0,
  labor_cost: 300,
  total_billed: 300,
  amount_paid: 300,
  balance_remaining: 0,
  stripe_payment_intent_id: null,
  paid_at: null,
  created_at: '2024-01-10T00:00:00Z',
};

describe('BillDocument', () => {
  it('renders receipt number', () => {
    render(<BillDocument bill={mockBill} workOrder={mockWorkOrder} client={mockClient} />);
    expect(screen.getByText(/RCT-2024-0001/)).toBeTruthy();
  });

  it('renders client name', () => {
    render(<BillDocument bill={mockBill} workOrder={mockWorkOrder} client={mockClient} />);
    expect(screen.getByText('Jane Smith')).toBeTruthy();
  });

  it('renders work order reference', () => {
    render(<BillDocument bill={mockBill} workOrder={mockWorkOrder} client={mockClient} />);
    expect(screen.getByText(/WO-2024-0002/)).toBeTruthy();
  });

  it('renders property address', () => {
    render(<BillDocument bill={mockBill} workOrder={mockWorkOrder} client={mockClient} />);
    expect(screen.getByText(/456 Oak Ave/)).toBeTruthy();
  });

  it('renders total billed amount', () => {
    render(<BillDocument bill={mockBill} workOrder={mockWorkOrder} client={mockClient} />);
    // Multiple $300.00 may appear (total billed + amount paid), use getAllByText
    expect(screen.getAllByText('$300.00').length).toBeGreaterThan(0);
  });

  it('shows PAID IN FULL when balance_remaining is 0', () => {
    render(<BillDocument bill={mockBill} workOrder={mockWorkOrder} client={mockClient} />);
    expect(screen.getByText('PAID IN FULL')).toBeTruthy();
  });

  it('shows balance amount when not paid in full', () => {
    const unpaidBill = { ...mockBill, amount_paid: 100, balance_remaining: 200 };
    render(<BillDocument bill={unpaidBill} workOrder={mockWorkOrder} client={mockClient} />);
    expect(screen.getAllByText('$200.00').length).toBeGreaterThan(0);
    expect(screen.queryByText('PAID IN FULL')).toBeNull();
  });

  it('renders PrintButton', () => {
    render(<BillDocument bill={mockBill} workOrder={mockWorkOrder} client={mockClient} />);
    expect(screen.getByTestId('print-button')).toBeTruthy();
  });

  it('has print-section class', () => {
    const { container } = render(<BillDocument bill={mockBill} workOrder={mockWorkOrder} client={mockClient} />);
    expect(container.querySelector('.print-section')).toBeTruthy();
  });

  it('falls back to username when no first/last name', () => {
    const clientNoName = { ...mockClient, first_name: null, last_name: null };
    render(<BillDocument bill={mockBill} workOrder={mockWorkOrder} client={clientNoName} />);
    expect(screen.getByText('jdoe')).toBeTruthy();
  });
});
