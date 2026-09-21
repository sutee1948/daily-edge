import { describe, expect, it } from 'vitest';
import type { LessonMeta } from '@/types/content';
import type { LessonProgress, QuizAttempt } from '@/types/user';
import {
  buildWeeklyRecap,
  isRecapEmpty,
  recapHeadline,
  recapTeaserTarget,
  shiftWeek,
  weekRangeOf,
} from '@/lib/weeklyRecap';

// 2026-09-21 เป็นวันจันทร์ → สัปดาห์ 21–27 ก.ย.
const WEEK = weekRangeOf('2026-09-23');

function meta(id: string, category: LessonMeta['category']): LessonMeta {
  return {
    id,
    title: `บท ${id}`,
    subtitle: '',
    category,
    format: 'classic',
    difficulty: 1,
    tags: [],
    hook: '',
    relatedIds: [],
    wordCount: 700,
    estimatedMinutes: 8,
  };
}

const METAS: Record<string, LessonMeta> = {
  a01: meta('a01', 'china-strategy'),
  a02: meta('a02', 'china-strategy'),
  b01: meta('b01', 'read-people'),
  e01: meta('e01', 'brain'),
};
const getMeta = (id: string) => METAS[id];

function attempt(date: string, score: number, total = 8, source?: 'main' | 'review'): QuizAttempt {
  return { date, score, total, wrongQIds: [], ...(source ? { source } : {}) };
}

function done(completedAt: string, attempts: QuizAttempt[]): LessonProgress {
  return { status: 'done', completedAt, attempts, bookmarked: false };
}

describe('weekRangeOf', () => {
  it('จันทร์–อาทิตย์ ของวันกลางสัปดาห์', () => {
    expect(weekRangeOf('2026-09-23')).toEqual({ start: '2026-09-21', end: '2026-09-27' });
  });

  it('วันจันทร์คือวันแรก และวันอาทิตย์คือวันสุดท้ายของสัปดาห์เดียวกัน', () => {
    expect(weekRangeOf('2026-09-21').start).toBe('2026-09-21');
    expect(weekRangeOf('2026-09-27')).toEqual({ start: '2026-09-21', end: '2026-09-27' });
  });

  it('ข้ามเดือน/ปีได้ถูกต้อง', () => {
    expect(weekRangeOf('2026-01-01')).toEqual({ start: '2025-12-29', end: '2026-01-04' });
  });

  it('shiftWeek ถอยหนึ่งสัปดาห์', () => {
    expect(shiftWeek(WEEK, -1)).toEqual({ start: '2026-09-14', end: '2026-09-20' });
  });
});

