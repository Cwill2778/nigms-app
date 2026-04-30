// Unit tests for EstimateDocument component
// Validates: Requirements 3.7
// @vitest-environment jsdom

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import EstimateDocument from '@/components/EstimateDocument';
import type { Estimate, WorkOrder, UserProfile } from '@/lib/types';

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
  first_name: 'John',
  last_name: 'Doe',
  phone: '555-1234',
  email: 'john@example.com',
  created_at: '2024-01-01T00:00:00Z',
};

const mockWorkOrder: WorkOrder = {
  id: 'wo-1',
  client_id: 'client-1',
  property_id: null,
  title: 'Roof Repair',
  description: 'Fix the roof',
  status: 'accepted',
  quoted_amount: 1500,
  wo_number: 'WO-2024-0001',
  urgency: 'high',
  category: 'roof repair',
  property_address: '123 Main St, Rome, GA',
  inspection_notes: null,
  accepted_at: '2024-01-02T00:00:00Z',
  completed_at: null,
  total_billable_minutes: 0,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockEstimate: Estimate = {
  id: 'est-1',
  work_order_id: 'wo-1',
  client_id: 'client-1',
  estimate_number: 'EST-001-0001',
  line_items: [
    { description: 'Labor', quantity: 8, unit_price: 75, total: 600 },
    { description: 'Materials', quantity: 1, unit_price: 400, total: 400 },
  ],
  total_amount: 1000,
  notes: 'Includes cleanup',
  approved_at: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('EstimateDocument', () => {
  it('renders the estimate number', () => {
    render(<EstimateDocument estimate={mockEstimate} workOrder={mockWorkOrder} client={mockClient} />);
    expect(screen.getByText('#EST-001-0001')).toBeTruthy();
  });

  it('renders client name', () => {
    render(<EstimateDocument estimate={mockEstimate} workOrder={mockWorkOrder} client={mockClient} />);
    expect(screen.getByText('John Doe')).toBeTruthy();
  });

  it('renders client email and phone', () => {
    render(<EstimateDocument estimate={mockEstimate} workOrder={mockWorkOrder} client={mockClient} />);
    expect(screen.getByText('john@example.com')).toBeTruthy();
    expect(screen.getByText('555-1234')).toBeTruthy();
  });

  it('renders work order reference', () => {
    render(<EstimateDocument estimate={mockEstimate} workOrder={mockWorkOrder} client={mockClient} />);
    expect(screen.getByText(/WO-2024-0001/)).toBeTruthy();
  });

  it('renders property address', () => {
    render(<EstimateDocument estimate={mockEstimate} workOrder={mockWorkOrder} client={mockClient} />);
    expect(screen.getByText(/123 Main St/)).toBeTruthy();
  });

  it('renders all line items', () => {
    render(<EstimateDocument estimate={mockEstimate} workOrder={mockWorkOrder} client={mockClient} />);
    expect(screen.getByText('Labor')).toBeTruthy();
    expect(screen.getByText('Materials')).toBeTruthy();
  });

  it('renders total amount', () => {
    render(<EstimateDocument estimate={mockEstimate} workOrder={mockWorkOrder} client={mockClient} />);
    expect(screen.getByText('$1000.00')).toBeTruthy();
  });

  it('renders notes when present', () => {
    render(<EstimateDocument estimate={mockEstimate} workOrder={mockWorkOrder} client={mockClient} />);
    expect(screen.getByText(/Includes cleanup/)).toBeTruthy();
  });

  it('renders PrintButton', () => {
    render(<EstimateDocument estimate={mockEstimate} workOrder={mockWorkOrder} client={mockClient} />);
    expect(screen.getByTestId('print-button')).toBeTruthy();
  });

  it('falls back to username when no first/last name', () => {
    const clientNoName = { ...mockClient, first_name: null, last_name: null };
    render(<EstimateDocument estimate={mockEstimate} workOrder={mockWorkOrder} client={clientNoName} />);
    expect(screen.getByText('jdoe')).toBeTruthy();
  });

  it('has print-section class for print CSS', () => {
    const { container } = render(<EstimateDocument estimate={mockEstimate} workOrder={mockWorkOrder} client={mockClient} />);
    expect(container.querySelector('.print-section')).toBeTruthy();
  });
});
