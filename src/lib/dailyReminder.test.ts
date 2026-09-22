import { describe, expect, it } from 'vitest';
import { currentHHmm, defaultReminderSettings, shouldFireDailyReminder } from '@/lib/dailyReminder';

const base = {
  settings: { enabled: true, time: '19:00' },
  nowHHmm: '19:00',
  todayISO: '2026-09-23',
  lastStudyDate: null as string | null,
  lastNotifiedDate: null as string | null,
};

describe('shouldFireDailyReminder', () => {
  it('ปิดใช้งาน → ไม่แจ้งเตือนไม่ว่าเงื่อนไขอื่นจะเป็นอย่างไร', () => {
    expect(shouldFireDailyReminder({ ...base, settings: { enabled: false, time: '19:00' } })).toBe(false);
  });

  it('ยังไม่ถึงเวลาที่ตั้งไว้ → ไม่แจ้งเตือน', () => {
    expect(shouldFireDailyReminder({ ...base, nowHHmm: '18:59' })).toBe(false);
  });

  it('ถึงเวลาพอดีหรือเลยเวลาแล้ว → แจ้งเตือน', () => {
    expect(shouldFireDailyReminder({ ...base, nowHHmm: '19:00' })).toBe(true);
    expect(shouldFireDailyReminder({ ...base, nowHHmm: '23:59' })).toBe(true);
  });

  it('เรียนจบวันนี้แล้ว (lastStudyDate = วันนี้) → ไม่แจ้งเตือน', () => {
    expect(shouldFireDailyReminder({ ...base, lastStudyDate: '2026-09-23' })).toBe(false);
  });

  it('เรียนจบเมื่อวาน ไม่ใช่วันนี้ → ยังแจ้งเตือนได้', () => {
    expect(shouldFireDailyReminder({ ...base, lastStudyDate: '2026-09-22' })).toBe(true);
  });

  it('เคยแจ้งเตือนไปแล้ววันนี้ → ไม่แจ้งซ้ำ', () => {
    expect(shouldFireDailyReminder({ ...base, lastNotifiedDate: '2026-09-23' })).toBe(false);
  });

  it('เคยแจ้งเตือนเมื่อวาน ไม่ใช่วันนี้ → แจ้งเตือนวันนี้ได้อีก', () => {
    expect(shouldFireDailyReminder({ ...base, lastNotifiedDate: '2026-09-22' })).toBe(true);
  });
});

describe('currentHHmm', () => {
  it('ใส่ 0 นำหน้าให้ครบสองหลักเสมอ เทียบกับสตริง settings.time ได้ตรงๆ', () => {
    expect(currentHHmm(new Date('2026-09-23T09:05:00'))).toBe('09:05');
    expect(currentHHmm(new Date('2026-09-23T19:00:00'))).toBe('19:00');
    expect(currentHHmm(new Date('2026-09-23T00:00:00'))).toBe('00:00');
  });
});

describe('defaultReminderSettings', () => {
  it('ปิดใช้งานเป็นค่าเริ่มต้น (ไม่ขอ permission เองโดยที่ผู้ใช้ไม่ได้กด)', () => {
    expect(defaultReminderSettings()).toEqual({ enabled: false, time: '19:00' });
  });
});
