import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { CategoryBadge } from '@/components/CategoryBadge';
import { FormatBadge } from '@/components/FormatBadge';
import { ProgressBar } from '@/components/ProgressBar';
import { getLesson } from '@/content';
import { useUserStore } from '@/store/useUserStore';

export function Lesson() {
  const { id = '' } = useParams();
  const [searchParams] = useSearchParams();
  const lesson = getLesson(id);
  const markLessonStarted = useUserStore((s) => s.markLessonStarted);
  const bookmarked = useUserStore((s) => (lesson ? s.lessons[lesson.id]?.bookmarked ?? false : false));
  const toggleBookmark = useUserStore((s) => s.toggleBookmark);
  const [scrollPct, setScrollPct] = useState(0);
  const articleRef = useRef<HTMLDivElement>(null);
  const beatRefs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    if (lesson) markLessonStarted(lesson.id);
  }, [lesson, markLessonStarted]);

  useEffect(() => {
    const focus = searchParams.get('focus');
    if (focus === null) return;
    const beatIndex = Number(focus);
    const target = beatRefs.current[beatIndex];
    if (target) {
      // เลื่อนให้เห็นหลัง header sticky เล็กน้อย
      const y = target.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson?.id]);

  useEffect(() => {
    function onScroll() {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      const pct = scrollable > 0 ? (doc.scrollTop / scrollable) * 100 : 100;
      setScrollPct(pct);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!lesson) return <Navigate to="/" replace />;

  return (
    <Layout>
      <div className="fixed inset-x-0 top-0 z-30">
        <ProgressBar value={scrollPct} className="rounded-none" />
      </div>

      <article ref={articleRef} className="prose-thai">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <CategoryBadge category={lesson.category} />
          <FormatBadge format={lesson.format} />
          <span className="text-sm text-ink/50 dark:text-paper/50">⏱ ~{lesson.estimatedMinutes} นาที</span>
          <button
            type="button"
            onClick={() => toggleBookmark(lesson.id)}
            className="ml-auto text-xl"
            aria-label={bookmarked ? 'เลิกบันทึก' : 'บันทึกบทนี้'}
            title={bookmarked ? 'เลิกบันทึก' : 'บันทึกบทนี้'}
          >
            {bookmarked ? '🔖' : '📑'}
          </button>
        </div>

        <h1 className="mb-2 text-2xl font-bold leading-snug">{lesson.title}</h1>
        <p className="mb-6 text-ink/60 dark:text-paper/60">{lesson.subtitle}</p>

        <p className="mb-8 text-lg leading-[1.9] text-ink/90 dark:text-paper/90">{lesson.hook}</p>

        {lesson.beats.map((beat, i) => {
          const isFocused = searchParams.get('focus') === String(i);
          return (
            <section
              key={i}
              ref={(el) => {
                beatRefs.current[i] = el;
              }}
              className={`mb-8 scroll-mt-20 rounded-xl2 transition-colors ${
                isFocused ? 'border border-edge/30 bg-edge/5 p-4' : ''
              }`}
            >
              <h2 className="mb-2 text-lg font-semibold">
                {beat.heading}
                {isFocused && <span className="ml-2 text-sm font-normal text-edge">← จุดที่ควรทบทวน</span>}
              </h2>
              <p className="leading-[1.9] text-ink/80 dark:text-paper/80">{beat.body}</p>
            </section>
          );
        })}

        <section className="card mb-8 p-5">
          <h2 className="mb-2 text-base font-semibold text-ink/70 dark:text-paper/70">📚 หลักฐาน</h2>
          <p className="leading-[1.85] text-ink/80 dark:text-paper/80">{lesson.evidence.summary}</p>
          {lesson.evidence.caveat && (
            <p className="mt-3 rounded-lg bg-ink/5 p-3 text-sm leading-relaxed text-ink/65 dark:bg-white/5 dark:text-paper/65">
              ⚠️ ข้อจำกัด: {lesson.evidence.caveat}
            </p>
          )}
          <ul className="mt-3 space-y-1 text-sm text-ink/55 dark:text-paper/55">
            {lesson.evidence.sources.map((s, i) => (
              <li key={i}>
                — {s.label}
                {s.year ? ` (${s.year})` : ''}
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">✅ ลองทำวันนี้</h2>
          <ul className="space-y-2">
            {lesson.tryToday.map((item, i) => (
              <li key={i} className="card flex gap-3 p-4 leading-relaxed text-ink/80 dark:text-paper/80">
                <span className="text-edge">{i + 1}.</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {lesson.ethicalNote && (
          <section className="mb-8 rounded-xl2 border border-cat-love/30 bg-cat-love/10 p-4 text-sm leading-relaxed text-ink/75 dark:text-paper/75">
            <span className="font-semibold text-cat-love">เส้นที่ไม่ควรข้าม: </span>
            {lesson.ethicalNote}
          </section>
        )}

        <section className="mb-10 rounded-xl2 bg-ink px-5 py-4 text-paper dark:bg-white/10">
          <p className="text-sm font-medium opacity-70">สรุป 1 ประโยค</p>
          <p className="text-lg font-semibold leading-snug">{lesson.keyTakeaway}</p>
        </section>

        <div className="flex justify-center pb-4">
          <Link to={`/lesson/${lesson.id}/quiz`} className="btn-primary w-full sm:w-auto">
            ทำควิซ 4 ข้อ →
          </Link>
        </div>
      </article>
    </Layout>
  );
}
