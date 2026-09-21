/** พิมพ์สถิติรายบท (จำนวนคำ/นาที/จำนวนคำถาม/format) — ใช้ตรวจว่าใกล้ขอบช่วง 650-850 คำหรือไม่: npm run stats */
import { loadAllLessonSources } from './contentFiles';
import { resolveLesson } from '../src/lib/readingTime';

async function main() {
  const lessons = (await loadAllLessonSources()).map(resolveLesson);
  for (const l of lessons) {
    const flag = l.wordCount < 670 || l.wordCount > 830 ? '  <-- ใกล้ขอบช่วง' : '';
    console.log(`${l.id.padEnd(44)} ${String(l.wordCount).padStart(4)} คำ  ${l.estimatedMinutes}น.  ${l.format.padEnd(9)} d${l.difficulty}  q=${l.questions.length}${flag}`);
  }
}
main();
