import { describe, expect, it } from 'vitest';
import { ALL_LESSON_METAS, getLessonMeta } from '@/content';
import { TRACKS, getTrack } from '@/content/tracks';

const CATEGORY_TRACK_IDS = ['china-strategy', 'read-people', 'people-mgmt', 'relationships', 'brain', 'self-dev', 'dev-career'];
const CROSS_TRACK_IDS = ['dev-to-lead', 'persuasion', 'learn-faster'];

describe('tracks', () => {
  it('มี 10 เส้นทาง id ไม่ซ้ำ และเป็นเจ็ดหมวด + สามเส้นข้ามหมวดตามแผน', () => {
    expect(TRACKS).toHaveLength(10);
    expect(new Set(TRACKS.map((t) => t.id)).size).toBe(10);
    expect(TRACKS.map((t) => t.id)).toEqual([...CATEGORY_TRACK_IDS, ...CROSS_TRACK_IDS]);
  });

  it('ทุกเส้นมี 10 บท ไม่ซ้ำกันเอง และทุก id มีอยู่จริงในคลัง', () => {
    for (const track of TRACKS) {
      expect(track.lessonIds, track.id).toHaveLength(10);
      expect(new Set(track.lessonIds).size, `${track.id} มีบทซ้ำ`).toBe(10);
      for (const id of track.lessonIds) {
        expect(getLessonMeta(id), `${track.id} อ้างถึงบทที่ไม่มี: ${id}`).toBeDefined();
      }
    }
  });

  it('เส้นทางรายหมวดครอบคลุมทุกบทของหมวดนั้นพอดี', () => {
    for (const categoryId of CATEGORY_TRACK_IDS) {
      const track = getTrack(categoryId)!;
      const inCategory = ALL_LESSON_METAS.filter((m) => m.category === categoryId).map((m) => m.id);
      expect([...track.lessonIds].sort(), categoryId).toEqual([...inCategory].sort());
    }
  });

  it('เส้นทางข้ามหมวดผสมอย่างน้อย 3 หมวด', () => {
    for (const id of CROSS_TRACK_IDS) {
      const categories = new Set(getTrack(id)!.lessonIds.map((lid) => getLessonMeta(lid)!.category));
      expect(categories.size, id).toBeGreaterThanOrEqual(3);
    }
  });

  it('ทุกบทในคลังอยู่ในเส้นทางอย่างน้อยหนึ่งเส้น', () => {
    const inTracks = new Set(TRACKS.flatMap((t) => t.lessonIds));
    const missing = ALL_LESSON_METAS.filter((m) => !inTracks.has(m.id)).map((m) => m.id);
    expect(missing).toEqual([]);
  });

  it('บทแรกของทุกเส้นเข้าถึงง่าย (ความยากไม่เกิน 2) เพื่อให้เริ่มได้สบาย', () => {
    for (const track of TRACKS) {
      const first = getLessonMeta(track.lessonIds[0])!;
      expect(first.difficulty, track.id).toBeLessThanOrEqual(2);
    }
  });
});
