/**
 * Design-token guardrails: every text colour used on the site's backgrounds
 * must meet WCAG AA (4.5:1), and the smallest type size must stay readable.
 */
import { describe, it, expect } from 'vitest';
import config from '../tailwind.config.js';

const colors = config.theme.extend.colors;

function luminance(hex) {
  const n = hex.replace('#', '');
  const full = n.length === 3 ? n.split('').map(c => c + c).join('') : n;
  const [r, g, b] = [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16) / 255)
    .map(c => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(fg, bg) {
  const [a, b] = [luminance(fg), luminance(bg)];
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

const pairs = [
  ['ink.faint on page bg',   colors.ink.faint,     colors.bg.DEFAULT],
  ['ink.faint on white',     colors.ink.faint,     '#ffffff'],
  ['ink.faint on accent-light', colors.ink.faint,  colors.accent.light],
  ['ink.light on page bg',   colors.ink.light,     colors.bg.DEFAULT],
  ['ink.light on rule',      colors.ink.light,     colors.rule],
  ['accent on page bg',      colors.accent.DEFAULT, colors.bg.DEFAULT],
  ['accent on accent-light', colors.accent.DEFAULT, colors.accent.light],
  ['white on accent',        '#ffffff',            colors.accent.DEFAULT],
  ['white on accent-dark',   '#ffffff',            colors.accent.dark],
];

describe('colour contrast (WCAG AA, 4.5:1)', () => {
  it.each(pairs)('%s', (_, fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('type scale', () => {
  it('smallest size (2xs) is at least 0.72rem (≈11.5px)', () => {
    const size = parseFloat(config.theme.extend.fontSize['2xs'][0]);
    expect(size).toBeGreaterThanOrEqual(0.72);
  });
});
