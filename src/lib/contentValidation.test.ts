import { describe, it, expect } from 'vitest';
import { validateLessons } from '@/lib/contentValidation';
import { ALL_LESSONS_EAGER as ALL_LESSONS } from '@/content/testing';
import type { Lesson } from '@/types/content';

function baseLesson(overrides: Partial<Lesson> = {}): Lesson {
  return {
    id: 'a01-valid-lesson',
    title: 't',
    subtitle: 's',
    category: 'china-strategy',
    format: 'classic',
    difficulty: 1,
    tags: ['one', 'two', 'three'],
    hook: 'a hook that does not open with a definition',
    beats: [
      { heading: 'h1', body: 'b1' },
      { heading: 'h2', body: 'b2' },
      { heading: 'h3', body: 'b3' },
    ],
    evidence: { summary: 'summary', caveat: 'caveat', sources: [{ label: 'src' }] },
    tryToday: ['do this'],
    keyTakeaway: 'the takeaway',
    relatedIds: ['a02-other', 'b01-cross-category'],
    questions: Array.from({ length: 8 }, (_, i) => ({
      id: `a01-q${i}`,
      type: (i % 2 === 0 ? 'mcq' : 'scenario') as 'mcq' | 'scenario',
      difficulty: 1 as const,
      prompt: `question ${i}`,
      options: [
        { id: 'a', text: 'a', explain: 'why a' },
        { id: 'b', text: 'b', explain: 'why b' },
        { id: 'c', text: 'c', explain: 'why c' },
        { id: 'd', text: 'd', explain: 'why d' },
      ],
      correctId: 'a',
      targetBeat: 0,
    })),
    wordCount: 700,
    estimatedMinutes: 8,
    ...overrides,
  };
}

describe('validateLessons — a well-formed lesson produces zero findings', () => {
  it('passes cleanly', () => {
    const findings = validateLessons([baseLesson()]);
    expect(findings).toEqual([]);
  });
});

describe('validateLessons — catches each hard-error rule', () => {
  it('flags word count outside 650-850', () => {
    const findings = validateLessons([baseLesson({ wordCount: 400 })]);
    expect(findings.some((f) => f.level === 'error' && /จำนวนคำ/.test(f.message))).toBe(true);
  });

  it('flags estimatedMinutes over 10', () => {
    const findings = validateLessons([baseLesson({ estimatedMinutes: 12 })]);
    expect(findings.some((f) => f.level === 'error' && /เกิน 10 นาที/.test(f.message))).toBe(true);
  });

  it('flags a lesson with fewer than 8 questions', () => {
    const findings = validateLessons([baseLesson({ questions: baseLesson().questions.slice(0, 3) })]);
    expect(findings.some((f) => f.level === 'error' && /มีคำถาม/.test(f.message))).toBe(true);
  });

  it('flags an option with no explain text', () => {
    const lesson = baseLesson();
    lesson.questions[0].options[0].explain = '';
    const findings = validateLessons([lesson]);
    expect(findings.some((f) => f.level === 'error' && /ไม่มี explain/.test(f.message))).toBe(true);
  });

  it('flags a correctId that does not match any option', () => {
    const lesson = baseLesson();
    lesson.questions[0].correctId = 'zzz';
    const findings = validateLessons([lesson]);
    expect(findings.some((f) => f.level === 'error' && /correctId/.test(f.message))).toBe(true);
  });

  it('flags relatedIds with no cross-category entry', () => {
    const findings = validateLessons([baseLesson({ relatedIds: ['a02-same-category-only'] })]);
    expect(findings.some((f) => f.level === 'error' && /ข้ามหมวด/.test(f.message))).toBe(true);
  });

  it('flags missing ethicalNote for read-people / relationships categories', () => {
    const findings = validateLessons([baseLesson({ id: 'b01-needs-note', category: 'read-people' })]);
    expect(findings.some((f) => f.level === 'error' && /ethicalNote/.test(f.message))).toBe(true);
  });

  it('passes read-people/relationships lessons that do include an ethicalNote', () => {
    const findings = validateLessons([
      baseLesson({ id: 'b01-has-note', category: 'read-people', ethicalNote: 'be careful' }),
    ]);
    expect(findings.filter((f) => f.level === 'error')).toEqual([]);
  });

  it('flags an id/category mismatch against the naming convention', () => {
    const findings = validateLessons([baseLesson({ id: 'a01-mismatch', category: 'brain' })]);
    expect(findings.some((f) => f.level === 'error' && /id ขึ้นต้นด้วย/.test(f.message))).toBe(true);
  });

  it('flags duplicate lesson ids across the content set', () => {
    const findings = validateLessons([baseLesson(), baseLesson()]);
    expect(findings.some((f) => f.level === 'error' && /id ซ้ำกัน/.test(f.message))).toBe(true);
  });

  it('flags a lesson that does not have exactly 3 beats', () => {
    const findings = validateLessons([baseLesson({ beats: [{ heading: 'h', body: 'b' }] })]);
    expect(findings.some((f) => f.level === 'error' && /beats/.test(f.message))).toBe(true);
  });
});

describe('validateLessons — soft warnings do not block (still reported, but not level "error")', () => {
  it('warns (not errors) when evidence.caveat is missing', () => {
    const lesson = baseLesson();
    delete (lesson.evidence as { caveat?: string }).caveat;
    const findings = validateLessons([lesson]);
    const caveatFinding = findings.find((f) => /caveat/.test(f.message));
    expect(caveatFinding?.level).toBe('warning');
  });
});

describe('validateLessons — the real published content library', () => {
  it('has zero errors across every lesson currently in src/content', () => {
    const findings = validateLessons(ALL_LESSONS);
    const errors = findings.filter((f) => f.level === 'error');
    expect(errors, JSON.stringify(errors, null, 2)).toEqual([]);
  });
});
