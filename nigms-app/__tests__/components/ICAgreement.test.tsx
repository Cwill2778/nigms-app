// Unit tests for ICAgreement component
// Validates: Requirements 3.9
// @vitest-environment jsdom

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ICAgreement from '@/components/ICAgreement';
import type { WorkOrder, UserProfile, Estimate } from '@/lib/types';

// Mock PrintButton
vi.mock('@/components/PrintButton', () => ({
  default: () => <button data-testid="print-button">Print</button>,
}));

const mockClient: UserProfile = {
  id: 'client-1',
  username: 'bobsmith',
  role: 'client',
  full_name: 'Test User',
  company_name: null,
  is_active: true,
  requires_password_reset: false,
  first_name: 'Bob',
  last_name: 'Smith',
  phone: null,
  email: null,
  created_at: '2024-01-01T00:00:00Z',
};

const mockWorkOrder: WorkOrder = {
  id: 'wo-1',
  client_id: 'client-1',
  property_id: null,
  title: 'Kitchen Remodel',
  description: 'Full kitchen renovation',
  status: 'accepted',
  quoted_amount: 5000,
  wo_number: 'WO-2024-0003',
  urgency: 'medium',
  category: 'interior',
  property_address: '789 Pine Rd, Rome, GA',
  inspection_notes: null,
  accepted_at: '2024-01-05T00:00:00Z',
  completed_at: null,
  total_billable_minutes: 0,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-05T00:00:00Z',
};

const mockEstimate: Estimate = {
  id: 'est-1',
  work_order_id: 'wo-1',
  client_id: 'client-1',
  estimate_number: 'EST-001-0002',
  line_items: [],
  total_amount: 4800,
  notes: null,
  approved_at: null,
  created_at: '2024-01-05T00:00:00Z',
  updated_at: '2024-01-05T00:00:00Z',
};

describe('ICAgreement', () => {
  it('renders the agreement title', () => {
    render(<ICAgreement workOrder={mockWorkOrder} client={mockClient} estimate={mockEstimate} />);
    expect(screen.getByText(/Independent Contractor Agreement/i)).toBeTruthy();
  });

  it('renders client name in parties section', () => {
    render(<ICAgreement workOrder={mockWorkOrder} client={mockClient} estimate={mockEstimate} />);
    expect(screen.getByText('Bob Smith')).toBeTruthy();
  });

  it('renders work order number', () => {
    render(<ICAgreement workOrder={mockWorkOrder} client={mockClient} estimate={mockEstimate} />);
    expect(screen.getAllByText(/WO-2024-0003/).length).toBeGreaterThan(0);
  });

  it('renders property address', () => {
    render(<ICAgreement workOrder={mockWorkOrder} client={mockClient} estimate={mockEstimate} />);
    expect(screen.getByText(/789 Pine Rd/)).toBeTruthy();
  });

  it('renders estimate total when estimate is provided', () => {
    render(<ICAgreement workOrder={mockWorkOrder} client={mockClient} estimate={mockEstimate} />);
    expect(screen.getAllByText(/\$4,800\.00/).length).toBeGreaterThan(0);
  });

  it('renders placeholder when no estimate', () => {
    render(<ICAgreement workOrder={mockWorkOrder} client={mockClient} estimate={null} />);
    expect(screen.getAllByText(/\[Estimate Total\]/).length).toBeGreaterThan(0);
  });

  it('renders all required sections', () => {
    render(<ICAgreement workOrder={mockWorkOrder} client={mockClient} estimate={mockEstimate} />);
    expect(screen.getByText(/1\. Parties/)).toBeTruthy();
    expect(screen.getByText(/2\. Scope of Work/)).toBeTruthy();
    expect(screen.getByText(/3\. Compensation/)).toBeTruthy();
    expect(screen.getByText(/4\. Independent Contractor Status/)).toBeTruthy();
    expect(screen.getByText(/5\. Lien Rights/)).toBeTruthy();
    expect(screen.getByText(/6\. Dispute Resolution/)).toBeTruthy();
    expect(screen.getByText(/7\. Signatures/)).toBeTruthy();
  });

  it('renders PrintButton', () => {
    render(<ICAgreement workOrder={mockWorkOrder} client={mockClient} estimate={mockEstimate} />);
    expect(screen.getByTestId('print-button')).toBeTruthy();
  });

  it('has print-section class', () => {
    const { container } = render(<ICAgreement workOrder={mockWorkOrder} client={mockClient} estimate={mockEstimate} />);
    expect(container.querySelector('.print-section')).toBeTruthy();
  });

  it('falls back to username when no first/last name', () => {
    const clientNoName = { ...mockClient, first_name: null, last_name: null };
    render(<ICAgreement workOrder={mockWorkOrder} client={clientNoName} estimate={null} />);
    expect(screen.getByText('bobsmith')).toBeTruthy();
  });
});
