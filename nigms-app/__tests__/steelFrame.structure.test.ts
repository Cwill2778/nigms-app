// @vitest-environment jsdom
// Feature: industrial-framework-layout, Task 2.3: SteelFrameContainer DOM structure tests
/* eslint-disable react/no-children-prop */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import SteelFrameContainer from '../components/SteelFrameContainer';

describe('SteelFrameContainer structure', () => {
  it('renders children inside the container', () => {
    const { getByText } = render(
      React.createElement(SteelFrameContainer, { children: 'Hello World' })
    );
    expect(getByText('Hello World')).toBeTruthy();
  });

  it('outer div has required layout and border classes', () => {
    const { container } = render(
      React.createElement(SteelFrameContainer, { children: 'content' })
    );
    const outer = container.firstElementChild as HTMLElement;
    const classes = outer.className;

    expect(classes).toContain('m-4');
    expect(classes).toContain('border-2');
    expect(classes).toContain('border-[#4A4A4A]');
    expect(classes).toContain('flex');
    expect(classes).toContain('flex-col');
    expect(classes).toContain('min-h-[calc(100vh-2rem)]');
  });

  it('does NOT have overflow-hidden or overflow-clip', () => {
    const { container } = render(
      React.createElement(SteelFrameContainer, { children: 'content' })
    );
    const outer = container.firstElementChild as HTMLElement;
    const classes = outer.className;

    expect(classes).not.toContain('overflow-hidden');
    expect(classes).not.toContain('overflow-clip');
  });

  it('merges optional className prop into the outer div', () => {
    const { container } = render(
      React.createElement(SteelFrameContainer, { className: 'custom-class', children: 'content' })
    );
    const outer = container.firstElementChild as HTMLElement;

    expect(outer.className).toContain('custom-class');
    expect(outer.className).toContain('m-4'); // base classes still present
  });
});
