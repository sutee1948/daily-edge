import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, m } from 'framer-motion';
import { Layout } from '@/components/Layout';
import { ProgressBar } from '@/components/ProgressBar';
import { getLesson } from '@/content';
import { pickQuizQuestions, scoreQuiz } from '@/lib/quiz';
import { useUserStore } from '@/store/useUserStore';

const TYPE_LABEL: Record<string, string> = {
  mcq: 'เลือกตอบ',
  scenario: 'สถานการณ์',
  'true-false-why': 'ถูก/ผิด + เหตุผล',
  'odd-one-out': 'หาตัวที่ไม่เข้าพวก',
};

export function Quiz() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const lesson = getLesson(id);
  const submitQuizAttempt = useUserStore((s) => s.submitQuizAttempt);
  const recordQuizQuestionSet = useUserStore((s) => s.recordQuizQuestionSet);

  const [questions] = useState(() => {
    if (!lesson) return [];
    const lastIds = useUserStore.getState().lessons[lesson.id]?.lastQuizQuestionIds;
    return pickQuizQuestions(lesson.questions, undefined, lastIds);
  });
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (lesson && questions.length > 0) {
      recordQuizQuestionSet(
        lesson.id,
        questions.map((q) => q.id),
      );
    }
    // เก็บชุดคำถามของรอบนี้ไว้ครั้งเดียวตอนเข้าหน้า ไม่ต้องรันซ้ำ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      const result = scoreQuiz(questions, answers);
      submitQuizAttempt(lesson!.id, result);
      navigate(`/lesson/${lesson!.id}/result`);
      return;
    }
    setIndex((i) => i + 1);
    setRevealed(false);
  }

  // คีย์บอร์ดลัด: กด 1-4 เลือกข้อ, Enter ไปข้อถัดไปหลังเฉลยแล้ว
  useEffect(() => {
    if (!q) return;
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
  }, [revealed, q, answers, index]);

  if (!lesson) return <Navigate to="/" replace />;
  if (questions.length === 0) {
    return (
      <Layout hideNav>
        <p className="text-ink/65 dark:text-paper/65">บทนี้ยังไม่มีคำถาม</p>
      </Layout>
    );
  }

  return (
    <Layout hideNav>
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-sm text-ink/65 dark:text-paper/65">
          <span>
            ข้อ {index + 1} / {questions.length}
          </span>
          <span>{TYPE_LABEL[q.type]}</span>
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
            {isLast ? 'ดูผลสรุป →' : 'ข้อถัดไป →'}
          </button>
        </div>
      )}
    </Layout>
  );
}
