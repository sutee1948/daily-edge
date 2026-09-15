// สถานะผู้ใช้ — เก็บใน localStorage ตรงตาม PLAN.md ข้อ 9

export interface QuizAttempt {
  date: string; // ISO date 'YYYY-MM-DD'
  score: number;
  total: number;
  wrongQIds: string[];
}

export interface LessonProgress {
  status: 'new' | 'reading' | 'done';
  completedAt?: string;
  attempts: QuizAttempt[];
  bookmarked: boolean;
  note?: string;
}

export interface StreakState {
  current: number;
  best: number;
  lastStudyDate: string | null;
  freezesLeft: number;
}

export interface DailyPickState {
  date: string;
  lessonId: string;
  rerollsUsed: number;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  fontScale: number;
}

export interface UserState {
  version: number;
  streak: StreakState;
  lessons: Record<string, LessonProgress>;
  dailyPick: DailyPickState | null;
  settings: UserSettings;
}
