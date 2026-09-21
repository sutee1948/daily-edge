import { createElement, type ReactElement } from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { Route, Routes } from 'react-router-dom';
import { LazyMotion, domAnimation } from 'framer-motion';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { getLessonMeta, loadLesson } from '@/content';
import { TRACKS, getTrack } from '@/content/tracks';
import { computeTrackProgress } from '@/lib/trackProgress';
import { buildWeeklyRecap, weekRangeOf } from '@/lib/weeklyRecap';
import type { Lesson } from '@/types/content';
import type { LessonProgress } from '@/types/user';

/**
 * Smoke test: เรนเดอร์หน้า/คอมโพเนนต์ใหม่ของ Phase 6 ฝั่งเซิร์ฟเวอร์เพื่อจับ error ตอนเรนเดอร์
 * (import พัง, ข้อมูลหาย, ลิงก์เส้นทางผิด) โดยไม่ต้องมีเบราว์เซอร์ — effect ไม่ถูกรันในโหมดนี้
 * หมายเหตุ: renderToString ทำให้ zustand อ่านสแนปช็อตเริ่มต้น (ไม่ใช่ state ปัจจุบัน) จึงทดสอบเนื้อหาที่ขึ้นกับ
 * ความคืบหน้าผ่านคอมโพเนนต์ที่รับ props (ContinueTrackCard, WeeklyRecapView) ส่วนตรรกะคำนวณมี unit test แยกอยู่แล้ว
 */

/** เรนเดอร์เป็น HTML แล้วทำให้เทียบข้อความง่าย: ตัดตัวคั่น <!-- --> ที่ React แทรกระหว่างข้อความติดกัน และถอด HTML entity ของเครื่องหมายคำพูด */
function page(path: string, routePattern: string, element: ReactElement): string {
  const html = renderToString(
    createElement(
      StaticRouter,
      { location: path },
      createElement(
        LazyMotion,
        { features: domAnimation, strict: true },
        createElement(Routes, null, createElement(Route, { path: routePattern, element })),
      ),
    ),
  );
  return html
    .replace(/<!-- -->/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&');
}

beforeAll(() => {
  const memory = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => memory.get(k) ?? null,
    setItem: (k: string, v: string) => void memory.set(k, v),
    removeItem: (k: string) => void memory.delete(k),
    clear: () => memory.clear(),
  });
});

afterAll(() => vi.unstubAllGlobals());

describe('หน้า /tracks', () => {
  it('แสดงครบ 10 เส้นทางพร้อมลิงก์ไปหน้ารายละเอียดของแต่ละเส้น', async () => {
    const { Tracks } = await import('@/routes/Tracks');
    const html = page('/tracks', '/tracks', createElement(Tracks));
    expect(html).toContain('เส้นทางการเรียน');
    for (const track of TRACKS) {
      expect(html, track.id).toContain(`href="/tracks/${track.id}"`);
      expect(html, track.title).toContain(track.title);
    }
    expect(html).toContain('เรียนจบแล้ว 0/10 บท');
  });

  it('/tracks/:id แสดง 10 บทตามลำดับ และปุ่มเริ่มเส้นทางชี้ไปบทแรก', async () => {
    const { TrackDetail } = await import('@/routes/TrackDetail');
    const html = page('/tracks/persuasion', '/tracks/:id', createElement(TrackDetail));
    expect(html).toContain('โน้มน้าวและเจรจาอย่างมีจริยธรรม');
    expect(html).toContain('เริ่มเส้นทางนี้');
    expect(html).toContain('href="/lesson/a06-guiguzi-bai-he"');
    expect(html.match(/<li/g)).toHaveLength(10);
    // ทุกบทของเส้นมีลิงก์ไปหน้าอ่าน
    for (const id of getTrack('persuasion')!.lessonIds) expect(html, id).toContain(`/lesson/${id}`);
  });

  it('/tracks/ที่ไม่มีอยู่ → หน้าไม่พบ ไม่พัง', async () => {
    const { TrackDetail } = await import('@/routes/TrackDetail');
    expect(page('/tracks/nope', '/tracks/:id', createElement(TrackDetail))).toContain('ไม่พบหน้านี้');
  });
});

