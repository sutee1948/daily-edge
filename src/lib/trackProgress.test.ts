import { describe, expect, it } from 'vitest';
import type { Track } from '@/types/content';
import type { LessonProgress } from '@/types/user';
import { computeTrackProgress, pickActiveTrack } from '@/lib/trackProgress';

function track(id: string, lessonIds: string[]): Track {
  return { id, title: id, subtitle: '', emoji: '🧪', audience: '', lessonIds };
}

function done(completedAt: string): LessonProgress {
  return { status: 'done', completedAt, attempts: [], bookmarked: false };
}

const reading: LessonProgress = { status: 'reading', attempts: [], bookmarked: false };

describe('computeTrackProgress', () => {
  const t = track('t', ['a', 'b', 'c', 'd']);

  it('ยังไม่เริ่ม: done=0 และบทถัดไปคือบทแรก', () => {
    const p = computeTrackProgress(t, {});
    expect(p).toMatchObject({ done: 0, total: 4, percent: 0, completed: false, nextLessonId: 'a' });
    expect(p.lastCompletedAt).toBeUndefined();
  });

  it('นับเฉพาะสถานะ done ส่วน reading ยังไม่นับ และบทถัดไปคือบทแรกที่ยังไม่จบ', () => {
    const p = computeTrackProgress(t, { a: done('2026-09-01'), b: reading });
    expect(p.done).toBe(1);
    expect(p.percent).toBe(25);
    expect(p.nextLessonId).toBe('b');
  });

  it('บทถัดไปข้ามบทที่จบแล้วซึ่งอยู่ข้างหลัง (เรียนข้ามลำดับได้)', () => {
    const p = computeTrackProgress(t, { a: done('2026-09-01'), c: done('2026-09-02') });
    expect(p.done).toBe(2);
    expect(p.nextLessonId).toBe('b');
    expect(p.lastCompletedAt).toBe('2026-09-02');
  });

  it('จบครบทั้งเส้น: completed=true และไม่มีบทถัดไป', () => {
    const all = { a: done('2026-09-01'), b: done('2026-09-02'), c: done('2026-09-03'), d: done('2026-09-04') };
    const p = computeTrackProgress(t, all);
    expect(p.completed).toBe(true);
    expect(p.percent).toBe(100);
    expect(p.nextLessonId).toBeUndefined();
  });
});

describe('pickActiveTrack', () => {
  const t1 = track('t1', ['a', 'b', 'c']);
  const t2 = track('t2', ['x', 'y', 'z']);

  it('ไม่มีเส้นที่เริ่มแล้ว → undefined', () => {
    expect(pickActiveTrack([t1, t2], {})).toBeUndefined();
  });

  it('ข้ามเส้นที่จบครบแล้ว', () => {
    const lessons = { a: done('2026-09-01'), b: done('2026-09-02'), c: done('2026-09-03') };
    expect(pickActiveTrack([t1, t2], lessons)).toBeUndefined();
  });

  it('เลือกเส้นที่เพิ่งจบบทล่าสุด', () => {
    const lessons = { a: done('2026-09-01'), x: done('2026-09-05') };
    expect(pickActiveTrack([t1, t2], lessons)?.track.id).toBe('t2');
  });

  it('วันเท่ากัน เลือกเส้นที่คืบหน้ามากกว่า แล้วถ้ายังเท่ากันใช้ลำดับในรายการ', () => {
    const more = { a: done('2026-09-05'), b: done('2026-09-05'), x: done('2026-09-05') };
    expect(pickActiveTrack([t1, t2], more)?.track.id).toBe('t1');

    const equal = { a: done('2026-09-05'), x: done('2026-09-05') };
    expect(pickActiveTrack([t1, t2], equal)?.track.id).toBe('t1');
  });
});
