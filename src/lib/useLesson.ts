import { useEffect, useState } from 'react';
import type { Lesson } from '@/types/content';
import { getCachedLesson, loadLesson } from '@/content';

/** โหลดเนื้อหาเต็มของบทตาม id — ถ้าเคยโหลดแล้วจะได้ค่าทันทีตั้งแต่ render แรก (ไม่กะพริบ) */
export function useLesson(id: string | undefined): { lesson: Lesson | undefined; loading: boolean; missing: boolean } {
  const [state, setState] = useState<{ id?: string; lesson?: Lesson; done: boolean }>(() => ({
    id,
    lesson: id ? getCachedLesson(id) : undefined,
    done: !!id && !!getCachedLesson(id),
  }));

  useEffect(() => {
    if (!id) return;
    const cached = getCachedLesson(id);
    if (cached) {
      setState({ id, lesson: cached, done: true });
      return;
    }
    let cancelled = false;
    setState({ id, lesson: undefined, done: false });
    loadLesson(id).then((lesson) => {
      if (!cancelled) setState({ id, lesson, done: true });
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  // state อาจยังเป็นของ id เก่าหนึ่ง render ระหว่างเปลี่ยนบท — ถือว่ายังโหลดอยู่
  const current = state.id === id ? state : { lesson: undefined, done: false };
  return { lesson: current.lesson, loading: !current.done, missing: current.done && !current.lesson };
}
