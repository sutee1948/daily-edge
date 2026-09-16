import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { ProgressBar } from '@/components/ProgressBar';
import { getLesson } from '@/content';
import { pickQuizQuestions, scoreQuiz } from '@/lib/quiz';
import { useUserStore } from '@/store/useUserStore';

const REVIEW_QUESTIONS = 2;

export function Review() {
  const { id = '' } = useParams();
  const lesson = getLesson(id);
  const submitReviewAttempt = useUserStore((s) => s.submitReviewAttempt);

  const [questions] = useState(() => (lesson ? pickQuizQuestions(lesson.questions, REVIEW_QUESTIONS) : []));
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<{ score: number; total: number } | null>(null);

  if (!lesson) return <Navigate to="/" replace />;
  if (questions.length === 0) {
    return (
      <Layout hideNav>
        <p className="text-ink/60 dark:text-paper/60">บทนี้ยังไม่มีคำถามสำหรับทบทวน</p>
      </Layout>
    );
  }

  const q = questions[index];
  const selectedId = answers[q.id];
  const isLast = index === questions.length - 1;

  function selectOption(optionId: string) {
    if (revealed) return;
    setAnswers((prev) => ({ ...prev, [q.id]: optionId }));
    setRevealed(true);
  }

  function next() {
    if (isLast) {
      const finalAnswers = answers;
      const scored = scoreQuiz(questions, finalAnswers);
      submitReviewAttempt(lesson!.id, scored);
      setResult({ score: scored.score, total: scored.total });
      setDone(true);
      return;
    }
    setIndex((i) => i + 1);
    setRevealed(false);
  }

  if (done && result) {
    const perfect = result.score === result.total;
    return (
      <Layout hideNav>
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="text-5xl">{perfect ? '✅' : '🔁'}</p>
          <h1 className="text-xl font-semibold">
            ทบทวนแล้ว {result.score}/{result.total}
          </h1>
          <p className="max-w-xs text-sm text-ink/60 dark:text-paper/60">
            {perfect
              ? 'เยี่ยมมาก! เลื่อนรอบทบทวนถัดไปให้ห่างขึ้นแล้ว'
              : 'ยังไม่แน่นพอ พรุ่งนี้ระบบจะพาบทนี้กลับมาทบทวนอีกครั้ง'}
          </p>
          <Link to="/" className="btn-primary">
            กลับหน้าหลัก
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout hideNav>
      <div className="mb-6">
        <p className="mb-2 text-sm text-ink/50 dark:text-paper/50">
          🔁 ทบทวน · {lesson.title}
        </p>
        <div className="mb-2 flex items-center justify-between text-sm text-ink/50 dark:text-paper/50">
          <span>
            ข้อ {index + 1} / {questions.length}
          </span>
        </div>
        <ProgressBar value={((index + (revealed ? 1 : 0)) / questions.length) * 100} />
      </div>

      <h1 className="mb-5 text-xl font-semibold leading-snug">{q.prompt}</h1>

      <div className="space-y-3">
        {q.options.map((opt) => {
          const isSelected = selectedId === opt.id;
          const isCorrect = opt.id === q.correctId;
          const showState = revealed;

          let stateClass = 'border-ink/12 dark:border-white/12';
          if (showState && isCorrect) {
            stateClass = 'border-cat-brain bg-cat-brain/10';
          } else if (showState && isSelected && !isCorrect) {
            stateClass = 'border-cat-china bg-cat-china/10';
          }

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => selectOption(opt.id)}
              disabled={revealed}
              className={`w-full rounded-xl2 border p-4 text-left transition ${stateClass} ${
                !revealed ? 'hover:border-ink/30 dark:hover:border-white/30 active:scale-[0.99]' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="leading-relaxed">{opt.text}</span>
                {showState && isCorrect && <span className="shrink-0 text-cat-brain">✓</span>}
                {showState && isSelected && !isCorrect && <span className="shrink-0 text-cat-china">✕</span>}
              </div>
              {showState && <p className="mt-2 text-sm leading-relaxed text-ink/60 dark:text-paper/60">{opt.explain}</p>}
            </button>
          );
        })}
      </div>

      {revealed && (
        <div className="mt-6 flex justify-end">
          <button type="button" onClick={next} className="btn-primary">
            {isLast ? 'เสร็จแล้ว →' : 'ข้อถัดไป →'}
          </button>
        </div>
      )}
    </Layout>
  );
}
