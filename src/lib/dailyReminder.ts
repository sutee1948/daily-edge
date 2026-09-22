export interface ReminderSettings {
  enabled: boolean;
  /** เวลาที่อยากถูกเตือน แบบ 24 ชั่วโมง 'HH:mm' */
  time: string;
}

export const DEFAULT_REMINDER_TIME = '19:00';

export function defaultReminderSettings(): ReminderSettings {
  return { enabled: false, time: DEFAULT_REMINDER_TIME };
}

/** เวลาปัจจุบันแบบ 'HH:mm' (ใช้เทียบกับ settings.time แบบสตริงได้ตรงๆ เพราะ zero-padded ทั้งคู่) */
export function currentHHmm(date: Date = new Date()): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/**
 * ตัดสินว่าควรยิงแจ้งเตือน ณ ตอนนี้หรือไม่ — เป็น pure function ล้วนๆ (ไม่แตะ Notification API จริง)
 * จึงทดสอบได้ตรงไปตรงมา ส่วนโค้ดที่เรียก Notification API จริงอยู่แยกใน src/lib/notificationBridge.ts
 *
 * เงื่อนไขต้องครบทุกข้อ: เปิดใช้งานอยู่, ยังไม่เรียนจบ/ทำควิซผ่านวันนี้ (lastStudyDate), ยังไม่เคยแจ้งเตือนวันนี้
 * (lastNotifiedDate), และเวลาปัจจุบันถึงเวลาที่ตั้งไว้แล้ว
 */
export function shouldFireDailyReminder(opts: {
  settings: ReminderSettings;
  nowHHmm: string;
  todayISO: string;
  lastStudyDate: string | null;
  lastNotifiedDate: string | null;
}): boolean {
  const { settings, nowHHmm, todayISO, lastStudyDate, lastNotifiedDate } = opts;
  if (!settings.enabled) return false;
  if (lastStudyDate === todayISO) return false;
  if (lastNotifiedDate === todayISO) return false;
  return nowHHmm >= settings.time;
}
