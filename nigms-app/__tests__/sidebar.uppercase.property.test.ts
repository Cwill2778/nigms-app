// @vitest-environment jsdom
// Feature: industrial-framework-layout, Property 3: Sidebar labels are always uppercase

import { describe, it, vi } from 'vitest';
import * as fc from 'fast-check';
import { render } from '@testing-library/react';
import React from 'react';
import IndustrialSidebar from '../components/IndustrialSidebar';

// Validates: Requirements 3.2

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

describe('IndustrialSidebar label uppercase property', () => {
  it('always renders label span with uppercase class regardless of input string', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1 }), (label) => {
        const { container } = render(
          React.createElement(IndustrialSidebar, {
            items: [{ href: '/test', label, icon: null }],
          })
        );
        const span = container.querySelector('span');
        return span !== null && span.className.includes('uppercase');
      }),
      { numRuns: 100 }
    );
  });
});
