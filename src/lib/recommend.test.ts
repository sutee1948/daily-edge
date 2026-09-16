import { describe, it, expect } from 'vitest';
import { recommendLessons } from '@/lib/recommend';
import { todayISO, shiftISO } from '@/lib/date';
import type { Category, Lesson } from '@/types/content';
import type { LessonProgress } from '@/types/user';

function makeLesson(id: string, category: Category, tags: string[], difficulty: 1 | 2 | 3 = 1, relatedIds: string[] = []): Lesson {
  return {
    id,
    title: id,
    subtitle: id,
    category,
    format: 'classic',
    difficulty,
    tags,
    hook: 'hook',
    beats: [
      { heading: 'h1', body: 'b1' },
      { heading: 'h2', body: 'b2' },
      { heading: 'h3', body: 'b3' },
    ],
    evidence: { summary: 's', sources: [{ label: 'src' }] },
    tryToday: ['do it'],
    keyTakeaway: 'takeaway',
    relatedIds,
    questions: [],
    wordCount: 700,
    estimatedMinutes: 8,
  };
}

describe('recommendLessons — ranking and reasons', () => {
  const source = makeLesson('source', 'china-strategy', ['a', 'b', 'c'], 1, ['related1']);
  const related1 = makeLesson('related1', 'brain', []); // ข้ามหมวด + อยู่ใน relatedIds ของ source
  const tagmatch = makeLesson('tagmatch', 'read-people', ['a']); // ทับ 1/3 ของ tags
  const samecat = makeLesson('samecat', 'china-strategy', []); // หมวดเดียวกับ source
  const plain = makeLesson('plain', 'people-mgmt', []); // ไม่มีปัจจัยบวกเลย

  it('ranks by score: relatedIds > same-category > tag-overlap > nothing', () => {
    const recs = recommendLessons('source', [source, related1, tagmatch, samecat, plain], {}, 3);
    expect(recs.map((r) => r.lesson.id)).toEqual(['related1', 'samecat', 'tagmatch']);
  });

  it('explains the top pick as an author-curated related lesson', () => {
    const recs = recommendLessons('source', [source, related1, tagmatch, samecat, plain], {}, 1);
    expect(recs[0].reason).toBe('เพราะผู้เขียนแนะนำให้เรียนต่อจากบทนี้');
  });

  it('explains a same-category pick by its category label when nothing else applies', () => {
    const recs = recommendLessons('source', [source, samecat], {}, 1);
    expect(recs[0].reason).toContain('หมวด');
  });

  it('falls back to a "try another category" reason when a candidate has no positive score at all', () => {
    const recs = recommendLessons('source', [source, plain], {}, 1);
    expect(recs[0].reason).toContain('ลองมุมมองใหม่');
  });

  it('returns an empty list if the source lesson id does not exist', () => {
    expect(recommendLessons('nope', [source, plain], {}, 3)).toEqual([]);
  });
});

describe('recommendLessons — same-category cap guarantees cross-category diversity', () => {
  const source = makeLesson('source', 'china-strategy', ['x']);
  const sc1 = makeLesson('sc1', 'china-strategy', ['x']); // เนื้อหาทับเต็ม แต่หมวดเดียวกับ source
  const sc2 = makeLesson('sc2', 'china-strategy', ['x']);
  const sc3 = makeLesson('sc3', 'china-strategy', ['x']);
  const cr1 = makeLesson('cr1', 'brain', []); // ข้ามหมวด แต่คะแนนต่ำกว่ามาก
  const cr2 = makeLesson('cr2', 'self-dev', []);

  it('never returns more than 1 same-category pick when enough cross-category candidates exist', () => {
    const recs = recommendLessons('source', [source, sc1, sc2, sc3, cr1, cr2], {}, 3);
    const sameCategoryCount = recs.filter((r) => r.lesson.category === 'china-strategy').length;
    expect(sameCategoryCount).toBe(1);
    expect(recs).toHaveLength(3);
  });

  it('relaxes the cap gracefully when cross-category supply runs out (never returns fewer than requested)', () => {
    const recs = recommendLessons('source', [source, sc1, sc2, sc3, cr1], {}, 3);
    expect(recs).toHaveLength(3); // ต้องเติมให้ครบแม้ต้องผ่อนเพดานหมวด
  });
});

describe('recommendLessons — difficulty step-up bonus', () => {
  const source = makeLesson('source', 'china-strategy', [], 1);
  const harder = makeLesson('harder', 'brain', [], 2); // ยากกว่า source 1 ระดับ
  const sameDifficulty = makeLesson('same-diff', 'read-people', [], 1);

  it('prefers a harder lesson one level up after the source was just mastered (perfect quiz)', () => {
    const progress: Record<string, LessonProgress> = {
      source: { status: 'done', attempts: [{ date: '2026-01-01', score: 4, total: 4, wrongQIds: [] }], bookmarked: false },
    };
    const recs = recommendLessons('source', [source, harder, sameDifficulty], progress, 2);
    expect(recs[0].lesson.id).toBe('harder');
    expect(recs[0].reason).toContain('ยากขึ้น');
  });

  it('does not apply the bonus if the last attempt on the source was not perfect', () => {
    const progress: Record<string, LessonProgress> = {
      source: { status: 'done', attempts: [{ date: '2026-01-01', score: 3, total: 4, wrongQIds: ['q1'] }], bookmarked: false },
    };
    const recs = recommendLessons('source', [source, harder, sameDifficulty], progress, 2);
    // ไม่มีปัจจัยอื่นเลย ต้องได้คะแนนเท่ากันทั้งคู่ (0) เพราะยังไม่เคยได้ 4/4 มาก่อน
    const harderScore = recs.find((r) => r.lesson.id === 'harder')?.score;
    const sameDiffScore = recs.find((r) => r.lesson.id === 'same-diff')?.score;
    expect(harderScore).toBe(0);
    expect(harderScore).toBe(sameDiffScore);
  });
});

describe('recommendLessons — recently-completed penalty', () => {
  const source = makeLesson('source', 'china-strategy', []);
  const plain = makeLesson('plain', 'brain', []);
  const recentDup = makeLesson('recent-dup', 'dev-career', []); // โปรไฟล์คะแนนเหมือน plain ทุกประการ ยกเว้นเพิ่งเรียนจบ

  it('ranks a lesson completed a few days ago below an equally-scored lesson never completed', () => {
    const progress: Record<string, LessonProgress> = {
      'recent-dup': { status: 'done', completedAt: shiftISO(todayISO(), -5), attempts: [], bookmarked: false },
    };
    const recs = recommendLessons('source', [source, plain, recentDup], progress, 2);
    expect(recs.map((r) => r.lesson.id)).toEqual(['plain', 'recent-dup']);
    expect(recs.find((r) => r.lesson.id === 'recent-dup')?.score).toBe(-5);
    expect(recs.find((r) => r.lesson.id === 'plain')?.score).toBe(0);
  });

  it('does not penalize a lesson completed more than 30 days ago', () => {
    const progress: Record<string, LessonProgress> = {
      'recent-dup': { status: 'done', completedAt: shiftISO(todayISO(), -40), attempts: [], bookmarked: false },
    };
    const recs = recommendLessons('source', [source, plain, recentDup], progress, 2);
    const plainScore = recs.find((r) => r.lesson.id === 'plain')?.score;
    const recentDupScore = recs.find((r) => r.lesson.id === 'recent-dup')?.score;
    expect(recentDupScore).toBe(plainScore); // ไม่โดนหักคะแนนแล้วเพราะพ้น 30 วัน
  });
});
