import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { CategoryBadge } from '@/components/CategoryBadge';
import { FormatBadge } from '@/components/FormatBadge';
import { useUserStore } from '@/store/useUserStore';
import { ALL_LESSON_METAS, getLessonMeta } from '@/content';
import { MAX_REROLLS_PER_DAY } from '@/lib/dailyPicker';
import { nextUnseenMilestone } from '@/lib/streak';
import { getDueReviews } from '@/lib/srs';
import { todayISO } from '@/lib/date';

const MILESTONE_LABEL: Record<number, string> = {
  7: 'ครบ 1 สัปดาห์ติดกันแล้ว 🎉',
  30: 'ครบ 30 วันติดกัน สุดยอดมาก 🔥',
  100: '100 วันติดกัน! ระดับตำนาน 🏆',
};

export function Today() {
  const dailyPick = useUserStore((s) => s.dailyPick);
  const ensureDailyPick = useUserStore((s) => s.ensureDailyPick);
  const rerollDailyPick = useUserStore((s) => s.rerollDailyPick);
  const lessons = useUserStore((s) => s.lessons);
  const streak = useUserStore((s) => s.streak);
  const acknowledgeMilestone = useUserStore((s) => s.acknowledgeMilestone);
  const reviewQueue = useUserStore((s) => s.reviewQueue);

  useEffect(() => {
    ensureDailyPick();
  }, [ensureDailyPick]);

  const todayLesson = dailyPick ? getLessonMeta(dailyPick.lessonId) : undefined;
  const rerollsLeft = MAX_REROLLS_PER_DAY - (dailyPick?.rerollsUsed ?? 0);

  const doneCount = Object.values(lessons).filter((p) => p.status === 'done').length;
  const milestone = nextUnseenMilestone(streak);
  const dueReviews = getDueReviews(reviewQueue, todayISO())
    .map((e) => getLessonMeta(e.lessonId))
    .filter((l): l is NonNullable<typeof l> => !!l);

  return (
    <Layout>
      {milestone !== null && (
        <section className="mb-6 flex items-center justify-between gap-3 rounded-xl2 bg-cat-growth/15 p-4 text-cat-growth">
          <p className="text-sm font-semibold">{MILESTONE_LABEL[milestone]}</p>
          <button
            type="button"
            onClick={() => acknowledgeMilestone(milestone)}
            className="shrink-0 text-xs font-medium underline decoration-dotted underline-offset-2"
          >
            ปิด
          </button>
        </section>
      )}

      {dueReviews.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-ink/70 dark:text-paper/70">
            🔁 ถึงเวลาทบทวนแล้ว ({dueReviews.length})
          </h2>
          <div className="space-y-2">
            {dueReviews.map((lesson) => (
              <Link
                key={lesson.id}
                to={`/lesson/${lesson.id}/review`}
                className="card flex items-center justify-between gap-3 p-4 transition hover:border-ink/25 dark:hover:border-white/25"
              >
                <div>
                  <p className="text-sm font-medium leading-snug">{lesson.title}</p>
                  <p className="text-xs text-ink/65 dark:text-paper/65">ทบทวน 2 ข้อ · ~2 นาที</p>
                </div>
                <span className="btn-secondary shrink-0 !px-4 !py-2 text-sm">ทบทวน</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mb-8">
        <p className="mb-1 text-sm text-ink/65 dark:text-paper/65">วันนี้เรียนอะไรดี</p>
        <h1 className="text-2xl font-bold tracking-tight">เลือกมาให้แล้ว อ่านจบใน 10 นาที</h1>
      </section>

      {todayLesson ? (
        <section className="card mb-6 overflow-hidden">
          <div className="flex flex-col gap-4 p-6">
            <div className="flex flex-wrap items-center gap-2">
              <CategoryBadge category={todayLesson.category} />
              <FormatBadge format={todayLesson.format} />
            </div>
            <div>
              <h2 className="text-xl font-bold leading-snug">{todayLesson.title}</h2>
              <p className="mt-1 text-ink/65 dark:text-paper/65">{todayLesson.subtitle}</p>
            </div>
            <p className="text-sm leading-relaxed text-ink/70 dark:text-paper/70">{todayLesson.hook}</p>
            <div className="flex items-center gap-3 text-sm text-ink/65 dark:text-paper/65">
              <span>⏱ ประมาณ {todayLesson.estimatedMinutes} นาที</span>
              <span>·</span>
              <span>{todayLesson.wordCount} คำ</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <Link to={`/lesson/${todayLesson.id}`} className="btn-primary">
                เริ่มเรียนวันนี้
              </Link>
              <button
                type="button"
                onClick={rerollDailyPick}
                disabled={rerollsLeft <= 0}
                className="btn-ghost disabled:cursor-not-allowed disabled:opacity-40"
              >
                🔀 เปลี่ยนเรื่อง ({rerollsLeft} ครั้งเหลือ)
              </button>
            </div>
          </div>
        </section>
      ) : (
        <p className="text-ink/65 dark:text-paper/65">ยังไม่มีบทเรียนในระบบ</p>
      )}

      <section className="mb-8 grid grid-cols-2 gap-3">
        <div className="card p-4">
          <p className="text-2xl font-bold">{doneCount}</p>
          <p className="text-sm text-ink/65 dark:text-paper/65">บทที่เรียนจบแล้ว</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-bold">{ALL_LESSON_METAS.length}</p>
          <p className="text-sm text-ink/65 dark:text-paper/65">บทที่มีในตอนนี้</p>
        </div>
      </section>

      <Link
        to="/library"
        className="card flex items-center justify-between p-4 text-sm font-medium transition hover:border-ink/25 dark:hover:border-white/25"
      >
        📚 ดูคลังบททั้งหมด ({ALL_LESSON_METAS.length} บท)
        <span aria-hidden>→</span>
      </Link>
    </Layout>
  );
}
