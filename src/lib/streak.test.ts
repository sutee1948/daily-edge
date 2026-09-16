import { describe, it, expect } from 'vitest';
import { bumpStreak, initialStreak, nextUnseenMilestone, MONTHLY_FREEZES } from '@/lib/streak';

describe('bumpStreak', () => {
  it('starts a fresh streak at 1 on the first study day', () => {
    const s = bumpStreak(initialStreak(), '2026-01-01');
    expect(s.current).toBe(1);
    expect(s.best).toBe(1);
    expect(s.lastStudyDate).toBe('2026-01-01');
  });

  it('does not double-count the same day', () => {
    let s = bumpStreak(initialStreak(), '2026-01-01');
    s = bumpStreak(s, '2026-01-01');
    expect(s.current).toBe(1);
  });

  it('increments on a consecutive day (gap of 1)', () => {
    let s = bumpStreak(initialStreak(), '2026-01-01');
    s = bumpStreak(s, '2026-01-02');
    expect(s.current).toBe(2);
    expect(s.best).toBe(2);
  });

  it('consumes a freeze on a 1-day gap (gap of 2) instead of resetting', () => {
    let s = bumpStreak(initialStreak(), '2026-01-01');
    s = bumpStreak(s, '2026-01-02'); // current=2
    s = bumpStreak(s, '2026-01-04'); // skipped 01-03, gap=2 from last study date
    expect(s.current).toBe(3);
    expect(s.freezesLeft).toBe(MONTHLY_FREEZES - 1);
  });

  it('resets to 1 when the gap is too large even with freezes available', () => {
    let s = bumpStreak(initialStreak(), '2026-01-01');
    s = bumpStreak(s, '2026-01-08'); // 7-day gap, way past what a single freeze covers
    expect(s.current).toBe(1);
    expect(s.freezesLeft).toBe(MONTHLY_FREEZES); // freeze ไม่ถูกใช้ เพราะ gap ใหญ่เกินจะช่วย
  });

  it('resets to 1 when out of freezes even on a 1-day-gap skip', () => {
    let s = { ...initialStreak(), freezesLeft: 0 };
    s = bumpStreak(s, '2026-01-01');
    s = bumpStreak(s, '2026-01-03'); // gap=2, no freeze left
    expect(s.current).toBe(1);
  });

  it('best never decreases even after a reset', () => {
    let s = bumpStreak(initialStreak(), '2026-01-01');
    s = bumpStreak(s, '2026-01-02');
    s = bumpStreak(s, '2026-01-03'); // best=3
    s = bumpStreak(s, '2026-02-01'); // big gap, reset current to 1
    expect(s.current).toBe(1);
    expect(s.best).toBe(3);
  });
});

describe('nextUnseenMilestone', () => {
  it('returns null below the first milestone', () => {
    const s = { ...initialStreak(), current: 5 };
    expect(nextUnseenMilestone(s)).toBeNull();
  });

  it('returns 7 exactly at day 7', () => {
    const s = { ...initialStreak(), current: 7 };
    expect(nextUnseenMilestone(s)).toBe(7);
  });

  it('does not re-announce a milestone already acknowledged', () => {
    const s = { ...initialStreak(), current: 7, milestonesSeen: [7] };
    expect(nextUnseenMilestone(s)).toBeNull();
  });

  it('reports the smallest unseen milestone when current has passed several', () => {
    const s = { ...initialStreak(), current: 40, milestonesSeen: [7] };
    expect(nextUnseenMilestone(s)).toBe(30);
  });
});
