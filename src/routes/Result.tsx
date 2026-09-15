import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { ScoreRing } from '@/components/ScoreRing';
import { LessonCard } from '@/components/LessonCard';
import { getLesson, ALL_LESSONS } from '@/content';
import { useUserStore } from '@/store/useUserStore';
import { recommendLessons } from '@/lib/recommend';

function bandOf(score: number, total: number): 'mastered' | 'passed' | 'shaky' {
  if (total === 0) return 'shaky';
  if (score === total) return 'mastered';
  return score / total >= 0.75 ? 'passed' : 'shaky';
}

const BAND_META = {
  mastered: { label: 'เข้าใจแม่น 🏆', tone: 'text-cat-brain' },
  passed: { label: 'ผ่าน ✅', tone: 'text-cat-mgmt' },
  shaky: { label: 'ยังไม่แน่น 🔁', tone: 'text-cat-china' },
} as const;

export function Result() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const lesson = getLesson(id);
  const progress = useUserStore((s) => s.lessons[id]);
  const allProgress = useUserStore((s) => s.lessons);
  const finishToday = useUserStore((s) => s.finishToday);

  if (!lesson) return <Navigate to="/" replace />;

  const attempt = progress?.attempts[progress.attempts.length - 1];
  if (!attempt) return <Navigate to={`/lesson/${id}/quiz`} replace />;

  const band = bandOf(attempt.score, attempt.total);
  const wrongQuestions = lesson.questions.filter((q) => attempt.wrongQIds.includes(q.id));
  const firstWrongBeat = wrongQuestions.find((q) => q.targetBeat !== undefined)?.targetBeat;
  const related = recommendLessons(lesson.id, ALL_LESSONS, allProgress, 3);

  function handleFinishToday() {
    finishToday();
    navigate('/');
  }

  return (
    <Layout>
      <section className="mb-8 flex flex-col items-center text-center">
        <ScoreRing score={attempt.score} total={attempt.total} />
        <p className={`mt-4 text-lg font-semibold ${BAND_META[band].tone}`}>{BAND_META[band].label}</p>
        <p className="mt-1 text-sm text-ink/55 dark:text-paper/55">{lesson.title}</p>
      </section>

      {wrongQuestions.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-base font-semibold text-ink/70 dark:text-paper/70">ดูเฉลยข้อที่พลาด</h2>
          <div className="space-y-3">
            {wrongQuestions.map((q) => {
              const correct = q.options.find((o) => o.id === q.correctId);
              return (
                <div key={q.id} className="card p-4">
                  <p className="mb-2 font-medium leading-relaxed">{q.prompt}</p>
                  <p className="text-sm leading-relaxed text-cat-brain">✓ {correct?.text}</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink/55 dark:text-paper/55">{correct?.explain}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="mb-8 grid gap-3 sm:grid-cols-2">
        <Link to={`/lesson/${lesson.id}/quiz`} className="btn-secondary">
          🔁 ทำข้อสอบใหม่
        </Link>
        <Link
          to={`/lesson/${lesson.id}${firstWrongBeat !== undefined ? `?focus=${firstWrongBeat}` : ''}`}
          className="btn-secondary"
        >
          📖 เรียนซ้ำ
        </Link>
      </section>

      {related.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">สนใจเรียนต่อไหม</h2>
          <div className="grid gap-3">
            {related.map((r) => (
              <LessonCard key={r.lesson.id} lesson={r.lesson} reason={r.reason} />
            ))}
          </div>
        </section>
      )}

      <div className="flex justify-center">
        <button type="button" onClick={handleFinishToday} className="btn-primary">
          พอแค่นี้วันนี้ ✓
        </button>
      </div>
    </Layout>
  );
}
