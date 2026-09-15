import type { Lesson } from '@/types/content';
import type { LessonProgress } from '@/types/user';
import { categoryOf } from '@/lib/categories';
import { todayISO, diffDaysISO } from '@/lib/date';

type ProgressMap = Record<string, LessonProgress>;

// น้ำหนักคะแนนตาม PLAN.md ข้อ 6
const W_TAG = 3.0;
const W_RELATED = 2.5;
const W_CATEGORY = 1.5;
const W_DIFFICULTY_UP = 1.0;
const W_RECENTLY_DONE_PENALTY = 5.0;
const RECENT_DAYS = 30;
const MAX_SAME_CATEGORY = 1;

export interface Recommendation {
  lesson: Lesson;
  score: number;
  reason: string;
}

function tagOverlapRatio(source: Lesson, candidate: Lesson): { ratio: number; shared: string[] } {
  const shared = source.tags.filter((t) => candidate.tags.includes(t));
  const ratio = source.tags.length > 0 ? shared.length / source.tags.length : 0;
  return { ratio, shared };
}

function wasCompletedRecently(progress: ProgressMap, lessonId: string, today: string): boolean {
  const completedAt = progress[lessonId]?.completedAt;
  if (!completedAt) return false;
  return diffDaysISO(completedAt, today) <= RECENT_DAYS;
}

function masteredLastAttempt(progress: ProgressMap, lessonId: string): boolean {
  const attempts = progress[lessonId]?.attempts ?? [];
  const last = attempts[attempts.length - 1];
  return !!last && last.total > 0 && last.score === last.total;
}

function scoreCandidate(source: Lesson, candidate: Lesson, progress: ProgressMap, today: string) {
  const { ratio, shared } = tagOverlapRatio(source, candidate);
  const inRelated = source.relatedIds.includes(candidate.id);
  const sameCategory = candidate.category === source.category;
  const difficultyUp = masteredLastAttempt(progress, source.id) && candidate.difficulty === source.difficulty + 1;
  const recentlyDone = wasCompletedRecently(progress, candidate.id, today);

  const parts = {
    tag: W_TAG * ratio,
    related: inRelated ? W_RELATED : 0,
    category: sameCategory ? W_CATEGORY : 0,
    difficulty: difficultyUp ? W_DIFFICULTY_UP : 0,
    penalty: recentlyDone ? -W_RECENTLY_DONE_PENALTY : 0,
  };

  const score = parts.tag + parts.related + parts.category + parts.difficulty + parts.penalty;
  return { score, parts, sharedTags: shared, sameCategory };
}

function reasonFor(candidate: Lesson, parts: ReturnType<typeof scoreCandidate>['parts'], sharedTags: string[]): string {
  const options: { value: number; label: string }[] = [
    { value: parts.related, label: 'เพราะผู้เขียนแนะนำให้เรียนต่อจากบทนี้' },
    { value: parts.tag, label: sharedTags[0] ? `เพราะเกี่ยวข้องกับ "${sharedTags[0]}"` : '' },
    { value: parts.difficulty, label: 'เพราะคุณเพิ่งเข้าใจแม่นบทก่อนหน้า ลองบทที่ยากขึ้นอีกระดับ' },
    { value: parts.category, label: `เพราะอยู่ในหมวด ${categoryOf(candidate.category).label} เหมือนกัน` },
  ].filter((o) => o.label);

  const best = options.sort((a, b) => b.value - a.value)[0];
  if (best && best.value > 0) return best.label;
  return `ลองมุมมองใหม่จากหมวด ${categoryOf(candidate.category).label} บ้าง`;
}

/** แนะนำหัวข้อเกี่ยวข้อง — คะแนนตาม PLAN.md ข้อ 6 พร้อมเหตุผลที่อธิบายได้ต่อการ์ด
 *  บังคับหมวดเดียวกับบทต้นทางได้ไม่เกิน 1 ใน `count` เพื่อให้มีอย่างน้อย 1 เรื่องข้ามหมวดเสมอ (ถ้ามีให้เลือก) */
export function recommendLessons(
  sourceLessonId: string,
  allLessons: Lesson[],
  progress: ProgressMap,
  count = 3,
): Recommendation[] {
  const source = allLessons.find((l) => l.id === sourceLessonId);
  if (!source) return [];

  const today = todayISO();
  const ranked = allLessons
    .filter((l) => l.id !== source.id)
    .map((candidate) => {
      const { score, parts, sharedTags, sameCategory } = scoreCandidate(source, candidate, progress, today);
      return { lesson: candidate, score, reason: reasonFor(candidate, parts, sharedTags), sameCategory };
    })
    .sort((a, b) => b.score - a.score || a.lesson.id.localeCompare(b.lesson.id));

  const picked: Recommendation[] = [];
  let sameCategoryUsed = 0;

  // รอบแรก: เคารพเพดานหมวดเดียวกัน
  for (const candidate of ranked) {
    if (picked.length >= count) break;
    if (candidate.sameCategory && sameCategoryUsed >= MAX_SAME_CATEGORY) continue;
    picked.push({ lesson: candidate.lesson, score: candidate.score, reason: candidate.reason });
    if (candidate.sameCategory) sameCategoryUsed += 1;
  }

  // รอบเติม: ถ้าตัวเลือกข้ามหมวดไม่พอ ค่อยผ่อนเพดานเพื่อให้ได้ครบจำนวน
  if (picked.length < count) {
    const pickedIds = new Set(picked.map((p) => p.lesson.id));
    for (const candidate of ranked) {
      if (picked.length >= count) break;
      if (pickedIds.has(candidate.lesson.id)) continue;
      picked.push({ lesson: candidate.lesson, score: candidate.score, reason: candidate.reason });
    }
  }

  return picked;
}
