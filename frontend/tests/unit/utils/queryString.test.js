import { describe, expect, it } from 'vitest';
import { buildQueryString, dateInputToIso } from '../../../src/utils/queryString.js';

describe('buildQueryString', () => {
  it('skips empty values and encodes the rest', () => {
    expect(buildQueryString({ search: 'a b', page: 2, empty: '', none: null, missing: undefined, zero: 0 })).toBe(
      '?search=a+b&page=2&zero=0',
    );
  });

  it('returns an empty string when there is nothing to send', () => {
    expect(buildQueryString({ a: '' })).toBe('');
    expect(buildQueryString()).toBe('');
  });
});

describe('dateInputToIso', () => {
  it('returns undefined for empty or invalid input', () => {
    expect(dateInputToIso('')).toBeUndefined();
    expect(dateInputToIso(undefined)).toBeUndefined();
    expect(dateInputToIso('not-a-date')).toBeUndefined();
  });

  it('converts to the start of the local day by default', () => {
    const date = new Date(dateInputToIso('2026-10-15'));
    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2026, 9, 15]);
    expect([date.getHours(), date.getMinutes(), date.getSeconds()]).toEqual([0, 0, 0]);
  });

  it('converts to the end of the local day when requested', () => {
    const date = new Date(dateInputToIso('2026-10-15', { endOfDay: true }));
    expect(date.getDate()).toBe(15);
    expect([date.getHours(), date.getMinutes(), date.getMilliseconds()]).toEqual([23, 59, 999]);
  });
});
