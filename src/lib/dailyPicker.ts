import type { Category, Lesson } from '@/types/content';
import type { UserState } from '@/types/user';
import { ALL_LESSONS } from '@/content';
import { todayISO, shiftISO } from '@/lib/date';

export const MAX_REROLLS_PER_DAY = 2;

const PENALTY_SAME_CATEGORY_YESTERDAY = 50;
const PENALTY_SAME_CATEGORY_2DAYS_AGO = 20;
const PENALTY_SAME_FORMAT_YESTERDAY = 30;
const BONUS_NOT_DONE = 100;
const PENALTY_PER_DIFFICULTY_STEP = 5;

function lessonOnDate(user: UserState, lessons: Lesson[], dateISO: string): Lesson | undefined {
  const entry = user.pickHistory.find((h) => h.date === dateISO);
  return entry ? lessons.find((l) => l.id === entry.lessonId) : undefined;
}

/** ระดับความยากที่ "พอดี" กับความคืบหน้าของผู้ใช้ในหมวดนี้ — ยิ่งเรียนจบในหมวดนี้เยอะ ยิ่งขยับยากขึ้น */
function targetDifficultyFor(category: Category, lessons: Lesson[], user: UserState): 1 | 2 | 3 {
  const doneInCategory = Object.entries(user.lessons).filter(
    ([lessonId, progress]) => progress.status === 'done' && lessons.find((l) => l.id === lessonId)?.category === category,
  ).length;
  return Math.min(3, 1 + doneInCategory) as 1 | 2 | 3;
}

/** จัดอันดับผู้สมัครสำหรับ "บทของวันนี้" ตาม PLAN.md ข้อ 7.1:
 *  1) ให้น้ำหนักบทที่ยังไม่จบมาก่อน
 *  2) เลี่ยงหมวดเดียวกับเมื่อวาน/วันก่อนนั้น และเลี่ยง format เดียวกับเมื่อวาน
 *  3) เลือกความยากที่เหมาะกับความคืบหน้าของผู้ใช้ในหมวดนั้น
 *  เป็นฟังก์ชัน pure (รับ today เข้ามา) เพื่อให้ทดสอบจำลองข้ามวันได้ */
export function rankCandidates(lessons: Lesson[], user: UserState, today: string = todayISO()): Lesson[] {
  const yesterday = lessonOnDate(user, lessons, shiftISO(today, -1));
  const twoDaysAgo = lessonOnDate(user, lessons, shiftISO(today, -2));

  function scoreOf(lesson: Lesson): number {
    const status = user.lessons[lesson.id]?.status ?? 'new';
    let score = status !== 'done' ? BONUS_NOT_DONE : 0;

    if (yesterday && lesson.category === yesterday.category) score -= PENALTY_SAME_CATEGORY_YESTERDAY;
    if (twoDaysAgo && lesson.category === twoDaysAgo.category) score -= PENALTY_SAME_CATEGORY_2DAYS_AGO;
    if (yesterday && lesson.format === yesterday.format) score -= PENALTY_SAME_FORMAT_YESTERDAY;

    const targetDifficulty = targetDifficultyFor(lesson.category, lessons, user);
    score -= Math.abs(lesson.difficulty - targetDifficulty) * PENALTY_PER_DIFFICULTY_STEP;

    return score;
  }

  return [...lessons].sort((a, b) => scoreOf(b) - scoreOf(a) || a.id.localeCompare(b.id));
}

export function pickTodayLesson(
  user: UserState,
  opts: { excludeIds?: string[]; lessons?: Lesson[]; today?: string } = {},
): Lesson | undefined {
  const { excludeIds = [], lessons = ALL_LESSONS, today = todayISO() } = opts;
  const ranked = rankCandidates(lessons, user, today).filter((l) => !excludeIds.includes(l.id));
  return ranked[0] ?? lessons.find((l) => !excludeIds.includes(l.id));
}
