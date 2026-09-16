/**
 * ตรวจเช็กลิสต์คุณภาพเนื้อหา (PLAN.md ข้อ 9 + docs/content-style-guide.md)
 * รันด้วย: npm run validate-content (และรันอัตโนมัติเป็นส่วนหนึ่งของ npm run build)
 * ตรรกะจริงอยู่ที่ src/lib/contentValidation.ts (เรียกใช้ร่วมกับ Vitest ที่
 * src/lib/contentValidation.test.ts ด้วย) ไฟล์นี้เป็นแค่ตัวรันบน CLI + พิมพ์ผล
 */
import { ALL_LESSONS } from '../src/content/index';
import { validateLessons } from '../src/lib/contentValidation';

function run() {
  const findings = validateLessons(ALL_LESSONS);
  const errors = findings.filter((f) => f.level === 'error');
  const warnings = findings.filter((f) => f.level === 'warning');

  console.log(`ตรวจ ${ALL_LESSONS.length} บท — พบ ${errors.length} error, ${warnings.length} warning\n`);

  for (const f of [...errors, ...warnings]) {
    const tag = f.level === 'error' ? '✗ ERROR  ' : '⚠ WARNING';
    console.log(`${tag} [${f.lessonId}] ${f.message}`);
  }

  if (errors.length > 0) {
    console.log(`\nไม่ผ่าน: มี ${errors.length} error ที่ต้องแก้ก่อน\n`);
    process.exit(1);
  }

  console.log('\nผ่านเกณฑ์บังคับทั้งหมด ✅');
}

run();
