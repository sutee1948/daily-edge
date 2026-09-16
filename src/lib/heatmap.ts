import type { LessonProgress } from '@/types/user';
import { todayISO, toISO } from '@/lib/date';

export interface HeatmapCell {
  date: string;
  count: number;
  inFuture: boolean;
}

/** รวมจำนวนครั้งที่ทำควิซ (หลัก+ทบทวน) ต่อวัน จากบทเรียนทั้งหมด — ใช้เป็นข้อมูล heatmap */
export function buildActivityMap(lessons: Record<string, LessonProgress>): Record<string, number> {
  const map: Record<string, number> = {};
  for (const progress of Object.values(lessons)) {
    for (const attempt of progress.attempts) {
      map[attempt.date] = (map[attempt.date] ?? 0) + 1;
    }
  }
  return map;
}

/** จัดข้อมูล heatmap เป็นตาราง [สัปดาห์][วันอาทิตย์..เสาร์] ของ `weeksCount` สัปดาห์ล่าสุด จบที่สัปดาห์ปัจจุบัน */
export function buildHeatmapWeeks(
  activity: Record<string, number>,
  weeksCount = 10,
  today: string = todayISO(),
): HeatmapCell[][] {
  const end = new Date(`${today}T00:00:00`);
  const endDow = end.getDay(); // 0=อาทิตย์ .. 6=เสาร์
  const alignedEnd = new Date(end);
  alignedEnd.setDate(end.getDate() + (6 - endDow)); // เลื่อนไปถึงเสาร์ของสัปดาห์นี้

  const totalDays = weeksCount * 7;
  const start = new Date(alignedEnd);
  start.setDate(alignedEnd.getDate() - totalDays + 1);

  const weeks: HeatmapCell[][] = [];
  for (let w = 0; w < weeksCount; w++) {
    const col: HeatmapCell[] = [];
    for (let d = 0; d < 7; d++) {
      const dt = new Date(start);
      dt.setDate(start.getDate() + w * 7 + d);
      const iso = toISO(dt);
      col.push({ date: iso, count: activity[iso] ?? 0, inFuture: iso > today });
    }
    weeks.push(col);
  }
  return weeks;
}

export function intensityLevel(count: number): 0 | 1 | 2 | 3 {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  return 3;
}
