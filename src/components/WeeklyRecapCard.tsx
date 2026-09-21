import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CategoryBadge } from '@/components/CategoryBadge';
import { getLessonMeta, loadLesson } from '@/content';
import { categoryOf } from '@/lib/categories';
import { todayISO } from '@/lib/date';
import { buildWeeklyRecap, isRecapEmpty, recapHeadline, shiftWeek, weekRangeOf, type WeeklyRecap } from '@/lib/weeklyRecap';
import { useUserStore } from '@/store/useUserStore';
import type { Lesson } from '@/types/content';

const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

function shortDate(iso: string): string {
  const [, m, d] = iso.split('-').map(Number);
  return `${d} ${THAI_MONTHS[m - 1]}`;
}

/** สรุปรายสัปดาห์แบบอ่านสนุก: ตัวเลขจริง + ประโยคเด็ดของบทที่เรียน + สิ่งที่ควรลอง/ทบทวน
 *  ประโยคเด็ดและ "ลองทำ" อยู่ในเนื้อหาเต็ม จึงโหลดแยกทีหลังเฉพาะบทของสัปดาห์นี้ (ไม่กี่บท)
 *  ตัวนี้เป็น container (ผูกกับ store + โหลดบท) ส่วนหน้าตาอยู่ที่ WeeklyRecapView ซึ่งรับ props ล้วนๆ */
export function WeeklyRecapCard({ initialOffset = 0 }: { initialOffset?: 0 | -1 }) {
  const lessonsProgress = useUserStore((s) => s.lessons);
  const [offset, setOffset] = useState<number>(initialOffset);
  const [fullLessons, setFullLessons] = useState<Record<string, Lesson>>({});

  const today = todayISO();
  const range = useMemo(() => shiftWeek(weekRangeOf(today), offset), [today, offset]);
  const recap = useMemo(() => buildWeeklyRecap(lessonsProgress, getLessonMeta, range), [lessonsProgress, range]);

  useEffect(() => {
    let cancelled = false;
    const ids = recap.completed.map((c) => c.id);
    Promise.all(ids.map((id) => loadLesson(id))).then((loaded) => {
      if (cancelled) return;
      const next: Record<string, Lesson> = {};
      for (const lesson of loaded) if (lesson) next[lesson.id] = lesson;
      setFullLessons(next);
    });
    return () => {
      cancelled = true;
    };
  }, [recap.completed]);

  return (
    <WeeklyRecapView
      recap={recap}
      fullLessons={fullLessons}
      offset={offset}
      onPrev={() => setOffset((o) => o - 1)}
      onNext={() => setOffset((o) => Math.min(0, o + 1))}
    />
  );
}

export function WeeklyRecapView({
  recap,
  fullLessons,
  offset,
  onPrev,
  onNext,
}: {
  recap: WeeklyRecap;
  fullLessons: Record<string, Lesson>;
  /** 0 = สัปดาห์นี้, -1 = สัปดาห์ที่แล้ว, ... */
  offset: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const { range } = recap;
  const empty = isRecapEmpty(recap);
  const isCurrentWeek = offset === 0;

  const tryLesson = recap.strongest ? fullLessons[recap.strongest.id] : recap.completed.length > 0 ? fullLessons[recap.completed[recap.completed.length - 1].id] : undefined;
  const tryItem = tryLesson?.tryToday[0];

  return (
    <section id="weekly" className="card mb-6 p-4" aria-labelledby="weekly-title">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h2 id="weekly-title" className="text-sm font-semibold text-ink/70 dark:text-paper/70">
            📰 สรุปประจำสัปดาห์
          </h2>
          <p className="text-xs text-ink/65 dark:text-paper/65">
            {shortDate(range.start)} – {shortDate(range.end)}
            {isCurrentWeek ? ' (สัปดาห์นี้)' : offset === -1 ? ' (สัปดาห์ที่แล้ว)' : ''}
          </p>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={onPrev}
            className="btn-ghost !px-3 !py-1.5 text-sm"
            aria-label="ดูสัปดาห์ก่อนหน้า"
          >
            ←
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={isCurrentWeek}
            className="btn-ghost !px-3 !py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="ดูสัปดาห์ถัดไป"
          >
            →
          </button>
        </div>
      </div>

      <p className="mb-4 text-sm leading-relaxed">{recapHeadline(recap, (c) => categoryOf(c).label)}</p>

      {!empty && (
        <div className="mb-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-ink/5 p-3 dark:bg-white/5">
            <p className="text-xl font-bold">{recap.completed.length}</p>
            <p className="text-xs text-ink/65 dark:text-paper/65">บทที่จบ</p>
          </div>
          <div className="rounded-xl bg-ink/5 p-3 dark:bg-white/5">
            <p className="text-xl font-bold">{recap.avgPercent === null ? '—' : `${recap.avgPercent}%`}</p>
            <p className="text-xs text-ink/65 dark:text-paper/65">ควิซเฉลี่ย</p>
          </div>
          <div className="rounded-xl bg-ink/5 p-3 dark:bg-white/5">
            <p className="text-xl font-bold">{recap.activeDays}/7</p>
            <p className="text-xs text-ink/65 dark:text-paper/65">วันที่เรียน</p>
          </div>
        </div>
      )}

      {recap.completed.length > 0 && (
        <div className="mb-4">
          <h3 className="mb-2 text-sm font-semibold">💡 ประโยคเด็ดที่ควรจำ</h3>
          <ul className="space-y-3">
            {recap.completed.map((c) => (
              <li key={c.id} className="text-sm leading-relaxed">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <CategoryBadge category={c.category} className="!px-2 !py-0.5 !text-xs" />
                  <Link to={`/lesson/${c.id}`} className="font-medium hover:underline">
                    {c.title}
                  </Link>
                </div>
                <p className="text-ink/75 dark:text-paper/75">
                  {fullLessons[c.id]?.keyTakeaway ?? <span className="text-ink/65 dark:text-paper/65">กำลังโหลด...</span>}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {recap.toRevisit && (
        <div className="mb-4 rounded-xl bg-ink/5 p-3 text-sm dark:bg-white/5">
          <p className="font-semibold">🔁 ควรทบทวนอีกรอบ</p>
          <p className="mt-1 text-ink/75 dark:text-paper/75">
            <Link to={`/lesson/${recap.toRevisit.id}`} className="font-medium underline decoration-dotted underline-offset-2">
              {recap.toRevisit.title}
            </Link>{' '}
            (ควิซ {recap.toRevisit.bestPercent}%) ลองอ่านบทสรุปแล้วทำควิซใหม่อีกครั้ง
          </p>
        </div>
      )}

      {tryItem && (
        <div className="rounded-xl bg-cat-growth/10 p-3 text-sm">
          <p className="font-semibold text-cat-growth">🎯 ลองทำในสัปดาห์หน้า</p>
          <p className="mt-1 leading-relaxed text-ink/80 dark:text-paper/80">{tryItem}</p>
        </div>
      )}
    </section>
  );
}
