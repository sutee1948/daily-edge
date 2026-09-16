import { describe, it, expect } from 'vitest';
import { rankCandidates, pickTodayLesson } from '@/lib/dailyPicker';
import type { Category, Lesson, LessonFormat } from '@/types/content';
import type { UserState } from '@/types/user';
import { initialStreak } from '@/lib/streak';

function makeLesson(id: string, category: Category, format: LessonFormat, difficulty: 1 | 2 | 3 = 1): Lesson {
  return {
    id,
    title: id,
    subtitle: id,
    category,
    format,
    difficulty,
    tags: [],
    hook: 'hook',
    beats: [
      { heading: 'h1', body: 'b1' },
      { heading: 'h2', body: 'b2' },
      { heading: 'h3', body: 'b3' },
    ],
    evidence: { summary: 's', sources: [{ label: 'src' }] },
    tryToday: ['do it'],
    keyTakeaway: 'takeaway',
    relatedIds: [],
    questions: [],
    wordCount: 700,
    estimatedMinutes: 8,
  };
}

function freshUser(overrides: Partial<UserState> = {}): UserState {
  return {
    version: 3,
    streak: initialStreak(),
    lessons: {},
    dailyPick: null,
    pickHistory: [],
    reviewQueue: [],
    settings: { theme: 'system', fontScale: 1 },
    ...overrides,
  };
}

const LESSONS: Lesson[] = [
  makeLesson('a-story', 'china-strategy', 'story'),
  makeLesson('b-classic', 'read-people', 'classic'),
  makeLesson('c-classic', 'people-mgmt', 'classic'),
  makeLesson('d-mythbust', 'relationships', 'myth-bust'),
];

describe('rankCandidates', () => {
  it('with no history, does not crash and returns every lesson', () => {
    const ranked = rankCandidates(LESSONS, freshUser(), '2026-01-01');
    expect(ranked).toHaveLength(LESSONS.length);
  });

  it('penalizes repeating yesterday\'s category below same-difficulty alternatives', () => {
    const user = freshUser({ pickHistory: [{ date: '2026-01-01', lessonId: 'a-story' }] });
    const ranked = rankCandidates(LESSONS, user, '2026-01-02');
    // a-story (china-strategy, ซ้ำหมวดเมื่อวาน) ไม่ควรอยู่อันดับ 1
    expect(ranked[0].id).not.toBe('a-story');
  });

  it('penalizes repeating yesterday\'s format even across a different category', () => {
    const onlyStoryVsClassic: Lesson[] = [makeLesson('x-story', 'brain', 'story'), makeLesson('y-classic', 'self-dev', 'classic')];
    const user = freshUser({ pickHistory: [{ date: '2026-01-01', lessonId: 'a-story' }] }); // เมื่อวานเป็น format story
    // ใส่ a-story เข้าไปในพูลด้วยเพื่อให้ history อ้างอิงถึงได้
    const pool = [...onlyStoryVsClassic, LESSONS[0]];
    const ranked = rankCandidates(pool, user, '2026-01-02').filter((l) => l.id !== 'a-story');
    expect(ranked[0].id).toBe('y-classic'); // เลี่ยง format 'story' ซ้ำ
  });

  it('prioritizes not-yet-done lessons over ones already completed', () => {
    const user = freshUser({
      lessons: {
        'a-story': { status: 'done', attempts: [], bookmarked: false },
        'b-classic': { status: 'done', attempts: [], bookmarked: false },
        'c-classic': { status: 'done', attempts: [], bookmarked: false },
        // d-mythbust ยังไม่จบ
      },
    });
    const ranked = rankCandidates(LESSONS, user, '2026-01-01');
    expect(ranked[0].id).toBe('d-mythbust');
  });

  it('is deterministic: same inputs always produce the same order', () => {
    const user = freshUser();
    const r1 = rankCandidates(LESSONS, user, '2026-01-01').map((l) => l.id);
    const r2 = rankCandidates(LESSONS, user, '2026-01-01').map((l) => l.id);
    expect(r1).toEqual(r2);
  });
});

describe('pickTodayLesson', () => {
  it('excludes the given ids from consideration', () => {
    const user = freshUser();
    const excludeIds = LESSONS.slice(0, 3).map((l) => l.id);
    const picked = pickTodayLesson(user, { lessons: LESSONS, excludeIds, today: '2026-01-01' });
    expect(picked?.id).toBe('d-mythbust');
  });

  it('returns undefined when every lesson is excluded', () => {
    const user = freshUser();
    const picked = pickTodayLesson(user, { lessons: LESSONS, excludeIds: LESSONS.map((l) => l.id), today: '2026-01-01' });
    expect(picked).toBeUndefined();
  });
});
