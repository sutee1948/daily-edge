import type { Lesson, LessonMeta, LessonSource } from '@/types/content';
import { resolveLesson } from '@/lib/readingTime';
import { LESSON_METAS } from './meta.generated';

/**
 * เนื้อหาแบ่งเป็น 2 ชั้น เพื่อไม่ให้บันเดิลหลักบวมเมื่อจำนวนบทเพิ่มเป็นหลักสิบ:
 *  1) meta  — ข้อมูลเบาของทุกบท อยู่ในบันเดิลหลักตลอด (สร้างอัตโนมัติ ดู scripts/generate-content-meta.ts)
 *  2) lesson เต็ม — โหลดแยกตามบทด้วย dynamic import เมื่อเปิดอ่าน/ทำควิซ (Vite แยกเป็น chunk ต่อบทให้เอง)
 */

export const ALL_LESSON_METAS: LessonMeta[] = LESSON_METAS;

const META_MAP: Map<string, LessonMeta> = new Map(LESSON_METAS.map((m) => [m.id, m]));

export function getLessonMeta(id: string): LessonMeta | undefined {
  return META_MAP.get(id);
}

// import.meta.glob สร้าง dynamic import ให้ทุกไฟล์ใต้ src/content/<หมวด>/<รหัส>.ts (ไม่รวม index/meta ที่อยู่ชั้นบน)
const lessonModules = import.meta.glob<Record<string, LessonSource>>('./*/*.ts');

const loaderByCode = new Map<string, () => Promise<Record<string, LessonSource>>>();
for (const [path, loader] of Object.entries(lessonModules)) {
  const code = path.match(/\/([a-g]\d{2})\.ts$/)?.[1];
  if (code) loaderByCode.set(code, loader);
}

const lessonCache = new Map<string, Lesson>();
const inflight = new Map<string, Promise<Lesson | undefined>>();

/** คืนบทที่โหลดไว้แล้วแบบทันที (ไม่ต้องรอ) หรือ undefined ถ้ายังไม่เคยโหลด */
export function getCachedLesson(id: string): Lesson | undefined {
  return lessonCache.get(id);
}

export function loadLesson(id: string): Promise<Lesson | undefined> {
  const cached = lessonCache.get(id);
  if (cached) return Promise.resolve(cached);

  const running = inflight.get(id);
  if (running) return running;

  const code = id.match(/^([a-g]\d{2})-/)?.[1];
  const loader = code ? loaderByCode.get(code) : undefined;
  if (!loader) return Promise.resolve(undefined);

  const promise = loader()
    .then((mod) => {
      const source = Object.values(mod)[0];
      const lesson = resolveLesson(source);
      lessonCache.set(id, lesson);
      return lesson;
    })
    .finally(() => inflight.delete(id));

  inflight.set(id, promise);
  return promise;
}

/** โหลดเนื้อหาเต็มทุกบท — ใช้เฉพาะตอนต้องค้นข้อความเต็ม (หน้าคลังบท) เพราะเป็นการดึงทุก chunk */
export function loadAllLessons(): Promise<Lesson[]> {
  return Promise.all(LESSON_METAS.map((m) => loadLesson(m.id))).then((list) =>
    list.filter((l): l is Lesson => !!l),
  );
}
