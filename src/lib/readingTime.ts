import type { Lesson, LessonSource } from '@/types/content';

// ภาษาไทยไม่มีช่องว่างคั่นคำ จึงนับ "คำ" แบบประมาณการ:
// ความยาวคำไทยเฉลี่ย ~4.5 ตัวอักษร/คำ (อ้างอิงสถิติคลังคำทั่วไป)
const AVG_THAI_WORD_LEN = 4.5;
// อัตราการอ่านแบบตั้งใจ (ไม่ใช่กวาดตา) ต่ำกว่าอัตราอ่านเร็วทั่วไปเล็กน้อย
const READING_WPM = 130;
// เวลาคงที่สำหรับ "ลองทำวันนี้" + ทำควิซ + อ่านเฉลย (นาที)
const FIXED_OVERHEAD_MIN = 3;

const THAI_CHAR_RE = /[฀-๿]/g;

/** ประมาณจำนวนคำจากข้อความ (รองรับข้อความผสมไทย/อังกฤษ) */
export function estimateWordCount(text: string): number {
  const thaiChars = text.match(THAI_CHAR_RE)?.length ?? 0;
  const nonThaiText = text.replace(THAI_CHAR_RE, ' ');
  const nonThaiWords = nonThaiText
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean).length;

  return Math.round(thaiChars / AVG_THAI_WORD_LEN) + nonThaiWords;
}

/** รวมข้อความทุกส่วนของบทเรียนที่ผู้เรียน "อ่าน" จริง (ไม่รวมคำถามควิซ) */
export function lessonBodyText(lesson: LessonSource): string {
  const parts = [
    lesson.hook,
    ...lesson.beats.flatMap((b) => [b.heading, b.body]),
    lesson.evidence.summary,
    lesson.evidence.caveat ?? '',
    ...lesson.tryToday,
    lesson.keyTakeaway,
    lesson.ethicalNote ?? '',
  ];
  return parts.join('\n');
}

export function computeReadingStats(lesson: LessonSource): Pick<Lesson, 'wordCount' | 'estimatedMinutes'> {
  const wordCount = estimateWordCount(lessonBodyText(lesson));
  const estimatedMinutes = Math.max(1, Math.round(wordCount / READING_WPM + FIXED_OVERHEAD_MIN));
  return { wordCount, estimatedMinutes };
}

export function resolveLesson(source: LessonSource): Lesson {
  return { ...source, ...computeReadingStats(source) };
}
