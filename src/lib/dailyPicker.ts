import type { Lesson } from '@/types/content';
import type { UserState } from '@/types/user';
import { ALL_LESSONS } from '@/content';
import { todayISO } from '@/lib/date';

export const MAX_REROLLS_PER_DAY = 2;

/** จัดอันดับผู้สมัครสำหรับ "บทของวันนี้"
 *  เวอร์ชัน Phase 1 แบบง่าย: บทที่ยังไม่จบมาก่อน, สลับหมวดกับที่พึ่งเรียนล่าสุด
 *  อัลกอริทึมเต็มตาม PLAN.md ข้อ 7.1 (ห้ามซ้ำหมวด/format 2 วันติด) จะมาใน Phase 2 */
export function rankCandidates(lessons: Lesson[], user: UserState): Lesson[] {
  const lastDoneId = Object.entries(user.lessons)
    .filter(([, p]) => p.status === 'done' && p.completedAt)
    .sort((a, b) => (b[1].completedAt! > a[1].completedAt! ? 1 : -1))[0]?.[0];
  const lastCategory = lastDoneId ? lessons.find((l) => l.id === lastDoneId)?.category : undefined;

  return [...lessons].sort((a, b) => {
    const aDone = user.lessons[a.id]?.status === 'done';
    const bDone = user.lessons[b.id]?.status === 'done';
    if (aDone !== bDone) return aDone ? 1 : -1; // ยังไม่จบมาก่อน

    const aSameCat = a.category === lastCategory;
    const bSameCat = b.category === lastCategory;
    if (aSameCat !== bSameCat) return aSameCat ? 1 : -1; // เลี่ยงหมวดซ้ำกับล่าสุด

    return a.id.localeCompare(b.id); // deterministic tie-break
  });
}

export function pickTodayLesson(user: UserState, excludeIds: string[] = []): Lesson | undefined {
  const candidates = rankCandidates(ALL_LESSONS, user).filter((l) => !excludeIds.includes(l.id));
  return candidates[0] ?? ALL_LESSONS.find((l) => !excludeIds.includes(l.id));
}

export function getOrPickDaily(user: UserState): { lessonId: string; rerollsUsed: number } | undefined {
  const today = todayISO();
  if (user.dailyPick?.date === today) {
    return { lessonId: user.dailyPick.lessonId, rerollsUsed: user.dailyPick.rerollsUsed };
  }
  const picked = pickTodayLesson(user);
  return picked ? { lessonId: picked.id, rerollsUsed: 0 } : undefined;
}
