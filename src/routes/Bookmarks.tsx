import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { CategoryBadge } from '@/components/CategoryBadge';
import { getLesson } from '@/content';
import { useUserStore } from '@/store/useUserStore';
import type { Lesson } from '@/types/content';

function BookmarkCard({ lesson }: { lesson: Lesson }) {
  const note = useUserStore((s) => s.lessons[lesson.id]?.note ?? '');
  const setNote = useUserStore((s) => s.setNote);
  const toggleBookmark = useUserStore((s) => s.toggleBookmark);
  const [draft, setDraft] = useState(note);

  return (
    <div className="card p-4">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <CategoryBadge category={lesson.category} className="mb-2" />
          <Link to={`/lesson/${lesson.id}`} className="block text-base font-semibold leading-snug hover:underline">
            {lesson.title}
          </Link>
        </div>
        <button
          type="button"
          onClick={() => toggleBookmark(lesson.id)}
          className="shrink-0 text-lg"
          aria-label="เลิกบันทึก"
          title="เลิกบันทึก"
        >
          🔖
        </button>
      </div>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => setNote(lesson.id, draft)}
        placeholder="จดโน้ตส่วนตัวเกี่ยวกับบทนี้..."
        rows={2}
        className="w-full resize-none rounded-lg border border-ink/10 bg-paper px-3 py-2 text-sm outline-none focus:border-edge dark:border-white/10 dark:bg-white/5"
      />
    </div>
  );
}

export function Bookmarks() {
  const lessonsProgress = useUserStore((s) => s.lessons);
  const bookmarkedIds = Object.entries(lessonsProgress)
    .filter(([, p]) => p.bookmarked)
    .map(([id]) => id);
  const lessons = bookmarkedIds.map((id) => getLesson(id)).filter((l): l is Lesson => !!l);

  return (
    <Layout>
      <section className="mb-5">
        <h1 className="mb-1 text-2xl font-bold tracking-tight">🔖 ที่บันทึกไว้</h1>
        <p className="text-sm text-ink/50 dark:text-paper/50">{lessons.length} บท</p>
      </section>

      {lessons.length === 0 ? (
        <div className="py-10 text-center">
          <p className="mb-3 text-ink/50 dark:text-paper/50">ยังไม่มีบทที่บันทึกไว้</p>
          <Link to="/library" className="btn-secondary">
            ไปดูคลังบท
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {lessons.map((lesson) => (
            <BookmarkCard key={lesson.id} lesson={lesson} />
          ))}
        </div>
      )}
    </Layout>
  );
}
