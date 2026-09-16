import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { AnimatePresence, m } from 'framer-motion';
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

  const q = questions[index];
  const selectedId = q ? answers[q.id] : undefined;
  const isLast = index === questions.length - 1;

  function selectOption(optionId: string) {
    if (revealed || !q) return;
    setAnswers((prev) => ({ ...prev, [q.id]: optionId }));
    setRevealed(true);
  }

  function next() {
    if (!q) return;
    if (isLast) {
      const scored = scoreQuiz(questions, answers);
      submitReviewAttempt(lesson!.id, scored);
      setResult({ score: scored.score, total: scored.total });
      setDone(true);
      return;
    }
    setIndex((i) => i + 1);
    setRevealed(false);
  }

  useEffect(() => {
    if (!q || done) return;
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) return;

      if (!revealed) {
        const n = Number(e.key);
        if (n >= 1 && n <= q!.options.length) {
          e.preventDefault();
          selectOption(q!.options[n - 1].id);
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        next();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed, q, answers, index, done]);

  if (!lesson) return <Navigate to="/" replace />;
  if (questions.length === 0) {
    return (
      <Layout hideNav>
        <p className="text-ink/65 dark:text-paper/65">บทนี้ยังไม่มีคำถามสำหรับทบทวน</p>
      </Layout>
    );
  }

  if (done && result) {
    const perfect = result.score === result.total;
    return (
      <Layout hideNav>
        <m.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col items-center gap-4 py-12 text-center"
        >
          <p className="text-5xl">{perfect ? '✅' : '🔁'}</p>
          <h1 className="text-xl font-semibold">
            ทบทวนแล้ว {result.score}/{result.total}
          </h1>
          <p className="max-w-xs text-sm text-ink/65 dark:text-paper/65">
            {perfect
              ? 'เยี่ยมมาก! เลื่อนรอบทบทวนถัดไปให้ห่างขึ้นแล้ว'
              : 'ยังไม่แน่นพอ พรุ่งนี้ระบบจะพาบทนี้กลับมาทบทวนอีกครั้ง'}
          </p>
          <Link to="/" className="btn-primary">
            กลับหน้าหลัก
          </Link>
        </m.div>
      </Layout>
    );
  }

  return (
    <Layout hideNav>
      <div className="mb-6">
        <p className="mb-2 text-sm text-ink/65 dark:text-paper/65">🔁 ทบทวน · {lesson.title}</p>
        <div className="mb-2 flex items-center justify-between text-sm text-ink/65 dark:text-paper/65">
          <span>
            ข้อ {index + 1} / {questions.length}
          </span>
        </div>
        <ProgressBar value={((index + (revealed ? 1 : 0)) / questions.length) * 100} />
      </div>

      <div style={{ perspective: 800 }}>
        <AnimatePresence mode="wait">
          <m.div
            key={q.id}
            initial={{ opacity: 0, rotateX: -6, y: 10 }}
            animate={{ opacity: 1, rotateX: 0, y: 0 }}
            exit={{ opacity: 0, rotateX: 6, y: -10 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="mb-5 text-xl font-semibold leading-snug">{q.prompt}</h1>

            <div className="space-y-3">
              {q.options.map((opt, i) => {
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
                      <span className="leading-relaxed">
                        <span className="mr-2 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink/5 text-xs text-ink/45 dark:bg-white/10 dark:text-paper/45">
                          {i + 1}
                        </span>
                        {opt.text}
                      </span>
                      {showState && isCorrect && <span className="shrink-0 text-cat-brain">✓</span>}
                      {showState && isSelected && !isCorrect && <span className="shrink-0 text-cat-china">✕</span>}
                    </div>
                    <AnimatePresence>
                      {showState && (
                        <m.p
                          initial={{ opacity: 0, y: -4, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: 'auto' }}
                          transition={{ duration: 0.2 }}
                          className="mt-2 text-sm leading-relaxed text-ink/65 dark:text-paper/65"
                        >
                          {opt.explain}
                        </m.p>
                      )}
                    </AnimatePresence>
                  </button>
                );
              })}
            </div>
          </m.div>
        </AnimatePresence>
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
