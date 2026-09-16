import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Heatmap } from '@/components/Heatmap';
import { CategoryBadge } from '@/components/CategoryBadge';
import { useUserStore } from '@/store/useUserStore';
import { ALL_LESSONS, getLesson } from '@/content';
import { buildActivityMap } from '@/lib/heatmap';
import { computeCategoryScores } from '@/lib/progressStats';
import { todayISO } from '@/lib/date';

export function Progress() {
  const lessons = useUserStore((s) => s.lessons);
  const streak = useUserStore((s) => s.streak);
  const reviewQueue = useUserStore((s) => s.reviewQueue);

  const activity = buildActivityMap(lessons);
  const categoryScores = computeCategoryScores(ALL_LESSONS, lessons);
  const doneCount = Object.values(lessons).filter((p) => p.status === 'done').length;
  const today = todayISO();

  const notYetSolid = [...reviewQueue]
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .map((e) => ({ entry: e, lesson: getLesson(e.lessonId) }))
    .filter((x): x is { entry: (typeof reviewQueue)[number]; lesson: NonNullable<ReturnType<typeof getLesson>> } => !!x.lesson);

  return (
    <Layout>
      <section className="mb-6">
        <h1 className="mb-1 text-2xl font-bold tracking-tight">ความคืบหน้า</h1>
        <p className="text-sm text-ink/50 dark:text-paper/50">
          เรียนจบแล้ว {doneCount}/{ALL_LESSONS.length} บท · streak ปัจจุบัน {streak.current} วัน (สูงสุด {streak.best})
        </p>
      </section>

      <section className="card mb-6 p-4">
        <h2 className="mb-3 text-sm font-semibold text-ink/70 dark:text-paper/70">กิจกรรมย้อนหลัง</h2>
        <Heatmap activity={activity} />
      </section>

      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-ink/70 dark:text-paper/70">คะแนนรายหมวด</h2>
        <div className="space-y-2">
          {categoryScores.map((cs) => (
            <div key={cs.category} className="card flex items-center justify-between gap-3 p-3">
              <CategoryBadge category={cs.category} />
              <div className="flex items-center gap-3">
                <span className="text-xs text-ink/45 dark:text-paper/45">
                  {cs.attemptedCount}/{cs.totalCount} บท
                </span>
                <span className="w-12 text-right text-sm font-semibold">
                  {cs.avgPercent === null ? '—' : `${cs.avgPercent}%`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-ink/70 dark:text-paper/70">🔁 บทที่ยังไม่แน่น</h2>
        {notYetSolid.length === 0 ? (
          <p className="text-sm text-ink/50 dark:text-paper/50">ไม่มีบทค้างทบทวน เก่งมาก!</p>
        ) : (
          <div className="space-y-2">
            {notYetSolid.map(({ entry, lesson }) => (
              <Link
                key={lesson.id}
                to={entry.dueDate <= today ? `/lesson/${lesson.id}/review` : `/lesson/${lesson.id}`}
                className="card flex items-center justify-between gap-3 p-3 transition hover:border-ink/25 dark:hover:border-white/25"
              >
                <span className="text-sm font-medium">{lesson.title}</span>
                <span className="shrink-0 text-xs text-ink/45 dark:text-paper/45">
                  {entry.dueDate <= today ? 'ถึงกำหนดแล้ว' : `นัดทบทวน ${entry.dueDate}`}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
}
