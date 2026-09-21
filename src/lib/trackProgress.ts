import type { Track } from '@/types/content';
import type { LessonProgress } from '@/types/user';

export interface TrackProgress {
  done: number;
  total: number;
  /** 0–100 ปัดเป็นจำนวนเต็ม */
  percent: number;
  completed: boolean;
  /** บทแรกในลำดับที่ยังไม่จบ — ไม่มีเมื่อเรียนจบทั้งเส้นแล้ว */
  nextLessonId?: string;
  /** วันที่จบบทล่าสุดในเส้นนี้ (ISO) — ใช้จัดลำดับว่าเส้นไหนเพิ่งเรียนล่าสุด */
  lastCompletedAt?: string;
}

/** ความคืบหน้าของเส้นทาง — นับเฉพาะบทที่สถานะ 'done' (เกณฑ์เดียวกับหน้าอื่น) */
export function computeTrackProgress(track: Track, lessons: Record<string, LessonProgress>): TrackProgress {
  let done = 0;
  let nextLessonId: string | undefined;
  let lastCompletedAt: string | undefined;

  for (const id of track.lessonIds) {
    const p = lessons[id];
    if (p?.status === 'done') {
      done += 1;
      if (p.completedAt && (!lastCompletedAt || p.completedAt > lastCompletedAt)) lastCompletedAt = p.completedAt;
    } else if (nextLessonId === undefined) {
      nextLessonId = id;
    }
  }

  const total = track.lessonIds.length;
  return {
    done,
    total,
    percent: total === 0 ? 0 : Math.round((done / total) * 100),
    completed: total > 0 && done === total,
    nextLessonId,
    lastCompletedAt,
  };
}

/**
 * เส้นทางที่ควรเสนอให้ "เรียนต่อ" บนหน้า Today:
 * เลือกจากเส้นที่เริ่มแล้วแต่ยังไม่จบ โดยเส้นที่เพิ่งจบบทล่าสุดมาก่อน
 * ถ้าวันที่จบเท่ากัน ให้เส้นที่คืบหน้ามากกว่า และถ้ายังเท่ากันใช้ลำดับในรายการ (คงที่ ไม่สุ่ม)
 */
export function pickActiveTrack(
  tracks: Track[],
  lessons: Record<string, LessonProgress>,
): { track: Track; progress: TrackProgress } | undefined {
  const candidates = tracks
    .map((track, index) => ({ track, index, progress: computeTrackProgress(track, lessons) }))
    .filter((c) => c.progress.done > 0 && !c.progress.completed);

  if (candidates.length === 0) return undefined;

  candidates.sort((a, b) => {
    const da = a.progress.lastCompletedAt ?? '';
    const db = b.progress.lastCompletedAt ?? '';
    if (da !== db) return db.localeCompare(da);
    if (a.progress.done !== b.progress.done) return b.progress.done - a.progress.done;
    return a.index - b.index;
  });

  const { track, progress } = candidates[0];
  return { track, progress };
}
