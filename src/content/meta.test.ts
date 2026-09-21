import { describe, it, expect } from 'vitest';
import { ALL_LESSON_METAS, getLessonMeta, getCachedLesson, loadLesson, loadAllLessons } from '@/content';
import { ALL_LESSONS_EAGER } from '@/content/testing';
import { toMeta } from '@/lib/readingTime';

describe('generated lesson meta index', () => {
  it('is in sync with the lesson source files (run `npm run gen-content` if this fails)', () => {
    expect(ALL_LESSON_METAS).toEqual(ALL_LESSONS_EAGER.map(toMeta));
  });

  it('has unique ids and looks lessons up by id', () => {
    const ids = ALL_LESSON_METAS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(getLessonMeta(ids[0])?.id).toBe(ids[0]);
    expect(getLessonMeta('zz99-does-not-exist')).toBeUndefined();
  });

  it('carries only light fields (no bodies) so the main bundle stays small', () => {
    for (const meta of ALL_LESSON_METAS) {
      expect(meta).not.toHaveProperty('beats');
      expect(meta).not.toHaveProperty('questions');
      expect(meta).not.toHaveProperty('evidence');
    }
  });
});

describe('lazy lesson loading', () => {
  it('loads the full lesson for an id and matches the eager version', async () => {
    const target = ALL_LESSONS_EAGER[0];
    expect(getCachedLesson(target.id)).toBeUndefined();
    const loaded = await loadLesson(target.id);
    expect(loaded).toEqual(target);
    expect(getCachedLesson(target.id)).toBe(loaded); // โหลดแล้วต้อง cache ไว้ให้ใช้ทันทีรอบถัดไป
  });

  it('returns the same object on repeated loads and resolves undefined for unknown ids', async () => {
    const id = ALL_LESSONS_EAGER[1].id;
    const [a, b] = await Promise.all([loadLesson(id), loadLesson(id)]);
    expect(a).toBe(b);
    expect(await loadLesson('zz99-does-not-exist')).toBeUndefined();
  });

  it('loadAllLessons returns every lesson', async () => {
    const all = await loadAllLessons();
    expect(all).toHaveLength(ALL_LESSON_METAS.length);
  });
});
