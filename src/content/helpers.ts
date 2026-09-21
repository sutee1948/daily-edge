import type { Difficulty, Question, QuestionType } from '@/types/content';

/** [ข้อความตัวเลือก, คำอธิบายว่าทำไมถูก/ผิด] — ทุกตัวเลือกต้องมีคำอธิบาย (ตามเช็กลิสต์คุณภาพ) */
type Opt = [text: string, explain: string];

const OPTION_IDS = ['a', 'b', 'c', 'd'] as const;

/** ตัวช่วยเขียนคำถามควิซให้สั้นลง — ได้โครงข้อมูล Question เดียวกับที่เขียนมือ (ตัวเลือก 4 ข้อ id a-d) */
export function q(
  id: string,
  type: QuestionType,
  difficulty: Difficulty,
  targetBeat: number | undefined,
  prompt: string,
  options: [Opt, Opt, Opt, Opt],
  correctId: 'a' | 'b' | 'c' | 'd',
): Question {
  return {
    id,
    type,
    difficulty,
    ...(targetBeat === undefined ? {} : { targetBeat }),
    prompt,
    options: options.map(([text, explain], i) => ({ id: OPTION_IDS[i], text, explain })),
    correctId,
  };
}
