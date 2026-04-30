// Unit tests for OnboardingCard component
// Validates: Requirements 1.11
// @vitest-environment jsdom

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import OnboardingCard from '@/components/OnboardingCard';

describe('OnboardingCard', () => {
  it('renders children', () => {
    render(
      <OnboardingCard>
        <div data-testid="test-child">Test Content</div>
      </OnboardingCard>
    );
    
    const child = screen.getByTestId('test-child');
    expect(child).toBeTruthy();
    expect(child.textContent).toBe('Test Content');
  });

  it('applies correct max-width class for sm', () => {
    const { container } = render(
      <OnboardingCard maxWidth="sm">
        <div>Content</div>
      </OnboardingCard>
    );
    
    const card = container.querySelector('.max-w-md');
    expect(card).toBeTruthy();
  });

  it('applies correct max-width class for md (default)', () => {
    const { container } = render(
      <OnboardingCard>
        <div>Content</div>
      </OnboardingCard>
    );
    
    const card = container.querySelector('.max-w-xl');
    expect(card).toBeTruthy();
  });

  it('applies correct max-width class for lg', () => {
    const { container } = render(
      <OnboardingCard maxWidth="lg">
        <div>Content</div>
      </OnboardingCard>
    );
    
    const card = container.querySelector('.max-w-2xl');
    expect(card).toBeTruthy();
  });

  it('applies white background and correct text color', () => {
    const { container } = render(
      <OnboardingCard>
        <div>Content</div>
      </OnboardingCard>
    );
    
    const card = container.querySelector('.bg-white') as HTMLElement;
    expect(card).toBeTruthy();
    // Browsers convert hex to rgb format
    expect(card.style.backgroundColor).toBe('rgb(255, 255, 255)');
    expect(card.style.color).toBe('rgb(26, 25, 23)');
  });

  it('applies rounded corners and shadow', () => {
    const { container } = render(
      <OnboardingCard>
        <div>Content</div>
      </OnboardingCard>
    );
    
    const card = container.querySelector('.rounded-lg.shadow-lg');
    expect(card).toBeTruthy();
  });

  it('centers content on screen', () => {
    const { container } = render(
      <OnboardingCard>
        <div>Content</div>
      </OnboardingCard>
    );
    
    const wrapper = container.querySelector('.min-h-screen.flex.items-center.justify-center');
    expect(wrapper).toBeTruthy();
  });
});
