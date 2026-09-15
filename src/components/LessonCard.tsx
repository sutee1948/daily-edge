import { Link } from 'react-router-dom';
import type { Lesson } from '@/types/content';
import { CategoryBadge } from '@/components/CategoryBadge';
import { useUserStore } from '@/store/useUserStore';

export function LessonCard({ lesson, reason }: { lesson: Lesson; reason?: string }) {
  const status = useUserStore((s) => s.lessons[lesson.id]?.status ?? 'new');

  return (
    <Link
      to={`/lesson/${lesson.id}`}
      className="card group flex flex-col gap-3 p-5 transition hover:border-ink/25 dark:hover:border-white/25"
    >
      <div className="flex items-center justify-between gap-2">
        <CategoryBadge category={lesson.category} />
        {status === 'done' && (
          <span className="text-sm text-cat-brain" aria-label="เรียนจบแล้ว">
            ✓ เรียนจบแล้ว
          </span>
        )}
      </div>
      <h3 className="text-lg font-semibold leading-snug text-ink group-hover:underline dark:text-paper">{lesson.title}</h3>
      <p className="text-sm text-ink/60 dark:text-paper/60">{lesson.subtitle}</p>
      {reason && <p className="text-xs text-ink/45 dark:text-paper/45">{reason}</p>}
      <div className="mt-1 text-xs text-ink/50 dark:text-paper/50">⏱ ประมาณ {lesson.estimatedMinutes} นาที</div>
    </Link>
  );
}
