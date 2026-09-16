import type { Category, Lesson } from '@/types/content';

/**
 * ตรรกะตรวจเช็กลิสต์คุณภาพเนื้อหา (PLAN.md ข้อ 9 + docs/content-style-guide.md)
 * แยกออกมาเป็น pure function เพื่อให้ทั้ง scripts/validate-content.ts (CLI) และ
 * src/lib/contentValidation.test.ts (Vitest) เรียกใช้ตรรกะชุดเดียวกันได้
 *
 * error   = ต้องแก้ก่อน merge/build ผ่าน
 * warning = ควรตรวจสอบ แต่ไม่บล็อก build
 */

const WORD_MIN = 650;
const WORD_MAX = 850;
const MAX_MINUTES = 10;
const TRY_TODAY_MIN = 1;
const TRY_TODAY_MAX = 3;
const QUESTIONS_MIN = 8;
const QUESTIONS_MAX = 10;
const RELATED_MIN = 2;
const RELATED_MAX = 4;
const ETHICAL_NOTE_CATEGORIES: Category[] = ['read-people', 'relationships'];

const CATEGORY_BY_LETTER: Record<string, Category> = {
  a: 'china-strategy',
  b: 'read-people',
  c: 'people-mgmt',
  d: 'relationships',
  e: 'brain',
  f: 'self-dev',
  g: 'dev-career',
};

export interface Finding {
  level: 'error' | 'warning';
  lessonId: string;
  message: string;
}

function idLetter(id: string): string | undefined {
  return id.match(/^([a-g])\d/)?.[1];
}

function looksLikeDefinitionOpening(hook: string): boolean {
  const head = hook.trim().slice(0, 40);
  return /(คือ|หมายถึง)/.test(head);
}

