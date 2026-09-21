import { Link, useParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { CategoryBadge } from '@/components/CategoryBadge';
import { ProgressBar } from '@/components/ProgressBar';
import { getLessonMeta } from '@/content';
import { getTrack } from '@/content/tracks';
import { useUserStore } from '@/store/useUserStore';
import { computeTrackProgress } from '@/lib/trackProgress';
import type { LessonMeta } from '@/types/content';
import { NotFound } from '@/routes/NotFound';

export function TrackDetail() {
  const { id } = useParams<{ id: string }>();
  const track = id ? getTrack(id) : undefined;
  const lessons = useUserStore((s) => s.lessons);

  if (!track) return <NotFound />;

  const progress = computeTrackProgress(track, lessons);
  const metas = track.lessonIds.map((lid) => getLessonMeta(lid)).filter((l): l is LessonMeta => !!l);
  const minutes = metas.reduce((sum, l) => sum + l.estimatedMinutes, 0);
  const next = progress.nextLessonId ? getLessonMeta(progress.nextLessonId) : undefined;

  return (
    <Layout>
      <section className="mb-6">
        <Link to="/tracks" className="mb-3 inline-block text-sm text-ink/65 hover:underline dark:text-paper/65">
          ← เส้นทางทั้งหมด
        </Link>
        <div className="flex items-start gap-3">
          <span className="text-3xl leading-none" aria-hidden>
            {track.emoji}
          </span>
          <div>
            <h1 className="text-2xl font-bold leading-snug tracking-tight">{track.title}</h1>
            <p className="mt-1 text-sm text-ink/65 dark:text-paper/65">{track.subtitle}</p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-ink/70 dark:text-paper/70">เหมาะกับ: {track.audience}</p>
        <div className="mt-4">
          <ProgressBar value={progress.percent} />
          <p className="mt-1.5 text-xs text-ink/65 dark:text-paper/65">
            เรียนจบแล้ว {progress.done}/{progress.total} บท · ทั้งเส้นใช้เวลาราว {minutes} นาที (เฉลี่ยวันละ 1 บท ≈ {progress.total} วัน)
          </p>
        </div>
        {next && (
          <Link to={`/lesson/${next.id}`} className="btn-primary mt-4 inline-flex">
            {progress.done === 0 ? 'เริ่มเส้นทางนี้' : 'เรียนต่อ'} · {next.title}
          </Link>
        )}
        {progress.completed && (
          <p className="mt-4 rounded-xl2 bg-cat-growth/15 p-3 text-sm font-semibold text-cat-growth">
            🎉 เรียนครบทั้งเส้นแล้ว ลองเลือกเส้นทางใหม่ หรือกลับไปทบทวนบทที่ยังไม่แน่น
          </p>
        )}
      </section>

      <ol className="grid gap-3">
        {metas.map((lesson, index) => {
          const status = lessons[lesson.id]?.status ?? 'new';
          const isNext = lesson.id === progress.nextLessonId;
          return (
            <li key={lesson.id}>
              <Link
                to={`/lesson/${lesson.id}`}
                className={`card flex gap-3 p-4 transition hover:border-ink/25 dark:hover:border-white/25 ${
                  isNext ? 'border-edge' : ''
                }`}
              >
                <span
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                    status === 'done' ? 'bg-cat-brain/15 text-cat-brain' : 'bg-ink/10 text-ink/70 dark:bg-white/10 dark:text-paper/70'
                  }`}
                  aria-label={status === 'done' ? 'เรียนจบแล้ว' : `บทที่ ${index + 1}`}
                >
                  {status === 'done' ? '✓' : index + 1}
                </span>
                <div className="min-w-0">
                  <CategoryBadge category={lesson.category} className="mb-1.5 !px-2 !py-0.5 !text-xs" />
                  <h2 className="text-base font-semibold leading-snug">{lesson.title}</h2>
                  <p className="mt-1 text-xs text-ink/65 dark:text-paper/65">
                    ⏱ ประมาณ {lesson.estimatedMinutes} นาที{isNext ? ' · บทถัดไป' : ''}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
    </Layout>
  );
}
