import type { Category, LessonMeta } from '@/types/content';
import type { LessonProgress } from '@/types/user';
import { shiftISO } from '@/lib/date';

/** สัปดาห์แบบจันทร์–อาทิตย์ (ISO) — start/end เป็น ISO date ปิดทั้งสองฝั่ง */
export interface WeekRange {
  start: string;
  end: string;
}

export interface RecapLesson {
  id: string;
  title: string;
  category: Category;
  completedAt: string;
  /** คะแนนดีที่สุดของบทนี้ในสัปดาห์นี้ (0–100) — null ถ้าไม่มีการทำควิซในสัปดาห์นี้ */
  bestPercent: number | null;
}

export interface WeeklyRecap {
  range: WeekRange;
  /** บทที่ "เรียนจบครั้งแรก" ในสัปดาห์นี้ เรียงตามวันที่จบ */
  completed: RecapLesson[];
  /** จำนวนครั้งที่ทำควิซหลัก (ไม่นับควิซทบทวน 2 ข้อ) */
  quizAttempts: number;
  /** จำนวนครั้งที่ทำควิซทบทวน */
  reviewAttempts: number;
  /** คะแนนเฉลี่ยของควิซหลักทั้งหมดในสัปดาห์ (0–100) — null ถ้าไม่มีการทำควิซ */
  avgPercent: number | null;
  /** จำนวนวันที่มีกิจกรรม (ทำควิซหรือจบบท) */
  activeDays: number;
  /** หมวดที่ได้เรียนจบ เรียงจากมากไปน้อย */
  categories: Category[];
  /** บทที่คะแนนดีที่สุดในสัปดาห์ (เสมอ: บทที่จบก่อน) */
  strongest?: RecapLesson;
  /** บทที่ควรทบทวน: คะแนนต่ำสุดที่ยังต่ำกว่า 80 และไม่ใช่บทเดียวกับ strongest */
  toRevisit?: RecapLesson;
}

const REVISIT_BELOW_PERCENT = 80;

/** จันทร์ของสัปดาห์ที่วันนั้นอยู่ (getDay: อาทิตย์=0 → เลื่อนให้จันทร์เป็นวันแรก) */
export function weekRangeOf(dateISO: string): WeekRange {
  const d = new Date(`${dateISO}T00:00:00`);
  const daysSinceMonday = (d.getDay() + 6) % 7;
  const start = shiftISO(dateISO, -daysSinceMonday);
  return { start, end: shiftISO(start, 6) };
}

export function shiftWeek(range: WeekRange, deltaWeeks: number): WeekRange {
  return { start: shiftISO(range.start, deltaWeeks * 7), end: shiftISO(range.end, deltaWeeks * 7) };
}

function inRange(date: string | undefined, range: WeekRange): date is string {
  return !!date && date >= range.start && date <= range.end;
}

export function buildWeeklyRecap(
  lessons: Record<string, LessonProgress>,
  getMeta: (id: string) => LessonMeta | undefined,
  range: WeekRange,
): WeeklyRecap {
  const activeDates = new Set<string>();
  let quizAttempts = 0;
  let reviewAttempts = 0;
  let percentSum = 0;
  const completed: RecapLesson[] = [];

  for (const [id, progress] of Object.entries(lessons)) {
    const meta = getMeta(id);
    if (!meta) continue;

    let best: number | null = null;
    for (const attempt of progress.attempts) {
      if (!inRange(attempt.date, range)) continue;
      activeDates.add(attempt.date);
      if (attempt.source === 'review') {
        reviewAttempts += 1;
        continue;
      }
      quizAttempts += 1;
      const percent = attempt.total > 0 ? (attempt.score / attempt.total) * 100 : 0;
      percentSum += percent;
      if (best === null || percent > best) best = percent;
    }

    if (progress.status === 'done' && inRange(progress.completedAt, range)) {
      activeDates.add(progress.completedAt);
      completed.push({
        id,
        title: meta.title,
        category: meta.category,
        completedAt: progress.completedAt,
        bestPercent: best === null ? null : Math.round(best),
      });
    }
  }

  completed.sort((a, b) => a.completedAt.localeCompare(b.completedAt) || a.id.localeCompare(b.id));

  const categoryCount = new Map<Category, number>();
  for (const c of completed) categoryCount.set(c.category, (categoryCount.get(c.category) ?? 0) + 1);
  const categories = [...categoryCount.entries()].sort((a, b) => b[1] - a[1]).map(([category]) => category);

  const scored = completed.filter((c): c is RecapLesson & { bestPercent: number } => c.bestPercent !== null);
  let strongest: RecapLesson | undefined;
  for (const c of scored) {
    if (!strongest || c.bestPercent > (strongest.bestPercent ?? 0)) strongest = c;
  }
  let toRevisit: RecapLesson | undefined;
  for (const c of scored) {
    if (c.id === strongest?.id || c.bestPercent >= REVISIT_BELOW_PERCENT) continue;
    if (!toRevisit || c.bestPercent < (toRevisit.bestPercent ?? 100)) toRevisit = c;
  }

  return {
    range,
    completed,
    quizAttempts,
    reviewAttempts,
    avgPercent: quizAttempts === 0 ? null : Math.round(percentSum / quizAttempts),
    activeDays: activeDates.size,
    categories,
    strongest,
    toRevisit,
  };
}

