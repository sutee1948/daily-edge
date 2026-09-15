import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LessonProgress, UserState } from '@/types/user';
import type { QuizResult } from '@/lib/quiz';
import { todayISO } from '@/lib/date';
import { pickTodayLesson, MAX_REROLLS_PER_DAY } from '@/lib/dailyPicker';
import { bumpStreak, initialStreak } from '@/lib/streak';

const STORAGE_KEY = 'daily-edge:user-state:v1';
const CURRENT_VERSION = 2;
const PICK_HISTORY_LIMIT = 14;

function emptyProgress(): LessonProgress {
  return { status: 'new', attempts: [], bookmarked: false };
}

function initialState(): UserState {
  return {
    version: CURRENT_VERSION,
    streak: initialStreak(),
    lessons: {},
    dailyPick: null,
    pickHistory: [],
    settings: { theme: 'system', fontScale: 1 },
  };
}

interface UserActions {
  /** เรียกตอนเปิดหน้า Today — เลือกบทของวันนี้ถ้ายังไม่มี แล้วบันทึกลง state (และเก็บบทของเมื่อวานลง pickHistory) */
  ensureDailyPick: () => void;
  /** เปลี่ยนเรื่อง — จำกัด MAX_REROLLS_PER_DAY ครั้ง/วัน คืนค่า true ถ้าเปลี่ยนสำเร็จ */
  rerollDailyPick: () => boolean;
  markLessonStarted: (lessonId: string) => void;
  /** บันทึกชุดคำถามของรอบปัจจุบัน — ใช้กันไม่ให้ "ทำข้อสอบใหม่" ออกชุดเดิมซ้ำ */
  recordQuizQuestionSet: (lessonId: string, questionIds: string[]) => void;
  submitQuizAttempt: (lessonId: string, result: QuizResult) => void;
  toggleBookmark: (lessonId: string) => void;
  setNote: (lessonId: string, note: string) => void;
  /** จบเซสชันวันนี้ด้วยตัวเอง (ปุ่ม "พอแค่นี้วันนี้") — บันทึก streak ถ้ายังไม่ได้บันทึก */
  finishToday: () => void;
  /** ปิดแบนเนอร์ฉลอง milestone (7/30/100 วัน) กันไม่ให้เด้งซ้ำ */
  acknowledgeMilestone: (milestone: number) => void;
  resetAll: () => void;
}

export const useUserStore = create<UserState & UserActions>()(
  persist(
    (set, get) => ({
      ...initialState(),

      ensureDailyPick: () => {
        const state = get();
        const today = todayISO();
        if (state.dailyPick?.date === today) return;

        const picked = pickTodayLesson(state, { today });
        if (!picked) return;

        // เก็บบทของ "วันก่อนหน้า" ที่เพิ่งพ้นไปลงประวัติ ก่อนตั้งบทของวันนี้
        const pickHistory = state.dailyPick
          ? [...state.pickHistory, { date: state.dailyPick.date, lessonId: state.dailyPick.lessonId }].slice(
              -PICK_HISTORY_LIMIT,
            )
          : state.pickHistory;

        set({
          dailyPick: { date: today, lessonId: picked.id, rerollsUsed: 0, shownIds: [picked.id] },
          pickHistory,
        });
      },

      rerollDailyPick: () => {
        const state = get();
        const today = todayISO();
        const current = state.dailyPick?.date === today ? state.dailyPick : undefined;
        if (!current || current.rerollsUsed >= MAX_REROLLS_PER_DAY) return false;

        const next = pickTodayLesson(state, { excludeIds: current.shownIds, today });
        if (!next) return false;

        set({
          dailyPick: {
            date: today,
            lessonId: next.id,
            rerollsUsed: current.rerollsUsed + 1,
            shownIds: [...current.shownIds, next.id],
          },
        });
        return true;
      },

      markLessonStarted: (lessonId) => {
        set((state) => {
          const prev = state.lessons[lessonId] ?? emptyProgress();
          if (prev.status !== 'new') return state;
          return { lessons: { ...state.lessons, [lessonId]: { ...prev, status: 'reading' } } };
        });
      },

      recordQuizQuestionSet: (lessonId, questionIds) => {
        set((state) => {
          const prev = state.lessons[lessonId] ?? emptyProgress();
          return { lessons: { ...state.lessons, [lessonId]: { ...prev, lastQuizQuestionIds: questionIds } } };
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
            streak: bumpStreak(state.streak, todayISO()),
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
        set((state) => ({ streak: bumpStreak(state.streak, todayISO()) }));
      },

      acknowledgeMilestone: (milestone) => {
        set((state) => ({
          streak: { ...state.streak, milestonesSeen: [...state.streak.milestonesSeen, milestone] },
        }));
      },

      resetAll: () => set(initialState()),
    }),
    {
      name: STORAGE_KEY,
      version: CURRENT_VERSION,
      // persisted เป็น state เวอร์ชันเก่าที่ shape อาจไม่ตรงกับ UserState ปัจจุบัน จึงรับเป็น any แล้วเติมฟิลด์ใหม่ให้ครบก่อน cast กลับ
      migrate: (persisted: any, version) => {
        if (version < 2) {
          persisted.streak = {
            ...initialStreak(),
            ...persisted.streak,
            milestonesSeen: persisted.streak?.milestonesSeen ?? [],
          };
          persisted.pickHistory = persisted.pickHistory ?? [];
          if (persisted.dailyPick && !('shownIds' in persisted.dailyPick)) {
            persisted.dailyPick = { ...persisted.dailyPick, shownIds: [persisted.dailyPick.lessonId] };
          }
        }
        return persisted as UserState;
      },
    },
  ),
);
