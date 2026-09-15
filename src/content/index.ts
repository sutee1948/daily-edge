import type { Lesson, LessonSource } from '@/types/content';
import { resolveLesson } from '@/lib/readingTime';

import { a01 } from './a-china/a01';
import { c01 } from './c-people-mgmt/c01';
import { e01 } from './e-brain/e01';

// รวมเนื้อหาทั้งหมด — เพิ่มบทใหม่ที่นี่เมื่อเขียนเสร็จ (Phase 3+)
const ALL_SOURCES: LessonSource[] = [a01, c01, e01];

export const ALL_LESSONS: Lesson[] = ALL_SOURCES.map(resolveLesson);

export const LESSON_MAP: Record<string, Lesson> = Object.fromEntries(
  ALL_LESSONS.map((lesson) => [lesson.id, lesson]),
);

export function getLesson(id: string): Lesson | undefined {
  return LESSON_MAP[id];
}
