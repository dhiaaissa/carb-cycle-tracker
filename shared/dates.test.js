import { describe, it, expect } from 'vitest';
import { isIsoDate, addDays, diffDays, localIsoDate, dateRange } from './dates.js';

describe('dates', () => {
  it('validates ISO dates strictly', () => {
    expect(isIsoDate('2026-10-04')).toBe(true);
    expect(isIsoDate('2024-02-29')).toBe(true);
    expect(isIsoDate('2026-02-29')).toBe(false);
    expect(isIsoDate('2026-13-01')).toBe(false);
    expect(isIsoDate('2026-1-5')).toBe(false);
    expect(isIsoDate('2026-10-04T00:00')).toBe(false);
    expect(isIsoDate(null)).toBe(false);
  });

  it('adds days across month, year and DST boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-29', 1)).toBe('2026-03-30'); // EU DST switch
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2026-10-04', 0)).toBe('2026-10-04');
  });

  it('diffs days', () => {
    expect(diffDays('2026-01-01', '2026-01-01')).toBe(0);
    expect(diffDays('2026-01-01', '2026-02-26')).toBe(56);
    expect(diffDays('2026-02-01', '2026-01-31')).toBe(-1);
    expect(diffDays('2026-03-28', '2026-03-30')).toBe(2);
  });

  it('uses the local calendar, not UTC', () => {
    // 23:30 local on Oct 4 must stay Oct 4 even if UTC has rolled over
    expect(localIsoDate(new Date(2026, 9, 4, 23, 30))).toBe('2026-10-04');
    expect(localIsoDate(new Date(2026, 0, 1, 0, 5))).toBe('2026-01-01');
  });

  it('builds inclusive ranges', () => {
    expect(dateRange('2026-01-30', '2026-02-02')).toEqual(['2026-01-30', '2026-01-31', '2026-02-01', '2026-02-02']);
    expect(dateRange('2026-01-02', '2026-01-01')).toEqual([]);
  });
});
