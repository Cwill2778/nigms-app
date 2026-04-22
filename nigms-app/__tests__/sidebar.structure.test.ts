// @vitest-environment jsdom
// Feature: industrial-framework-layout — Task 3.3: IndustrialSidebar structure tests

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import IndustrialSidebar from '../components/IndustrialSidebar';

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: React.createElement('span', { 'data-testid': 'icon-dashboard' }) },
  { href: '/work-orders/new', label: 'New Order', icon: React.createElement('span', { 'data-testid': 'icon-orders' }) },
];

describe('IndustrialSidebar structure', () => {
  it('aside has hidden class', () => {
    const { container } = render(React.createElement(IndustrialSidebar, { items: navItems }));
    const aside = container.querySelector('aside');
    expect(aside?.className).toContain('hidden');
  });

  it('aside has md:flex class', () => {
    const { container } = render(React.createElement(IndustrialSidebar, { items: navItems }));
    const aside = container.querySelector('aside');
    expect(aside?.className).toContain('md:flex');
  });

  it('aside has sticky class', () => {
    const { container } = render(React.createElement(IndustrialSidebar, { items: navItems }));
    const aside = container.querySelector('aside');
    expect(aside?.className).toContain('sticky');
  });

  it('renders icon elements alongside label spans', () => {
    const { getByTestId, getAllByRole } = render(React.createElement(IndustrialSidebar, { items: navItems }));
    expect(getByTestId('icon-dashboard')).toBeTruthy();
    expect(getByTestId('icon-orders')).toBeTruthy();
    const spans = getAllByRole('link').flatMap(link => Array.from(link.querySelectorAll('span')));
    expect(spans.length).toBeGreaterThanOrEqual(2);
  });

  it('renders links with correct hrefs', () => {
    const { getAllByRole } = render(React.createElement(IndustrialSidebar, { items: navItems }));
    const links = getAllByRole('link') as HTMLAnchorElement[];
    const hrefs = links.map(l => l.getAttribute('href'));
    expect(hrefs).toContain('/dashboard');
    expect(hrefs).toContain('/work-orders/new');
  });
});
