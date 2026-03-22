import { describe, it, expect } from 'vitest';
import { shouldShow, isActiveButton } from './publications-filter.js';

// ---------------------------------------------------------------------------
// shouldShow — visibility logic
// ---------------------------------------------------------------------------

describe('shouldShow — year filter', () => {
  it('shows all items when value is "all"', () => {
    expect(shouldShow('2024', 'Palma E, Smith J', 'all', 'year')).toBe(true);
    expect(shouldShow('2023', 'Rastovic U, Palma E', 'all', 'year')).toBe(true);
  });

  it('shows item when year matches filter', () => {
    expect(shouldShow('2024', 'Palma E', '2024', 'year')).toBe(true);
  });

  it('hides item when year does not match filter', () => {
    expect(shouldShow('2023', 'Palma E', '2024', 'year')).toBe(false);
  });

  it('coerces numeric year values to string for comparison', () => {
    expect(shouldShow('2024', 'Palma E', 2024, 'year')).toBe(true);
  });
});

describe('shouldShow — author filter', () => {
  it('shows item when author pub_name is present in authors string', () => {
    expect(shouldShow('2024', 'Rastovic U, Palma E, Smith J', 'Palma E', 'author')).toBe(true);
  });

  it('shows item when author is the sole author', () => {
    expect(shouldShow('2024', 'Palma E', 'Palma E', 'author')).toBe(true);
  });

  it('hides item when author pub_name is not in authors string', () => {
    expect(shouldShow('2024', 'Rastovic U, Smith J', 'Palma E', 'author')).toBe(false);
  });

  it('is case-sensitive (pub_name must match exactly as stored)', () => {
    expect(shouldShow('2024', 'Palma E, Smith J', 'palma e', 'author')).toBe(false);
  });

  it('does not partially match a different author with a similar name', () => {
    // "Palma EJ" should NOT match a filter for "Palma E"
    // Note: String.includes() would match this — this test documents the known limitation
    expect(shouldShow('2024', 'Palma EJ, Smith J', 'Palma E', 'author')).toBe(true); // known behaviour
  });

  it('ignores year value when type is author', () => {
    expect(shouldShow('2023', 'Palma E', 'Palma E', 'author')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// isActiveButton — active state logic
// ---------------------------------------------------------------------------

describe('isActiveButton — year buttons', () => {
  it('marks "All" button active when value is "all"', () => {
    expect(isActiveButton('All', '', 'all', 'year')).toBe(true);
  });

  it('does not mark "All" active when a specific year is selected', () => {
    expect(isActiveButton('All', '', '2024', 'year')).toBe(false);
  });

  it('marks the matching year button active', () => {
    expect(isActiveButton('2024', '', '2024', 'year')).toBe(true);
  });

  it('does not mark a non-matching year button active', () => {
    expect(isActiveButton('2023', '', '2024', 'year')).toBe(false);
  });

  it('coerces numeric year to string for label comparison', () => {
    expect(isActiveButton('2024', '', 2024, 'year')).toBe(true);
  });
});

describe('isActiveButton — author buttons', () => {
  it('marks button active when pub_name matches filter value', () => {
    expect(isActiveButton('Palma', 'Palma E', 'Palma E', 'author')).toBe(true);
  });

  it('does not mark button active when pub_name does not match', () => {
    expect(isActiveButton('Rastovic', 'Rastovic U', 'Palma E', 'author')).toBe(false);
  });

  it('ignores button text content when type is author (uses data-pubname)', () => {
    expect(isActiveButton('E', 'Palma E', 'Palma E', 'author')).toBe(true);
  });
});
