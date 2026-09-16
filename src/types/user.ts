// สถานะผู้ใช้ — เก็บใน localStorage ตรงตาม PLAN.md ข้อ 9

export interface QuizAttempt {
  date: string; // ISO date 'YYYY-MM-DD'
  score: number;
  total: number;
  wrongQIds: string[];
  /** ที่มาของการทำควิซรอบนี้ — เว้นว่างได้ (ข้อมูลเก่าก่อน Phase 4 ถือเป็น 'main') */
  source?: 'main' | 'review';
}

export interface LessonProgress {
  status: 'new' | 'reading' | 'done';
  completedAt?: string;
  attempts: QuizAttempt[];
  bookmarked: boolean;
  note?: string;
  /** ชุดคำถามรอบล่าสุดที่เคยออก — ใช้กันไม่ให้ "ทำข้อสอบใหม่" ออกชุดเดิมซ้ำ */
  lastQuizQuestionIds?: string[];
}

export interface StreakState {
  current: number;
  best: number;
  lastStudyDate: string | null;
  freezesLeft: number;
  /** milestone (วัน) ที่เคยแสดงฉลองไปแล้ว กันไม่ให้เด้งซ้ำ */
  milestonesSeen: number[];
}

export interface DailyPickState {
  date: string;
  lessonId: string;
  rerollsUsed: number;
  /** บทที่เคยแสดงให้ดูแล้ววันนี้ (รวมที่ถูกเปลี่ยนออกไป) กันไม่ให้เปลี่ยนเรื่องแล้ววนกลับมาซ้ำ */
  shownIds: string[];
}

/** บันทึกว่าวันไหนได้บทอะไรไปเรียน — ใช้ให้อัลกอริทึมวันถัดไปเลี่ยงหมวด/รูปแบบซ้ำ */
export interface PickHistoryEntry {
  date: string;
  lessonId: string;
}

/** คิวทบทวนแบบเว้นระยะ (SM-2 lite) — PLAN.md ข้อ 7.2 */
export interface ReviewQueueEntry {
  lessonId: string;
  dueDate: string; // ISO date ที่ถึงกำหนดทบทวน
  intervalIdx: number; // index ใน SRS_INTERVALS_DAYS
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
  /** ประวัติบทที่ถูกเลือกเป็น "บทของวัน" ล่าสุด (เก็บย้อนหลังไม่กี่รายการ) */
  pickHistory: PickHistoryEntry[];
  reviewQueue: ReviewQueueEntry[];
  settings: UserSettings;
}
