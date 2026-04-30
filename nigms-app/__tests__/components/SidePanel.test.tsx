// Unit tests for SidePanel component
// Validates: Requirements 3.1
// @vitest-environment jsdom

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SidePanel from '@/components/SidePanel';

// Mock lucide-react
vi.mock('lucide-react', () => ({
  X: ({ size }: { size?: number }) => <span data-testid="x-icon" data-size={size}>✕</span>,
}));

describe('SidePanel', () => {
  it('renders title and children when open', () => {
    render(
      <SidePanel open={true} onClose={() => {}} title="Test Panel">
        <div data-testid="panel-content">Panel content</div>
      </SidePanel>
    );
    expect(screen.getByText('Test Panel')).toBeTruthy();
    expect(screen.getByTestId('panel-content')).toBeTruthy();
  });

  it('renders backdrop when open', () => {
    const { container } = render(
      <SidePanel open={true} onClose={() => {}} title="Test Panel">
        <div>content</div>
      </SidePanel>
    );
    const backdrop = container.querySelector('[aria-hidden="true"]');
    expect(backdrop).toBeTruthy();
  });

  it('does not render backdrop when closed', () => {
    const { container } = render(
      <SidePanel open={false} onClose={() => {}} title="Test Panel">
        <div>content</div>
      </SidePanel>
    );
    const backdrop = container.querySelector('[aria-hidden="true"]');
    expect(backdrop).toBeNull();
  });

  it('still renders panel element when closed (translate-x-full)', () => {
    const { container } = render(
      <SidePanel open={false} onClose={() => {}} title="Test Panel">
        <div>content</div>
      </SidePanel>
    );
    // Panel div is always in DOM but translated off-screen
    const panel = container.querySelector('.translate-x-full');
    expect(panel).toBeTruthy();
  });

  it('calls onClose when Escape key is pressed', () => {
    const onClose = vi.fn();
    render(
      <SidePanel open={true} onClose={onClose} title="Test Panel">
        <div>content</div>
      </SidePanel>
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(
      <SidePanel open={true} onClose={onClose} title="Test Panel">
        <div>content</div>
      </SidePanel>
    );
    const backdrop = container.querySelector('[aria-hidden="true"]') as HTMLElement;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <SidePanel open={true} onClose={onClose} title="Test Panel">
        <div>content</div>
      </SidePanel>
    );
    const closeBtn = screen.getByLabelText('Close panel');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders children in body area', () => {
    render(
      <SidePanel open={true} onClose={() => {}} title="My Panel">
        <p data-testid="child-node">Hello World</p>
      </SidePanel>
    );
    expect(screen.getByTestId('child-node').textContent).toBe('Hello World');
  });
});
