import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { ALL_LESSON_METAS, getLessonMeta } from '@/content';
import { shiftISO, toISO } from '@/lib/date';

/**
 * จำลอง 70 วันผ่าน store จริง (ensureDailyPick + submitQuizAttempt) ด้วยนาฬิกาปลอม
 * เพื่อตรวจ acceptance ของ Phase 6: 70 บทพอสำหรับ 10 สัปดาห์โดยไม่ซ้ำ และการสลับหมวดเป็นธรรมชาติ
 * ผู้ใช้จำลอง "ทำตามบทที่เสนอทุกวัน ไม่กดเปลี่ยนเรื่อง และทำควิซผ่านทุกครั้ง"
 */

const START = '2026-01-05';
const DAYS = 70;

type Store = typeof import('@/store/useUserStore').useUserStore;
let store: Store;
const picks: { date: string; id: string; category: string; format: string }[] = [];

beforeAll(async () => {
  const memory = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => memory.get(k) ?? null,
    setItem: (k: string, v: string) => void memory.set(k, v),
    removeItem: (k: string) => void memory.delete(k),
    clear: () => memory.clear(),
  });
  vi.useFakeTimers();

  ({ useUserStore: store } = await import('@/store/useUserStore'));
  store.getState().resetAll();

  for (let i = 0; i < DAYS; i++) {
    const date = shiftISO(START, i);
    vi.setSystemTime(new Date(`${date}T09:00:00`));
    expect(toISO(new Date())).toBe(date);

    store.getState().ensureDailyPick();
    const id = store.getState().dailyPick!.lessonId;
    const meta = getLessonMeta(id)!;
    picks.push({ date, id, category: meta.category, format: meta.format });

    store.getState().submitQuizAttempt(id, { score: 8, total: 8, wrongQIds: [], band: 'mastered' });
  }
});

afterAll(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('จำลอง 70 วันของบทประจำวัน', () => {
  it('คลังมี 70 บทพอดี และจำลองครบ 70 วัน', () => {
    expect(ALL_LESSON_METAS).toHaveLength(70);
    expect(picks).toHaveLength(DAYS);
  });

  it('ทั้ง 70 วันได้บทไม่ซ้ำกันเลย และเรียนครบทุกบทในคลัง', () => {
    const ids = picks.map((p) => p.id);
    expect(new Set(ids).size).toBe(DAYS);
    expect(new Set(ids)).toEqual(new Set(ALL_LESSON_METAS.map((m) => m.id)));
  });

  it('ไม่มีวันไหนได้หมวดเดียวกับเมื่อวาน', () => {
    const repeats = picks
      .slice(1)
      .filter((p, i) => p.category === picks[i].category)
      .map((p) => `${p.date}: ${p.category}`);
    expect(repeats).toEqual([]);
  });

  it('ทุกช่วง 7 วันติดกันได้อย่างน้อย 5 หมวดที่ต่างกัน (หลากหลายพอ)', () => {
    for (let start = 0; start + 7 <= DAYS; start++) {
      const window = picks.slice(start, start + 7);
      const distinct = new Set(window.map((p) => p.category)).size;
      expect(distinct, `ช่วงเริ่มวันที่ ${window[0].date}`).toBeGreaterThanOrEqual(5);
    }
  });

  it('รูปแบบ (format) เดียวกันติดกันเป็นข้อยกเว้น ไม่ใช่เรื่องปกติ', () => {
    const sameFormatStreaks = picks.slice(1).filter((p, i) => p.format === picks[i].format).length;
    // กติกาเป็นเพียงบทลงโทษเบาๆ (ไม่ใช่ห้ามเด็ดขาด) เพราะบางหมวดมีรูปแบบไม่หลากหลาย
    expect(sameFormatStreaks).toBeLessThanOrEqual(15);
  });

  it('ทุกหมวดถูกเสนอสม่ำเสมอ: ใน 35 วันแรกทุกหมวดได้อย่างน้อย 3 บท', () => {
    const firstHalf = picks.slice(0, 35);
    const byCategory = new Map<string, number>();
    for (const p of firstHalf) byCategory.set(p.category, (byCategory.get(p.category) ?? 0) + 1);
    expect(byCategory.size).toBe(7);
    for (const [category, count] of byCategory) {
      expect(count, category).toBeGreaterThanOrEqual(3);
    }
  });
});
