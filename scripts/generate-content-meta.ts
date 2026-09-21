/**
 * สร้าง src/content/meta.generated.ts จากไฟล์บทเรียนทุกไฟล์ (รัน: npm run gen-content)
 *
 * เหตุผล: บันเดิลหลักของแอปต้องมีแค่ "ข้อมูลเบา" ของทุกบท (ชื่อ/หมวด/แท็ก/hook/เวลาอ่าน ฯลฯ)
 * ส่วนเนื้อหาเต็มของแต่ละบทโหลดแยกตามบทเมื่อเปิดอ่านจริง — ไม่งั้นพอมี 70 บท
 * เนื้อหาทั้งหมดจะไปกองอยู่ในบันเดิลหลักและทำให้หน้าแรกโหลดช้าลงมาก
 *
 * ไฟล์ที่สร้างต้อง commit เข้า repo เสมอ และ src/content/meta.test.ts จะเช็กว่าไม่ล้าสมัย
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAllLessonSources } from './contentFiles';
import { resolveLesson, toMeta } from '../src/lib/readingTime';

async function main() {
  const sources = await loadAllLessonSources();
  const metas = sources.map((s) => toMeta(resolveLesson(s)));

  const out = `// ⚠️ ไฟล์นี้สร้างอัตโนมัติจาก scripts/generate-content-meta.ts — ห้ามแก้มือ
// แก้เนื้อหาที่ src/content/<หมวด>/<รหัส>.ts แล้วรัน \`npm run gen-content\`
import type { LessonMeta } from '@/types/content';

export const LESSON_METAS: LessonMeta[] = ${JSON.stringify(metas, null, 2)};
`;

  const target = resolve(fileURLToPath(new URL('.', import.meta.url)), '../src/content/meta.generated.ts');
  writeFileSync(target, out, 'utf8');
  console.log(`สร้าง meta.generated.ts จาก ${metas.length} บท`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