export function isRecapEmpty(recap: WeeklyRecap): boolean {
  return recap.completed.length === 0 && recap.quizAttempts === 0 && recap.reviewAttempts === 0;
}

/** ประโยคเปิดของสรุปสัปดาห์ — ภาษาเป็นกันเองแต่ไม่เว่อร์ อิงตัวเลขจริงล้วนๆ */
export function recapHeadline(recap: WeeklyRecap, categoryLabel: (c: Category) => string): string {
  if (isRecapEmpty(recap)) return 'สัปดาห์นี้ยังเงียบอยู่ เริ่มจากบทเดียววันนี้ก็พอ แล้วสรุปจะเริ่มมีเรื่องให้อ่าน';

  const n = recap.completed.length;
  const parts: string[] = [];

  if (n > 0) {
    const names = recap.categories.slice(0, 3).map(categoryLabel).join(' · ');
    parts.push(`เรียนจบ ${n} บท ครอบคลุม ${recap.categories.length} หมวด (${names})`);
  } else {
    parts.push('สัปดาห์นี้ยังไม่มีบทที่เรียนจบใหม่');
  }

  if (recap.avgPercent !== null) {
    const tone =
      recap.avgPercent >= 85 ? 'เข้าใจแน่นมาก' : recap.avgPercent >= REVISIT_BELOW_PERCENT ? 'เข้าใจดี' : 'ยังมีจุดที่ควรทบทวน';
    parts.push(`ควิซถูกเฉลี่ย ${recap.avgPercent}% (${tone})`);
  }

  if (recap.reviewAttempts > 0) parts.push(`ทบทวนซ้ำ ${recap.reviewAttempts} ครั้ง`);
  parts.push(`เรียนรู้ ${recap.activeDays} วันจากทั้งสัปดาห์`);

  return parts.join(' · ');
}

/**
 * ควรแสดงป้าย "สรุปสัปดาห์พร้อมแล้ว" บนหน้า Today ไหม
 *  - วันอาทิตย์: สรุปของสัปดาห์นี้ (ปิดสัปดาห์แล้ว)
 *  - วันจันทร์: สรุปของสัปดาห์ที่เพิ่งจบ
 * คืน 'this' | 'last' ว่าควรลิงก์ไปสัปดาห์ไหน หรือ null ถ้าไม่ควรแสดง (วันอื่น หรือสัปดาห์นั้นไม่มีกิจกรรม)
 */
export function recapTeaserTarget(
  todayISO: string,
  lessons: Record<string, LessonProgress>,
  getMeta: (id: string) => LessonMeta | undefined,
): 'this' | 'last' | null {
  const day = new Date(`${todayISO}T00:00:00`).getDay();
  if (day !== 0 && day !== 1) return null;

  const thisWeek = weekRangeOf(todayISO);
  const target = day === 0 ? 'this' : 'last';
  const range = day === 0 ? thisWeek : shiftWeek(thisWeek, -1);
  return isRecapEmpty(buildWeeklyRecap(lessons, getMeta, range)) ? null : target;
}
