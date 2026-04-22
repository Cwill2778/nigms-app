// @vitest-environment jsdom
// Feature: industrial-framework-layout, Property 1: SteelFrameContainer always applies border and inset

import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { render } from '@testing-library/react';
import React from 'react';
import SteelFrameContainer from '../components/SteelFrameContainer';

// Validates: Requirements 2.1, 2.2

describe('SteelFrameContainer border and inset property', () => {
  it('always applies border-2, border-[#4A4A4A], and m-4 regardless of children', () => {
    fc.assert(
      fc.property(fc.string(), (childText) => {
        const { container } = render(
          React.createElement(SteelFrameContainer, null, childText)
        );
        const outer = container.firstElementChild as HTMLElement;
        const classes = outer.className;

        return (
          classes.includes('border-2') &&
          classes.includes('border-[#4A4A4A]') &&
          classes.includes('m-4')
        );
      }),
      { numRuns: 100 }
    );
  });
});
