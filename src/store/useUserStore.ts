import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LessonProgress, UserState } from '@/types/user';
import type { QuizResult } from '@/lib/quiz';
import { todayISO, diffDaysISO } from '@/lib/date';
import { pickTodayLesson, MAX_REROLLS_PER_DAY } from '@/lib/dailyPicker';

const STORAGE_KEY = 'daily-edge:user-state:v1';
const CURRENT_VERSION = 1;
const MONTHLY_FREEZES = 2;

function emptyProgress(): LessonProgress {
  return { status: 'new', attempts: [], bookmarked: false };
}

function initialState(): UserState {
  return {
    version: CURRENT_VERSION,
    streak: { current: 0, best: 0, lastStudyDate: null, freezesLeft: MONTHLY_FREEZES },
    lessons: {},
    dailyPick: null,
    settings: { theme: 'system', fontScale: 1 },
  };
}

interface UserActions {
  /** เรียกตอนเปิดหน้า Today — เลือกบทของวันนี้ถ้ายังไม่มี แล้วบันทึกลง state */
  ensureDailyPick: () => void;
  /** เปลี่ยนเรื่อง — จำกัด MAX_REROLLS_PER_DAY ครั้ง/วัน คืนค่า true ถ้าเปลี่ยนสำเร็จ */
  rerollDailyPick: () => boolean;
  markLessonStarted: (lessonId: string) => void;
  submitQuizAttempt: (lessonId: string, result: QuizResult) => void;
  toggleBookmark: (lessonId: string) => void;
  setNote: (lessonId: string, note: string) => void;
  /** จบเซสชันวันนี้ด้วยตัวเอง (ปุ่ม "พอแค่นี้วันนี้") — บันทึก streak ถ้ายังไม่ได้บันทึก */
  finishToday: () => void;
  resetAll: () => void;
}

function bumpStreak(state: UserState): UserState['streak'] {
  const today = todayISO();
  const { streak } = state;
  if (streak.lastStudyDate === today) return streak; // วันนี้นับไปแล้ว

  if (!streak.lastStudyDate) {
    return { ...streak, current: 1, best: Math.max(streak.best, 1), lastStudyDate: today };
  }

  const gap = diffDaysISO(streak.lastStudyDate, today);

  if (gap === 1) {
    const current = streak.current + 1;
    return { ...streak, current, best: Math.max(streak.best, current), lastStudyDate: today };
  }

  if (gap === 2 && streak.freezesLeft > 0) {
    // ขาดไป 1 วัน แต่ยังมี freeze — ใช้ freeze แทนการรีเซ็ต
    const current = streak.current + 1;
    return {
      ...streak,
      current,
      best: Math.max(streak.best, current),
      lastStudyDate: today,
      freezesLeft: streak.freezesLeft - 1,
    };
  }

  // ขาดเกินกว่านี้ — เริ่มนับใหม่
  return { ...streak, current: 1, best: Math.max(streak.best, 1), lastStudyDate: today };
}

export const useUserStore = create<UserState & UserActions>()(
  persist(
    (set, get) => ({
      ...initialState(),

      ensureDailyPick: () => {
        const state = get();
        const today = todayISO();
        if (state.dailyPick?.date === today) return;
        const picked = pickTodayLesson(state);
        if (!picked) return;
        set({ dailyPick: { date: today, lessonId: picked.id, rerollsUsed: 0 } });
      },

      rerollDailyPick: () => {
        const state = get();
        const today = todayISO();
        const current = state.dailyPick?.date === today ? state.dailyPick : { date: today, lessonId: '', rerollsUsed: 0 };
        if (current.rerollsUsed >= MAX_REROLLS_PER_DAY) return false;

        const next = pickTodayLesson(state, [current.lessonId]);
        if (!next) return false;

        set({ dailyPick: { date: today, lessonId: next.id, rerollsUsed: current.rerollsUsed + 1 } });
        return true;
      },

      markLessonStarted: (lessonId) => {
        set((state) => {
          const prev = state.lessons[lessonId] ?? emptyProgress();
          if (prev.status !== 'new') return state;
          return { lessons: { ...state.lessons, [lessonId]: { ...prev, status: 'reading' } } };
        });
      },

      submitQuizAttempt: (lessonId, result) => {
        set((state) => {
          const prev = state.lessons[lessonId] ?? emptyProgress();
          const attempt = { date: todayISO(), score: result.score, total: result.total, wrongQIds: result.wrongQIds };
          const passed = result.band !== 'shaky';
          const nextProgress: LessonProgress = {
            ...prev,
            status: passed ? 'done' : prev.status === 'done' ? 'done' : 'reading',
            completedAt: passed ? prev.completedAt ?? todayISO() : prev.completedAt,
            attempts: [...prev.attempts, attempt],
          };
          return {
            lessons: { ...state.lessons, [lessonId]: nextProgress },
            streak: bumpStreak(state),
          };
        });
      },

      toggleBookmark: (lessonId) => {
        set((state) => {
          const prev = state.lessons[lessonId] ?? emptyProgress();
          return { lessons: { ...state.lessons, [lessonId]: { ...prev, bookmarked: !prev.bookmarked } } };
        });
      },

      setNote: (lessonId, note) => {
        set((state) => {
          const prev = state.lessons[lessonId] ?? emptyProgress();
          return { lessons: { ...state.lessons, [lessonId]: { ...prev, note } } };
        });
      },

      finishToday: () => {
        set((state) => ({ streak: bumpStreak(state) }));
      },

      resetAll: () => set(initialState()),
    }),
    {
      name: STORAGE_KEY,
      version: CURRENT_VERSION,
    },
  ),
);
