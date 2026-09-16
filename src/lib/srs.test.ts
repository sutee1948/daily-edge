import { describe, it, expect } from 'vitest';
import { upsertReviewOnMainQuiz, advanceReview, getDueReviews, SRS_INTERVALS_DAYS } from '@/lib/srs';
import { shiftISO } from '@/lib/date';
import type { ReviewQueueEntry } from '@/types/user';

describe('upsertReviewOnMainQuiz', () => {
  it('enqueues a lesson at 1 day out when the main quiz had wrong answers', () => {
    const queue = upsertReviewOnMainQuiz([], 'a01', '2026-03-01', true);
    expect(queue).toEqual([{ lessonId: 'a01', dueDate: '2026-03-02', intervalIdx: 0 }]);
  });

  it('does not enqueue (and removes any existing entry) on a perfect main quiz', () => {
    const existing: ReviewQueueEntry[] = [{ lessonId: 'a01', dueDate: '2026-03-05', intervalIdx: 2 }];
    const queue = upsertReviewOnMainQuiz(existing, 'a01', '2026-03-01', false);
    expect(queue).toEqual([]);
  });

  it('resets an already-queued lesson back to 1 day if it is wrong again', () => {
    const existing: ReviewQueueEntry[] = [{ lessonId: 'a01', dueDate: '2026-03-20', intervalIdx: 3 }];
    const queue = upsertReviewOnMainQuiz(existing, 'a01', '2026-03-01', true);
    expect(queue).toEqual([{ lessonId: 'a01', dueDate: '2026-03-02', intervalIdx: 0 }]);
  });

  it('leaves other lessons in the queue untouched', () => {
    const existing: ReviewQueueEntry[] = [{ lessonId: 'other', dueDate: '2026-03-10', intervalIdx: 1 }];
    const queue = upsertReviewOnMainQuiz(existing, 'a01', '2026-03-01', true);
    expect(queue).toContainEqual({ lessonId: 'other', dueDate: '2026-03-10', intervalIdx: 1 });
    expect(queue).toHaveLength(2);
  });
});

describe('advanceReview', () => {
  it('does nothing if the lesson is not in the queue', () => {
    const queue: ReviewQueueEntry[] = [];
    expect(advanceReview(queue, 'a01', '2026-03-02', true)).toEqual([]);
  });

  it('advances through every interval on consecutive correct reviews, then graduates out of the queue', () => {
    let queue: ReviewQueueEntry[] = [{ lessonId: 'a01', dueDate: '2026-03-02', intervalIdx: 0 }];
    let date = '2026-03-02';

    for (let i = 1; i < SRS_INTERVALS_DAYS.length; i++) {
      queue = advanceReview(queue, 'a01', date, true);
      expect(queue).toEqual([{ lessonId: 'a01', dueDate: shiftISO(date, SRS_INTERVALS_DAYS[i]), intervalIdx: i }]);
      date = queue[0].dueDate;
    }

    // ผ่านช่วงสุดท้าย (35 วัน) แล้วตอบถูกอีกครั้ง -> จบ ถอดออกจากคิว
    queue = advanceReview(queue, 'a01', date, true);
    expect(queue).toEqual([]);
  });

  it('resets to 1 day on a wrong review answer, regardless of current interval', () => {
    const queue: ReviewQueueEntry[] = [{ lessonId: 'a01', dueDate: '2026-03-20', intervalIdx: 3 }];
    const result = advanceReview(queue, 'a01', '2026-03-20', false);
    expect(result).toEqual([{ lessonId: 'a01', dueDate: shiftISO('2026-03-20', 1), intervalIdx: 0 }]);
  });
});

describe('getDueReviews', () => {
  const queue: ReviewQueueEntry[] = [
    { lessonId: 'future', dueDate: '2026-03-10', intervalIdx: 0 },
    { lessonId: 'today', dueDate: '2026-03-05', intervalIdx: 0 },
    { lessonId: 'overdue', dueDate: '2026-03-01', intervalIdx: 0 },
  ];

  it('returns only entries due on or before today, sorted soonest-due first', () => {
    const due = getDueReviews(queue, '2026-03-05');
    expect(due.map((e) => e.lessonId)).toEqual(['overdue', 'today']);
  });

  it('returns an empty list when nothing is due yet', () => {
    expect(getDueReviews(queue, '2026-02-01')).toEqual([]);
  });
});
