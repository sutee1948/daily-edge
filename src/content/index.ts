import type { Lesson, LessonSource } from '@/types/content';
import { resolveLesson } from '@/lib/readingTime';

import { a01 } from './a-china/a01';
import { a05 } from './a-china/a05';
import { b01 } from './b-read-people/b01';
import { b03 } from './b-read-people/b03';
import { c01 } from './c-people-mgmt/c01';
import { c02 } from './c-people-mgmt/c02';
import { d01 } from './d-relationships/d01';
import { d05 } from './d-relationships/d05';
import { e01 } from './e-brain/e01';
import { e02 } from './e-brain/e02';
import { f01 } from './f-self-dev/f01';
import { f02 } from './f-self-dev/f02';
import { g01 } from './g-dev-career/g01';
import { g04 } from './g-dev-career/g04';

// รวมเนื้อหาทั้งหมด — เพิ่มบทใหม่ที่นี่เมื่อเขียนเสร็จ (Phase 6+)
const ALL_SOURCES: LessonSource[] = [a01, a05, b01, b03, c01, c02, d01, d05, e01, e02, f01, f02, g01, g04];

export const ALL_LESSONS: Lesson[] = ALL_SOURCES.map(resolveLesson);

export const LESSON_MAP: Record<string, Lesson> = Object.fromEntries(
  ALL_LESSONS.map((lesson) => [lesson.id, lesson]),
);

export function getLesson(id: string): Lesson | undefined {
  return LESSON_MAP[id];
}
