// Unit tests for PrintButton component
// Validates: Requirements 3.12
// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PrintButton from '@/components/PrintButton';

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Printer: ({ size }: { size?: number }) => <span data-testid="printer-icon" data-size={size}>🖨</span>,
}));

describe('PrintButton', () => {
  beforeEach(() => {
    vi.stubGlobal('print', vi.fn());
  });

  it('renders a button with Print text', () => {
    render(<PrintButton />);
    expect(screen.getByRole('button')).toBeTruthy();
    expect(screen.getByText('Print')).toBeTruthy();
  });

  it('renders the printer icon', () => {
    render(<PrintButton />);
    expect(screen.getByTestId('printer-icon')).toBeTruthy();
  });

  it('calls window.print() when clicked', () => {
    render(<PrintButton />);
    const btn = screen.getByRole('button');
    fireEvent.click(btn);
    expect(window.print).toHaveBeenCalledTimes(1);
  });

  it('has no-print class to hide during printing', () => {
    const { container } = render(<PrintButton />);
    const btn = container.querySelector('button');
    expect(btn?.className).toContain('no-print');
  });
});