describe('หน้า Today และ Progress (ยังไม่มีความคืบหน้า)', () => {
  it('Today แสดงลิงก์ไปเส้นทางการเรียนและคลังบท 70 บท', async () => {
    const { Today } = await import('@/routes/Today');
    const html = page('/', '/', createElement(Today));
    expect(html).toContain('href="/tracks"');
    expect(html).toContain('เส้นทางการเรียน (');
    expect(html).toContain('ดูคลังบททั้งหมด (');
  });

  it('Progress แสดงการ์ดสรุปประจำสัปดาห์แบบว่าง พร้อมข้อความชวนเริ่ม', async () => {
    const { Progress } = await import('@/routes/Progress');
    const html = page('/progress', '/progress', createElement(Progress));
    expect(html).toContain('สรุปประจำสัปดาห์');
    expect(html).toContain('(สัปดาห์นี้)');
    expect(html).toContain('เริ่มจากบทเดียว');
  });
});

describe('ContinueTrackCard', () => {
  it('แสดงชื่อเส้น ความคืบหน้า และลิงก์ไปบทถัดไป', async () => {
    const { ContinueTrackCard } = await import('@/components/ContinueTrackCard');
    const track = getTrack('china-strategy')!;
    const done: LessonProgress = { status: 'done', completedAt: '2026-09-22', attempts: [], bookmarked: false };
    const progress = computeTrackProgress(track, {
      'a01-sunzi-win-without-fighting': done,
      'a02-man-tian-guo-hai': done,
    });
    const next = getLessonMeta(progress.nextLessonId!)!;

    const html = page('/', '/', createElement(ContinueTrackCard, { track, progress, nextLesson: next }));
    expect(html).toContain('เส้นทางที่กำลังเรียน');
    expect(html).toContain(track.title);
    expect(html).toContain('เรียนจบแล้ว 2/10 บท');
    expect(html).toContain('href="/lesson/a03-borrow-a-knife"');
    expect(html).toContain('href="/tracks/china-strategy"');
  });
});

describe('WeeklyRecapView', () => {
  it('แสดงตัวเลขจริง ประโยคเด็ดของบทที่จบ บทที่ควรทบทวน และสิ่งที่ควรลอง', async () => {
    const { WeeklyRecapView } = await import('@/components/WeeklyRecapCard');
    const range = weekRangeOf('2026-09-23');
    const attempt = (score: number) => ({ date: '2026-09-22', score, total: 8, wrongQIds: [] });
    const progress: Record<string, LessonProgress> = {
      'a01-sunzi-win-without-fighting': { status: 'done', completedAt: '2026-09-22', attempts: [attempt(8)], bookmarked: false },
      'b02-fundamental-attribution-error': { status: 'done', completedAt: '2026-09-23', attempts: [attempt(4)], bookmarked: false },
    };
    const recap = buildWeeklyRecap(progress, getLessonMeta, range);

    const loaded = await Promise.all(recap.completed.map((c) => loadLesson(c.id)));
    const fullLessons: Record<string, Lesson> = {};
    for (const l of loaded) if (l) fullLessons[l.id] = l;

    const html = page(
      '/progress',
      '/progress',
      createElement(WeeklyRecapView, { recap, fullLessons, offset: 0, onPrev: () => {}, onNext: () => {} }),
    );

    expect(html).toContain('เรียนจบ 2 บท');
    expect(html).toContain('ควิซถูกเฉลี่ย 75%');
    expect(html).toContain(fullLessons['a01-sunzi-win-without-fighting'].keyTakeaway);
    expect(html).toContain(fullLessons['b02-fundamental-attribution-error'].keyTakeaway);
    expect(html).toContain('ควรทบทวนอีกรอบ');
    expect(html).toContain('ลองทำในสัปดาห์หน้า');
    expect(html).toContain(fullLessons['a01-sunzi-win-without-fighting'].tryToday[0]);
  });

  it('สัปดาห์ที่แล้ว: ปุ่มถัดไปกดได้ และมีป้ายกำกับ', async () => {
    const { WeeklyRecapView } = await import('@/components/WeeklyRecapCard');
    const recap = buildWeeklyRecap({}, getLessonMeta, weekRangeOf('2026-09-16'));
    const html = page(
      '/progress',
      '/progress',
      createElement(WeeklyRecapView, { recap, fullLessons: {}, offset: -1, onPrev: () => {}, onNext: () => {} }),
    );
    expect(html).toContain('(สัปดาห์ที่แล้ว)');
    // ปุ่ม "ถัดไป" ไม่ถูก disable เมื่อไม่ใช่สัปดาห์ปัจจุบัน
    expect(html).not.toMatch(/disabled=""[^>]*aria-label="ดูสัปดาห์ถัดไป"/);
  });
});
