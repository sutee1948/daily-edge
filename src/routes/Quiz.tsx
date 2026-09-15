import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
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

  if (!lesson) return <Navigate to="/" replace />;
  if (questions.length === 0) {
    return (
      <Layout>
        <p className="text-ink/60 dark:text-paper/60">บทนี้ยังไม่มีคำถาม</p>
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
      const result = scoreQuiz(questions, answers);
      submitQuizAttempt(lesson!.id, result);
      navigate(`/lesson/${lesson!.id}/result`);
      return;
    }
    setIndex((i) => i + 1);
    setRevealed(false);
  }

  return (
    <Layout>
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-sm text-ink/50 dark:text-paper/50">
          <span>
            ข้อ {index + 1} / {questions.length}
          </span>
          <span>{TYPE_LABEL[q.type]}</span>
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
              {showState && (
                <p className="mt-2 text-sm leading-relaxed text-ink/60 dark:text-paper/60">{opt.explain}</p>
              )}
            </button>
          );
        })}
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
