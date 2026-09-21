import type { Category, LessonMeta } from '@/types/content';
import type { LessonProgress } from '@/types/user';

export interface CategoryScore {
  category: Category;
  /** เปอร์เซ็นต์คะแนนเฉลี่ยจากความพยายามล่าสุดของแต่ละบทในหมวด — null ถ้ายังไม่เคยทำควิซบทไหนในหมวดนี้เลย */
  avgPercent: number | null;
  attemptedCount: number;
  totalCount: number;
}

/** คะแนนเฉลี่ยรายหมวด — ใช้ "ความพยายามล่าสุด" ของแต่ละบทเป็นตัวแทน ไม่นับบทที่ยังไม่เคยทำควิซ */
export function computeCategoryScores(allLessons: LessonMeta[], lessons: Record<string, LessonProgress>): CategoryScore[] {
  const categories = Array.from(new Set(allLessons.map((l) => l.category)));

  return categories.map((category) => {
    const inCategory = allLessons.filter((l) => l.category === category);
    const attempted = inCategory.filter((l) => (lessons[l.id]?.attempts.length ?? 0) > 0);

    const avgPercent =
      attempted.length === 0
        ? null
        : Math.round(
            (attempted.reduce((sum, l) => {
              const attempts = lessons[l.id].attempts;
              const last = attempts[attempts.length - 1];
              return sum + (last.total > 0 ? last.score / last.total : 0);
            }, 0) /
              attempted.length) *
              100,
          );

    return { category, avgPercent, attemptedCount: attempted.length, totalCount: inCategory.length };
  });
}
