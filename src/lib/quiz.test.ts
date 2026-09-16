import { describe, it, expect } from 'vitest';
import { shuffle, pickQuizQuestions, scoreQuiz, QUESTIONS_PER_ROUND } from '@/lib/quiz';
import type { Question } from '@/types/content';

function makeQuestion(id: string): Question {
  return {
    id,
    type: 'mcq',
    difficulty: 1,
    prompt: `prompt ${id}`,
    options: [
      { id: 'a', text: 'a', explain: 'a' },
      { id: 'b', text: 'b', explain: 'b' },
      { id: 'c', text: 'c', explain: 'c' },
      { id: 'd', text: 'd', explain: 'd' },
    ],
    correctId: 'a',
  };
}

const BANK = Array.from({ length: 8 }, (_, i) => makeQuestion(`q${i + 1}`));

describe('shuffle', () => {
  it('returns every original element exactly once, without mutating the input', () => {
    const original = [1, 2, 3, 4, 5];
    const copy = [...original];
    const result = shuffle(original);
    expect(original).toEqual(copy); // ต้นฉบับต้องไม่ถูกแก้
    expect(result.slice().sort()).toEqual(original.slice().sort());
    expect(result).toHaveLength(original.length);
  });
});

describe('pickQuizQuestions', () => {
  it('defaults to QUESTIONS_PER_ROUND questions from the bank', () => {
    const picked = pickQuizQuestions(BANK);
    expect(picked).toHaveLength(QUESTIONS_PER_ROUND);
  });

  it('never picks duplicate questions within one round', () => {
    const picked = pickQuizQuestions(BANK, 4);
    const ids = picked.map((q) => q.id);
    expect(new Set(ids).size).toBe(4);
  });

  it('caps the count at the bank size if the bank is smaller than requested', () => {
    const smallBank = BANK.slice(0, 2);
    const picked = pickQuizQuestions(smallBank, 4);
    expect(picked).toHaveLength(2);
  });

  it('guarantees a different set than avoidExactIds when the bank allows it', () => {
    // รันหลายรอบเพราะการสุ่มมีโอกาสได้ชุดเดิมโดยบังเอิญ ฟังก์ชันต้องสลับให้ต่างเสมอ
    for (let i = 0; i < 30; i++) {
      const first = pickQuizQuestions(BANK, 4);
      const firstIds = first.map((q) => q.id).sort();
      const second = pickQuizQuestions(BANK, 4, firstIds);
      const secondIds = second.map((q) => q.id).sort();
      expect(secondIds).not.toEqual(firstIds);
    }
  });

  it('leaves the set unchanged when avoidExactIds does not match (no forced swap needed)', () => {
    // ถ้า avoidExactIds ยาวไม่เท่ากับจำนวนที่สุ่ม ไม่ควรมีผลอะไร (เงื่อนไข length match ไม่ตรง)
    const picked = pickQuizQuestions(BANK, 4, ['q1']);
    expect(picked).toHaveLength(4);
  });
});

describe('scoreQuiz', () => {
  const questions = BANK.slice(0, 4);

  it('scores a perfect run as mastered', () => {
    const answers = Object.fromEntries(questions.map((q) => [q.id, q.correctId]));
    const result = scoreQuiz(questions, answers);
    expect(result).toMatchObject({ score: 4, total: 4, band: 'mastered', wrongQIds: [] });
  });

  it('scores 3/4 (75%) as passed', () => {
    const answers = Object.fromEntries(questions.map((q, i) => [q.id, i === 0 ? 'b' : q.correctId]));
    const result = scoreQuiz(questions, answers);
    expect(result.score).toBe(3);
    expect(result.band).toBe('passed');
    expect(result.wrongQIds).toEqual([questions[0].id]);
  });

  it('scores 2/4 (50%) as shaky', () => {
    const answers = Object.fromEntries(questions.map((q, i) => [q.id, i < 2 ? 'b' : q.correctId]));
    const result = scoreQuiz(questions, answers);
    expect(result.score).toBe(2);
    expect(result.band).toBe('shaky');
  });

  it('treats an unanswered question as wrong', () => {
    const answers: Record<string, string> = {};
    const result = scoreQuiz(questions, answers);
    expect(result.score).toBe(0);
    expect(result.wrongQIds).toHaveLength(4);
  });
});
