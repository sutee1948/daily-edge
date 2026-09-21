/**
 * ⚠️ ใช้เฉพาะใน unit test — ห้าม import จากโค้ดของแอป
 * รวมเนื้อหาเต็มของทุกบทแบบ eager (ตรงข้ามกับ src/content/index.ts ที่โหลดทีละบท) เพื่อให้เทสต์
 * ตรวจคุณภาพ/ความสอดคล้องกับ meta ได้ในครั้งเดียว ถ้าแอปดึงไฟล์นี้เข้าไป บันเดิลจะบวมกลับไปเหมือนเดิม
 */
import type { Lesson, LessonSource } from '@/types/content';
import { resolveLesson } from '@/lib/readingTime';

const modules = import.meta.glob<Record<string, LessonSource>>('./*/*.ts', { eager: true });

export const ALL_LESSONS_EAGER: Lesson[] = Object.values(modules)
  .map((mod) => resolveLesson(Object.values(mod)[0]))
  .sort((a, b) => a.id.localeCompare(b.id));