describe('buildWeeklyRecap', () => {
  it('ไม่มีข้อมูล → ว่างเปล่า', () => {
    const recap = buildWeeklyRecap({}, getMeta, WEEK);
    expect(isRecapEmpty(recap)).toBe(true);
    expect(recap.avgPercent).toBeNull();
    expect(recap.activeDays).toBe(0);
  });

  it('นับเฉพาะบทที่จบครั้งแรกในสัปดาห์นี้ และเรียงตามวันที่จบ', () => {
    const lessons = {
      a01: done('2026-09-22', [attempt('2026-09-22', 8)]),
      b01: done('2026-09-21', [attempt('2026-09-21', 6)]),
      e01: done('2026-09-15', [attempt('2026-09-15', 8)]), // สัปดาห์ก่อน
    };
    const recap = buildWeeklyRecap(lessons, getMeta, WEEK);
    expect(recap.completed.map((c) => c.id)).toEqual(['b01', 'a01']);
    expect(recap.activeDays).toBe(2);
    expect(recap.categories).toEqual(['read-people', 'china-strategy']);
  });

  it('คะแนนเฉลี่ยรวมทุกครั้งที่ทำควิซหลัก ไม่รวมควิซทบทวน', () => {
    const lessons = {
      a01: done('2026-09-22', [attempt('2026-09-22', 4), attempt('2026-09-23', 8)]),
      b01: done('2026-09-24', [attempt('2026-09-24', 6), attempt('2026-09-25', 2, 2, 'review')]),
    };
    const recap = buildWeeklyRecap(lessons, getMeta, WEEK);
    expect(recap.quizAttempts).toBe(3);
    expect(recap.reviewAttempts).toBe(1);
    // (50 + 100 + 75) / 3 = 75
    expect(recap.avgPercent).toBe(75);
    expect(recap.completed.find((c) => c.id === 'a01')?.bestPercent).toBe(100);
  });

  it('strongest = คะแนนสูงสุด และ toRevisit = ต่ำสุดที่ต่ำกว่า 80 และไม่ใช่บทเดียวกับ strongest', () => {
    const lessons = {
      a01: done('2026-09-21', [attempt('2026-09-21', 8)]),
      b01: done('2026-09-22', [attempt('2026-09-22', 4)]),
      e01: done('2026-09-23', [attempt('2026-09-23', 5)]),
    };
    const recap = buildWeeklyRecap(lessons, getMeta, WEEK);
    expect(recap.strongest?.id).toBe('a01');
    expect(recap.toRevisit?.id).toBe('b01');
  });

  it('ทุกบทได้คะแนนสูง → ไม่มีบทที่ต้องทบทวน', () => {
    const lessons = {
      a01: done('2026-09-21', [attempt('2026-09-21', 8)]),
      b01: done('2026-09-22', [attempt('2026-09-22', 7)]),
    };
    expect(buildWeeklyRecap(lessons, getMeta, WEEK).toRevisit).toBeUndefined();
  });

  it('ข้ามรหัสบทที่ไม่มีในคลัง (ข้อมูลเก่า) โดยไม่พัง', () => {
    const lessons = { ghost: done('2026-09-22', [attempt('2026-09-22', 8)]) };
    expect(isRecapEmpty(buildWeeklyRecap(lessons, getMeta, WEEK))).toBe(true);
  });
});

describe('recapHeadline', () => {
  const label = (c: string) => `หมวด-${c}`;

  it('สัปดาห์ว่างมีข้อความชวนเริ่ม', () => {
    const recap = buildWeeklyRecap({}, getMeta, WEEK);
    expect(recapHeadline(recap, label)).toContain('เริ่มจากบทเดียว');
  });

  it('สรุปจำนวนบท หมวด คะแนนเฉลี่ย และจำนวนวันที่เรียน', () => {
    const lessons = {
      a01: done('2026-09-21', [attempt('2026-09-21', 8)]),
      b01: done('2026-09-22', [attempt('2026-09-22', 7)]),
    };
    const text = recapHeadline(buildWeeklyRecap(lessons, getMeta, WEEK), label);
    expect(text).toContain('เรียนจบ 2 บท');
    expect(text).toContain('2 หมวด');
    expect(text).toContain('เฉลี่ย 94%');
    expect(text).toContain('2 วัน');
  });
});

describe('recapTeaserTarget', () => {
  const lessons = { a01: done('2026-09-22', [attempt('2026-09-22', 8)]) };

  it('วันอาทิตย์ → ชี้ไปสัปดาห์นี้ (ถ้ามีกิจกรรม)', () => {
    expect(recapTeaserTarget('2026-09-27', lessons, getMeta)).toBe('this');
  });

  it('วันจันทร์ → ชี้ไปสัปดาห์ที่แล้ว (ถ้ามีกิจกรรม)', () => {
    expect(recapTeaserTarget('2026-09-28', lessons, getMeta)).toBe('last');
  });

  it('วันอื่นไม่แสดง', () => {
    expect(recapTeaserTarget('2026-09-24', lessons, getMeta)).toBeNull();
  });

  it('สัปดาห์นั้นไม่มีกิจกรรม → ไม่แสดงแม้เป็นวันอาทิตย์', () => {
    expect(recapTeaserTarget('2026-09-20', lessons, getMeta)).toBeNull();
  });
});
