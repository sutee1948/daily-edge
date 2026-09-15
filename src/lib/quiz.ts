import type { Question } from '@/types/content';

export const QUESTIONS_PER_ROUND = 4;

/** สุ่มลำดับอาร์เรย์ (Fisher–Yates) แบบไม่แก้ต้นฉบับ */
export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** สุ่มคำถาม N ข้อจากคลังของบทเรียน — ใช้ทั้งตอนเริ่มควิซและตอนกด "ทำข้อสอบใหม่"
 *  ถ้าใส่ avoidExactIds (ชุดข้อของรอบก่อนหน้า) มา และบังเอิญสุ่มได้ชุดเดียวกันเป๊ะ
 *  จะสลับหนึ่งข้อออกเพื่อการันตีว่ารอบใหม่ไม่ซ้ำรอบก่อนแน่นอน (เมื่อคลังมีมากกว่าจำนวนที่สุ่ม) */
export function pickQuizQuestions(bank: Question[], count = QUESTIONS_PER_ROUND, avoidExactIds?: string[]): Question[] {
  const n = Math.min(count, bank.length);
  let picked = shuffle(bank).slice(0, n);

  if (avoidExactIds && avoidExactIds.length === n && bank.length > n) {
    const avoidSet = new Set(avoidExactIds);
    const isSameSet = picked.every((q) => avoidSet.has(q.id));
    if (isSameSet) {
      const pickedIds = new Set(picked.map((q) => q.id));
      const remainder = bank.filter((q) => !pickedIds.has(q.id));
      const swapIn = remainder[Math.floor(Math.random() * remainder.length)];
      picked = [...picked.slice(0, -1), swapIn];
    }
  }

  return shuffle(picked);
}

export interface QuizResult {
  score: number;
  total: number;
  wrongQIds: string[];
  /** ป้ายผลลัพธ์ตามเกณฑ์ PLAN.md ข้อ 5.3 */
  band: 'mastered' | 'passed' | 'shaky';
}

export function scoreQuiz(questions: Question[], answers: Record<string, string>): QuizResult {
  let score = 0;
  const wrongQIds: string[] = [];

  for (const q of questions) {
    if (answers[q.id] === q.correctId) {
      score += 1;
    } else {
      wrongQIds.push(q.id);
    }
  }

  const total = questions.length;
  const band: QuizResult['band'] = score === total ? 'mastered' : score / total >= 0.75 ? 'passed' : 'shaky';

  return { score, total, wrongQIds, band };
}
