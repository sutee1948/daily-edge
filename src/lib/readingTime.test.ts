import { describe, it, expect } from 'vitest';
import { estimateWordCount, computeReadingStats } from '@/lib/readingTime';
import { ALL_LESSONS } from '@/content';
import type { LessonSource } from '@/types/content';

describe('estimateWordCount', () => {
  it('counts English words by whitespace', () => {
    expect(estimateWordCount('one two three four five')).toBe(5);
  });

  it('estimates Thai word count via the average-word-length heuristic (~4.5 chars/word)', () => {
    // ทดสอบด้วยข้อความไทยล้วน 45 ตัวอักษร (ไม่รวมช่องว่าง) ควรประมาณได้ ~10 คำ
    const thaiText = 'ทดสอบการประมาณจำนวนคำภาษาไทยจากความยาวของข้อความที่พิมพ์เข้ามา';
    const count = estimateWordCount(thaiText);
    expect(count).toBeGreaterThan(5);
    expect(count).toBeLessThan(30);
  });

  it('handles mixed Thai and English text', () => {
    const count = estimateWordCount('สวัสดี hello world ทดสอบ');
    expect(count).toBeGreaterThan(0);
  });

  it('returns 0 for empty input', () => {
    expect(estimateWordCount('')).toBe(0);
    expect(estimateWordCount('   ')).toBe(0);
  });
});

describe('computeReadingStats', () => {
  function makeSource(bodyWords: number): LessonSource {
    const words = Array.from({ length: bodyWords }, (_, i) => `word${i}`).join(' ');
    return {
      id: 'a01-test',
      title: 't',
      subtitle: 's',
      category: 'china-strategy',
      format: 'classic',
      difficulty: 1,
      tags: [],
      hook: words,
      beats: [
        { heading: 'h', body: '' },
        { heading: 'h', body: '' },
        { heading: 'h', body: '' },
      ],
      evidence: { summary: '', sources: [] },
      tryToday: [],
      keyTakeaway: '',
      relatedIds: [],
      questions: [],
    };
  }

  it('scales estimated minutes up with word count', () => {
    const short = computeReadingStats(makeSource(100));
    const long = computeReadingStats(makeSource(800));
    expect(long.estimatedMinutes).toBeGreaterThan(short.estimatedMinutes);
  });

  it('never returns less than 1 minute even for near-empty content', () => {
    expect(computeReadingStats(makeSource(0)).estimatedMinutes).toBeGreaterThanOrEqual(1);
  });
});

describe('every published lesson stays within the 10-minute promise', () => {
  it('has estimatedMinutes <= 10 for all lessons', () => {
    for (const lesson of ALL_LESSONS) {
      expect(lesson.estimatedMinutes, `${lesson.id} estimated at ${lesson.estimatedMinutes}min`).toBeLessThanOrEqual(10);
    }
  });

  it('has wordCount within the 650-850 target band for all lessons', () => {
    for (const lesson of ALL_LESSONS) {
      expect(lesson.wordCount, `${lesson.id} has ${lesson.wordCount} words`).toBeGreaterThanOrEqual(650);
      expect(lesson.wordCount, `${lesson.id} has ${lesson.wordCount} words`).toBeLessThanOrEqual(850);
    }
  });
});
