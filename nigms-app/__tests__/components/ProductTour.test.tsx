// Unit tests for ProductTour component
// Validates: Requirements 3.15
// @vitest-environment jsdom

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProductTour from '@/components/ProductTour';

const mockSteps = [
  { title: 'Step One', description: 'First step description' },
  { title: 'Step Two', description: 'Second step description' },
  { title: 'Step Three', description: 'Third step description' },
];

describe('ProductTour', () => {
  it('renders the first step on mount', () => {
    render(<ProductTour steps={mockSteps} onComplete={() => {}} />);
    expect(screen.getByText('Step One')).toBeTruthy();
    expect(screen.getByText('First step description')).toBeTruthy();
  });

  it('shows step indicator text', () => {
    render(<ProductTour steps={mockSteps} onComplete={() => {}} />);
    expect(screen.getByText('Step 1 of 3')).toBeTruthy();
  });

  it('shows Next button on non-last steps', () => {
    render(<ProductTour steps={mockSteps} onComplete={() => {}} />);
    expect(screen.getByText('Next')).toBeTruthy();
  });

  it('shows Done button on last step', () => {
    render(<ProductTour steps={[mockSteps[0]]} onComplete={() => {}} />);
    expect(screen.getByText('Done')).toBeTruthy();
  });

  it('advances to next step when Next is clicked', () => {
    render(<ProductTour steps={mockSteps} onComplete={() => {}} />);
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText('Step Two')).toBeTruthy();
    expect(screen.getByText('Step 2 of 3')).toBeTruthy();
  });

  it('advances through all steps', () => {
    render(<ProductTour steps={mockSteps} onComplete={() => {}} />);
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText('Step Three')).toBeTruthy();
    expect(screen.getByText('Step 3 of 3')).toBeTruthy();
  });

  it('calls onComplete when Done is clicked on last step', () => {
    const onComplete = vi.fn();
    render(<ProductTour steps={[mockSteps[0]]} onComplete={onComplete} />);
    fireEvent.click(screen.getByText('Done'));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('calls onComplete when Next is clicked on last step', () => {
    const onComplete = vi.fn();
    render(<ProductTour steps={mockSteps} onComplete={onComplete} />);
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Done'));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('calls onComplete when Skip is clicked', () => {
    const onComplete = vi.fn();
    render(<ProductTour steps={mockSteps} onComplete={onComplete} />);
    fireEvent.click(screen.getByText('Skip'));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('renders backdrop overlay', () => {
    const { container } = render(<ProductTour steps={mockSteps} onComplete={() => {}} />);
    // Backdrop is the first fixed div with black background
    const divs = container.querySelectorAll('div[style]');
    const backdrop = Array.from(divs).find((d) =>
      (d as HTMLElement).style.backgroundColor?.includes('rgba(0, 0, 0')
    );
    expect(backdrop).toBeTruthy();
  });
});
