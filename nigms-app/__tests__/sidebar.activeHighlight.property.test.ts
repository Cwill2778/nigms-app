// @vitest-environment jsdom
// Feature: industrial-framework-layout, Property 4: Active item highlight is exclusive to matching route

import { describe, it, vi } from 'vitest';
import * as fc from 'fast-check';
import { render, cleanup } from '@testing-library/react';
import React from 'react';
import IndustrialSidebar from '../components/IndustrialSidebar';

// Validates: Requirements 3.6

// Module-level variable read by the hoisted mock
let currentPathname = '/';

vi.mock('next/navigation', () => ({
  usePathname: () => currentPathname,
}));

describe('IndustrialSidebar active highlight exclusive to matching route', () => {
  it('only items whose href matches the pathname receive border-l-4', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            href: fc.webUrl(),
            label: fc.string({ minLength: 1 }),
          }),
          { minLength: 1 }
        ),
        fc.string({ minLength: 1 }),
        (rawItems, pathname) => {
          // Deduplicate by href to avoid ambiguous active state
          const seen = new Set<string>();
          const items = rawItems
            .filter((item) => {
              if (seen.has(item.href)) return false;
              seen.add(item.href);
              return true;
            })
            .map((item) => ({ ...item, icon: null }));

          currentPathname = pathname;

          const { container } = render(
            React.createElement(IndustrialSidebar, { items })
          );

          const links = container.querySelectorAll('a');

          let allCorrect = true;
          links.forEach((link) => {
            const href = link.getAttribute('href') ?? '';
            const hasBorderL4 = link.className.includes('border-l-4');
            if (href === pathname) {
              if (!hasBorderL4) allCorrect = false;
            } else {
              if (hasBorderL4) allCorrect = false;
            }
          });

          cleanup();
          return allCorrect;
        }
      ),
      { numRuns: 100 }
    );
  });
});
