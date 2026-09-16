import { describe, it, expect } from 'vitest';
import { toISO, diffDaysISO, shiftISO } from '@/lib/date';

describe('date utils', () => {
  it('toISO formats a Date as YYYY-MM-DD with zero-padding', () => {
    expect(toISO(new Date(2026, 0, 5))).toBe('2026-01-05'); // เดือน 0-indexed ใน JS Date
    expect(toISO(new Date(2026, 11, 31))).toBe('2026-12-31');
  });

  it('diffDaysISO computes b - a in whole days', () => {
    expect(diffDaysISO('2026-01-01', '2026-01-01')).toBe(0);
    expect(diffDaysISO('2026-01-01', '2026-01-02')).toBe(1);
    expect(diffDaysISO('2026-01-01', '2026-02-01')).toBe(31);
    expect(diffDaysISO('2026-01-05', '2026-01-01')).toBe(-4); // ย้อนหลังได้ ค่าติดลบ
  });

  it('shiftISO moves forward and backward correctly, including across month/year boundaries', () => {
    expect(shiftISO('2026-01-01', 1)).toBe('2026-01-02');
    expect(shiftISO('2026-01-01', -1)).toBe('2025-12-31');
    expect(shiftISO('2026-01-31', 1)).toBe('2026-02-01');
    expect(shiftISO('2026-12-31', 1)).toBe('2027-01-01');
    expect(shiftISO('2026-03-01', 35)).toBe('2026-04-05');
  });

  it('shiftISO and diffDaysISO are inverse operations', () => {
    const start = '2026-06-15';
    for (const delta of [1, 3, 7, 16, 35, -10]) {
      expect(diffDaysISO(start, shiftISO(start, delta))).toBe(delta);
    }
  });
});
