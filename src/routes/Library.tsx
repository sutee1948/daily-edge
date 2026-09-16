import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { LessonCard } from '@/components/LessonCard';
import { ALL_LESSONS } from '@/content';
import { CATEGORY_META } from '@/lib/categories';
import { lessonBodyText } from '@/lib/readingTime';
import type { Category } from '@/types/content';

const CATEGORY_LIST = Object.values(CATEGORY_META);

function matchesQuery(haystack: string[], query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return haystack.some((h) => h.toLowerCase().includes(q));
}

export function Library() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | 'all'>('all');
  const searchRef = useRef<HTMLInputElement>(null);

  // คีย์บอร์ดลัด: กด "/" ที่ไหนก็ได้ในหน้านี้เพื่อโฟกัสช่องค้นหาทันที
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const isTyping = target && ['INPUT', 'TEXTAREA'].includes(target.tagName);
      if (e.key === '/' && !isTyping) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const filtered = useMemo(() => {
    return ALL_LESSONS.filter((lesson) => {
      if (category !== 'all' && lesson.category !== category) return false;
      return matchesQuery([lesson.title, lesson.subtitle, ...lesson.tags, lessonBodyText(lesson)], query);
    });
  }, [query, category]);

  return (
    <Layout>
      <section className="mb-5">
        <h1 className="mb-1 text-2xl font-bold tracking-tight">คลังบททั้งหมด</h1>
        <div className="flex items-center justify-between">
          <p className="text-sm text-ink/65 dark:text-paper/65">{ALL_LESSONS.length} บท</p>
          <Link to="/bookmarks" className="text-sm font-medium text-edge">
            🔖 ที่บันทึกไว้
          </Link>
        </div>
      </section>

      <div className="mb-4">
        <input
          ref={searchRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='ค้นหาชื่อบท คำสำคัญ เช่น "ซุนวู" (กด / เพื่อโฟกัส)'
          aria-label="ค้นหาบทเรียน"
          className="w-full rounded-xl2 border border-ink/15 bg-paper-raised px-4 py-3 text-base outline-none focus:border-edge dark:border-white/15 dark:bg-white/5"
        />
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCategory('all')}
          className={`rounded-full px-3 py-1.5 text-sm transition ${
            category === 'all' ? 'bg-ink text-paper dark:bg-paper dark:text-ink' : 'bg-ink/5 text-ink/70 dark:bg-white/10 dark:text-paper/70'
          }`}
        >
          ทั้งหมด
        </button>
        {CATEGORY_LIST.map((meta) => (
          <button
            key={meta.id}
            type="button"
            onClick={() => setCategory(meta.id)}
            className={`rounded-full px-3 py-1.5 text-sm transition ${
              category === meta.id ? `${meta.bg} text-white` : 'bg-ink/5 text-ink/70 dark:bg-white/10 dark:text-paper/70'
            }`}
          >
            {meta.emoji} {meta.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-ink/65 dark:text-paper/65">ไม่พบบทที่ตรงกับคำค้นหา</p>
      ) : (
        <div className="grid gap-3">
          {filtered.map((lesson) => (
            <LessonCard key={lesson.id} lesson={lesson} />
          ))}
        </div>
      )}
    </Layout>
  );
}
