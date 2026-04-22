// @vitest-environment jsdom
// Feature: industrial-framework-layout, Property 2: SteelFrameContainer never clips overflow

import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { render } from '@testing-library/react';
import React from 'react';
import SteelFrameContainer from '../components/SteelFrameContainer';

// Validates: Requirements 2.5

describe('SteelFrameContainer overflow property', () => {
  it('never contains overflow-hidden or overflow-clip on the outer container regardless of children', () => {
    fc.assert(
      fc.property(fc.string(), (childText) => {
        const { container } = render(
          React.createElement(SteelFrameContainer, null, childText)
        );
        const outer = container.firstElementChild as HTMLElement;
        const classes = outer.className;

        return (
          !classes.includes('overflow-hidden') &&
          !classes.includes('overflow-clip')
        );
      }),
      { numRuns: 100 }
    );
  });
});
