/**
 * ตัวช่วยสำหรับสคริปต์ที่รันบน Node (tsx) — อ่านไฟล์บทเรียนทุกไฟล์ใต้ src/content/<หมวด>/<รหัส>.ts
 * (แอปเองไม่ใช้ตัวนี้ แอปใช้ import.meta.glob ของ Vite ใน src/content/index.ts)
 *
 * ข้อตกลงของไฟล์บทเรียน: หนึ่งไฟล์ export ค่า LessonSource "ตัวเดียว"
 */
import { readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { LessonSource } from '../src/types/content';

export const CONTENT_DIR = resolve(fileURLToPath(new URL('.', import.meta.url)), '../src/content');

const LESSON_FILE_RE = /^[a-g]\d{2}\.ts$/;

export function listLessonFiles(): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(CONTENT_DIR)) {
    const dir = join(CONTENT_DIR, entry);
    if (!statSync(dir).isDirectory()) continue;
    for (const file of readdirSync(dir)) {
      if (LESSON_FILE_RE.test(file)) files.push(join(dir, file));
    }
  }
  return files.sort();
}

export async function loadAllLessonSources(): Promise<LessonSource[]> {
  const sources: LessonSource[] = [];
  for (const file of listLessonFiles()) {
    const mod = (await import(pathToFileURL(file).href)) as Record<string, LessonSource>;
    const exported = Object.values(mod);
    if (exported.length !== 1) {
      throw new Error(`${file}: ต้อง export บทเรียนตัวเดียวเท่านั้น (พบ ${exported.length} ตัว)`);
    }
    sources.push(exported[0]);
  }
  return sources.sort((a, b) => a.id.localeCompare(b.id));
}
