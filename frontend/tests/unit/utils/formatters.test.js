import { describe, expect, it } from 'vitest';
import { formatCurrency, formatDate, formatNumber, formatQuantityChange } from '../../../src/utils/formatters.js';

describe('formatters', () => {
  it('formatDate returns "-" for empty values and a readable date otherwise', () => {
    expect(formatDate(null)).toBe('-');
    expect(formatDate(undefined)).toBe('-');
    expect(formatDate('2026-10-02T10:00:00.000Z')).toMatch(/2026/);
  });

  it('formatCurrency formats with the configured currency and treats null as 0', () => {
    expect(formatCurrency(1234.5)).toMatch(/1,234\.50/);
    expect(formatCurrency(1234.5)).toMatch(/\$/);
    expect(formatCurrency(null)).toBe(formatCurrency(0));
  });

  it('formatNumber adds grouping and treats null as 0', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
    expect(formatNumber(undefined)).toBe('0');
  });

  it('formatQuantityChange prefixes positive values with a plus sign', () => {
    expect(formatQuantityChange(5)).toBe('+5');
    expect(formatQuantityChange(-3)).toBe('-3');
    expect(formatQuantityChange(0)).toBe('0');
  });
});
