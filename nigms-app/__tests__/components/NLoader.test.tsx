// Unit tests for NLoader component
// @vitest-environment jsdom

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import NLoader from '@/components/NLoader';

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt, width, height, ...props }: { src: string; alt: string; width: number; height: number; [key: string]: unknown }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} width={width} height={height} data-testid="nloader-img" {...props} />;
  },
}));

describe('NLoader', () => {
  it('renders the transition animation SVG', () => {
    render(<NLoader />);
    const img = screen.getByTestId('nloader-img');
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toContain('Logo-TransitionAnimation.svg');
  });

  it('renders with correct size for sm', () => {
    render(<NLoader size="sm" />);
    const img = screen.getByTestId('nloader-img');
    expect(img.getAttribute('width')).toBe('24');
    expect(img.getAttribute('height')).toBe('24');
  });

  it('renders with correct size for md (default)', () => {
    render(<NLoader />);
    const img = screen.getByTestId('nloader-img');
    expect(img.getAttribute('width')).toBe('40');
    expect(img.getAttribute('height')).toBe('40');
  });

  it('renders with correct size for lg', () => {
    render(<NLoader size="lg" />);
    const img = screen.getByTestId('nloader-img');
    expect(img.getAttribute('width')).toBe('64');
    expect(img.getAttribute('height')).toBe('64');
  });

  it('has proper accessibility attributes', () => {
    render(<NLoader />);
    const loader = screen.getByRole('status');
    expect(loader).toBeTruthy();
    expect(loader.getAttribute('aria-label')).toBe('Loading…');
  });
});