function checkLesson(lesson: Lesson, allIds: Set<string>): Finding[] {
  const id = lesson.id;
  const findings: Finding[] = [];
  const err = (message: string) => findings.push({ level: 'error', lessonId: id, message });
  const warn = (message: string) => findings.push({ level: 'warning', lessonId: id, message });

  // --- เวลา/จำนวนคำ ---
  if (lesson.wordCount < WORD_MIN || lesson.wordCount > WORD_MAX) {
    err(`จำนวนคำ ${lesson.wordCount} อยู่นอกช่วง ${WORD_MIN}-${WORD_MAX} คำ`);
  }
  if (lesson.estimatedMinutes > MAX_MINUTES) {
    err(`estimatedMinutes ${lesson.estimatedMinutes} เกิน ${MAX_MINUTES} นาที`);
  }

  // --- hook ---
  if (looksLikeDefinitionOpening(lesson.hook)) {
    warn('hook อาจเปิดด้วยนิยาม ("...คือ..." ใกล้ต้นข้อความ) ลองเปิดด้วยเรื่องเล่า/คำถามแทน');
  }

  // --- beats ---
  if (lesson.beats.length !== 3) {
    err(`มี beats ${lesson.beats.length} ท่อน (ต้องการ 3 ท่อนตามโครงบทเรียน)`);
  }
  lesson.beats.forEach((b, i) => {
    if (!b.heading.trim() || !b.body.trim()) err(`beat ลำดับ ${i + 1} มี heading หรือ body ว่างเปล่า`);
  });

  // --- evidence ---
  if (lesson.evidence.sources.length === 0) {
    err('evidence.sources ว่างเปล่า ต้องมีอย่างน้อย 1 แหล่งอ้างอิง');
  }
  if (!lesson.evidence.caveat) {
    warn('ไม่มี evidence.caveat — ถ้างานวิจัยนี้มีข้อจำกัด/ข้อโต้แย้ง ควรใส่');
  }

  // --- tryToday ---
  if (lesson.tryToday.length < TRY_TODAY_MIN || lesson.tryToday.length > TRY_TODAY_MAX) {
    err(`tryToday มี ${lesson.tryToday.length} ข้อ (ต้องการ ${TRY_TODAY_MIN}-${TRY_TODAY_MAX} ข้อ)`);
  }

  // --- keyTakeaway ---
  if (!lesson.keyTakeaway.trim()) {
    err('keyTakeaway ว่างเปล่า');
  } else if (lesson.keyTakeaway.length > 160) {
    warn(`keyTakeaway ยาว ${lesson.keyTakeaway.length} ตัวอักษร ควรสั้นแค่ 1 ประโยค`);
  }

  // --- questions ---
  if (lesson.questions.length < QUESTIONS_MIN) {
    err(`มีคำถาม ${lesson.questions.length} ข้อ (ต้องการอย่างน้อย ${QUESTIONS_MIN} ข้อ)`);
  } else if (lesson.questions.length > QUESTIONS_MAX) {
    warn(`มีคำถาม ${lesson.questions.length} ข้อ (แนะนำไม่เกิน ${QUESTIONS_MAX} ข้อ)`);
  }

  const seenQIds = new Set<string>();
  const typeCounts: Record<string, number> = {};
  for (const q of lesson.questions) {
    typeCounts[q.type] = (typeCounts[q.type] ?? 0) + 1;

    if (seenQIds.has(q.id)) err(`คำถาม id ซ้ำกัน: ${q.id}`);
    seenQIds.add(q.id);

    if (q.options.length !== 4) {
      warn(`คำถาม ${q.id} มี ${q.options.length} ตัวเลือก (ปกติใช้ 4 ตัวเลือก)`);
    }

    const seenOptIds = new Set<string>();
    for (const opt of q.options) {
      if (seenOptIds.has(opt.id)) err(`คำถาม ${q.id} มีตัวเลือก id ซ้ำกัน: ${opt.id}`);
      seenOptIds.add(opt.id);
      if (!opt.explain.trim()) err(`คำถาม ${q.id} ตัวเลือก ${opt.id} ไม่มี explain`);
    }

    if (!q.options.some((o) => o.id === q.correctId)) {
      err(`คำถาม ${q.id} correctId "${q.correctId}" ไม่ตรงกับ id ของตัวเลือกใดเลย`);
    }

    if (q.targetBeat !== undefined && (q.targetBeat < 0 || q.targetBeat >= lesson.beats.length)) {
      err(`คำถาม ${q.id} targetBeat=${q.targetBeat} เกินขอบเขตจำนวน beats (${lesson.beats.length})`);
    }
  }
  if (!typeCounts.mcq) warn('คลังคำถามไม่มีข้อชนิด mcq เลย');
  if (!typeCounts.scenario) warn('คลังคำถามไม่มีข้อชนิด scenario เลย');

  // --- relatedIds ---
  if (lesson.relatedIds.length === 0) {
    err('relatedIds ว่างเปล่า');
  } else {
    if (lesson.relatedIds.length < RELATED_MIN || lesson.relatedIds.length > RELATED_MAX) {
      warn(`relatedIds มี ${lesson.relatedIds.length} รายการ (แนะนำ ${RELATED_MIN}-${RELATED_MAX} รายการ)`);
    }
    const selfLetter = idLetter(id);
    const hasCrossCategory = lesson.relatedIds.some((rid) => {
      const l = idLetter(rid);
      return l && l !== selfLetter;
    });
    if (!hasCrossCategory) {
      err('relatedIds ไม่มี id ข้ามหมวดเลย (ต้องมีอย่างน้อย 1 รายการที่ตัวอักษรนำหน้าต่างจากบทนี้)');
    }
    for (const rid of lesson.relatedIds) {
      if (rid === id) err('relatedIds อ้างอิงถึงตัวเองได้อย่างไร ตรวจสอบ id ซ้ำ');
      if (!allIds.has(rid) && !idLetter(rid)) {
        warn(`relatedIds "${rid}" ไม่ตรงรูปแบบ id มาตรฐาน (<ตัวอักษรหมวด><เลข2หลัก>-slug)`);
      }
    }
  }

  // --- ethicalNote ---
  if (ETHICAL_NOTE_CATEGORIES.includes(lesson.category) && !lesson.ethicalNote?.trim()) {
    err(`หมวด "${lesson.category}" ต้องมี ethicalNote`);
  }

  // --- id / category ต้องตรงกับ naming convention ---
  const letter = idLetter(id);
  if (!letter) {
    err('id ไม่ตรงรูปแบบมาตรฐาน (<ตัวอักษรหมวด><เลข2หลัก>-slug)');
  } else if (CATEGORY_BY_LETTER[letter] !== lesson.category) {
    err(`id ขึ้นต้นด้วย "${letter}" (คาดว่า category="${CATEGORY_BY_LETTER[letter]}") แต่ lesson.category="${lesson.category}"`);
  }

  // --- tags ---
  if (lesson.tags.length < 3) {
    warn(`มี tags แค่ ${lesson.tags.length} คำ (แนะนำ 4-6 คำ)`);
  }

  return findings;
}

export function validateLessons(lessons: Lesson[]): Finding[] {
  const allIds = new Set(lessons.map((l) => l.id));
  const idCounts = new Map<string, number>();
  const findings: Finding[] = [];

  for (const lesson of lessons) {
    idCounts.set(lesson.id, (idCounts.get(lesson.id) ?? 0) + 1);
    findings.push(...checkLesson(lesson, allIds));
  }
  for (const [id, count] of idCounts) {
    if (count > 1) findings.push({ level: 'error', lessonId: id, message: `id ซ้ำกัน ${count} ครั้งใน src/content` });
  }

  return findings;
}
