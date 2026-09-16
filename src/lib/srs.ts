import type { ReviewQueueEntry } from '@/types/user';
import { shiftISO } from '@/lib/date';

/** ช่วงเวลาทบทวนแบบเว้นระยะ (วัน) ตาม PLAN.md ข้อ 7.2 — SM-2 lite */
export const SRS_INTERVALS_DAYS = [1, 3, 7, 16, 35];

/** บทที่ถึงกำหนดทบทวนแล้ว ณ วันนี้ (dueDate <= today) เรียงตามกำหนดใกล้สุดก่อน */
export function getDueReviews(queue: ReviewQueueEntry[], today: string): ReviewQueueEntry[] {
  return queue.filter((e) => e.dueDate <= today).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

/** เรียกตอนส่งควิซหลัก (main quiz) ของบทเรียน:
 *  - ถ้าตอบผิดอย่างน้อย 1 ข้อ → เข้าคิวทบทวน (หรือรีเซ็ตกลับไปช่วง 1 วันถ้าอยู่ในคิวอยู่แล้ว)
 *  - ถ้าตอบถูกหมด (perfect) → ถือว่าแน่นแล้ว ถอดออกจากคิวถ้ามีอยู่ */
export function upsertReviewOnMainQuiz(
  queue: ReviewQueueEntry[],
  lessonId: string,
  today: string,
  hadWrongAnswers: boolean,
): ReviewQueueEntry[] {
  const withoutThis = queue.filter((e) => e.lessonId !== lessonId);
  if (!hadWrongAnswers) return withoutThis; // ตอบถูกหมด — ไม่ต้องทบทวนแล้ว

  return [...withoutThis, { lessonId, dueDate: shiftISO(today, 1), intervalIdx: 0 }];
}

/** เรียกตอนส่งควิซทบทวน (review quiz, 2 ข้อ):
 *  - ตอบถูกทั้งหมด → เลื่อนไปช่วงถัดไป (หรือ "จบ" ออกจากคิวถ้าผ่านช่วงสุดท้ายแล้ว)
 *  - ตอบผิดข้อใดข้อหนึ่ง → กลับไปเริ่มที่ 1 วัน */
export function advanceReview(queue: ReviewQueueEntry[], lessonId: string, today: string, allCorrect: boolean): ReviewQueueEntry[] {
  const entry = queue.find((e) => e.lessonId === lessonId);
  const rest = queue.filter((e) => e.lessonId !== lessonId);
  if (!entry) return queue; // ไม่มีอยู่ในคิว ไม่ต้องทำอะไร

  if (!allCorrect) {
    return [...rest, { lessonId, dueDate: shiftISO(today, 1), intervalIdx: 0 }];
  }

  const nextIdx = entry.intervalIdx + 1;
  if (nextIdx >= SRS_INTERVALS_DAYS.length) {
    return rest; // ผ่านช่วงสุดท้ายแล้ว — ถือว่าจบ ถอดออกจากคิว
  }
  return [...rest, { lessonId, dueDate: shiftISO(today, SRS_INTERVALS_DAYS[nextIdx]), intervalIdx: nextIdx }];
}
