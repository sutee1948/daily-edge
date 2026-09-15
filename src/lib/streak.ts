import type { StreakState } from '@/types/user';
import { diffDaysISO } from '@/lib/date';

export const MONTHLY_FREEZES = 2;
export const MILESTONES = [7, 30, 100] as const;

export function initialStreak(): StreakState {
  return { current: 0, best: 0, lastStudyDate: null, freezesLeft: MONTHLY_FREEZES, milestonesSeen: [] };
}

/** อัปเดต streak ตามการเรียนของ "วันนี้" (today เป็น ISO date, ฉีดเข้ามาเพื่อให้ทดสอบได้ง่าย)
 *  กติกาตาม PLAN.md ข้อ 7.3: เว้น 1 วันแต่ยังมี freeze → ใช้ freeze แทนการรีเซ็ต, เว้นเกินนั้น → เริ่มนับใหม่ */
export function bumpStreak(streak: StreakState, today: string): StreakState {
  if (streak.lastStudyDate === today) return streak; // วันนี้นับไปแล้ว

  if (!streak.lastStudyDate) {
    return { ...streak, current: 1, best: Math.max(streak.best, 1), lastStudyDate: today };
  }

  const gap = diffDaysISO(streak.lastStudyDate, today);

  if (gap === 1) {
    const current = streak.current + 1;
    return { ...streak, current, best: Math.max(streak.best, current), lastStudyDate: today };
  }

  if (gap === 2 && streak.freezesLeft > 0) {
    // ขาดไป 1 วัน แต่ยังมี freeze — ใช้ freeze แทนการรีเซ็ต
    const current = streak.current + 1;
    return {
      ...streak,
      current,
      best: Math.max(streak.best, current),
      lastStudyDate: today,
      freezesLeft: streak.freezesLeft - 1,
    };
  }

  // ขาดเกินกว่านี้ (หรือ gap <= 0 ผิดปกติ) — เริ่มนับใหม่
  return { ...streak, current: 1, best: Math.max(streak.best, 1), lastStudyDate: today };
}

/** milestone ที่เพิ่งข้ามและยังไม่เคยฉลอง (มีได้อย่างมาก 1 อันต่อการเรียก เพราะ current เพิ่มทีละ 1) */
export function nextUnseenMilestone(streak: StreakState): number | null {
  const hit = MILESTONES.find((m) => streak.current >= m && !streak.milestonesSeen.includes(m));
  return hit ?? null;
}
