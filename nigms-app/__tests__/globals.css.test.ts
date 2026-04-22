import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// Validates: Requirements 1.1, 1.2

const CSS_PATH = path.resolve(__dirname, '../app/globals.css');

const RADIUS_TOKENS = [
  '--radius',
  '--radius-sm',
  '--radius-md',
  '--radius-lg',
  '--radius-xl',
  '--radius-2xl',
  '--radius-3xl',
  '--radius-full',
];

describe('globals.css border-radius reset', () => {
  let cssContent: string;
  let themeBlock: string;

  beforeAll(() => {
    cssContent = fs.readFileSync(CSS_PATH, 'utf-8');

    // Extract the @theme inline { ... } block
    const themeMatch = cssContent.match(/@theme\s+inline\s*\{([^}]*)\}/s);
    expect(themeMatch, '@theme inline block should exist in globals.css').toBeTruthy();
    themeBlock = themeMatch![1];
  });

  it('contains an @theme inline block', () => {
    expect(cssContent).toMatch(/@theme\s+inline\s*\{/);
  });

  for (const token of RADIUS_TOKENS) {
    it(`sets ${token} to 0 inside @theme inline`, () => {
      // Build a literal regex: match the token name, colon, value 0, semicolon
      // Hyphens are safe in regex outside character classes; no escaping needed
      const pattern = new RegExp(token + '\\s*:\\s*0\\s*;');
      expect(themeBlock).toMatch(pattern);
    });
  }
});
