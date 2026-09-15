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

/** บทที่เกี่ยวข้อง — ใช้ relatedIds ก่อน แล้วเติมด้วยบทอื่นที่มีอยู่จริงถ้าไม่ครบ 3
 *  (อัลกอริทึมคะแนนเต็มรูปแบบตาม PLAN.md ข้อ 6 จะสร้างใน Phase 2) */
export function getRelatedLessons(lessonId: string, count = 3): Lesson[] {
  const lesson = getLesson(lessonId);
  if (!lesson) return [];

  const related: Lesson[] = [];
  const seen = new Set<string>([lessonId]);

  for (const id of lesson.relatedIds) {
    const found = LESSON_MAP[id];
    if (found && !seen.has(id)) {
      related.push(found);
      seen.add(id);
    }
  }

  if (related.length < count) {
    for (const other of ALL_LESSONS) {
      if (related.length >= count) break;
      if (seen.has(other.id)) continue;
      related.push(other);
      seen.add(other.id);
    }
  }

  return related.slice(0, count);
}
