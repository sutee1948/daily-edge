import { useEffect } from 'react';
import { useUserStore } from '@/store/useUserStore';
import { currentHHmm, shouldFireDailyReminder } from '@/lib/dailyReminder';
import { showDailyReminderNotification, tryRegisterPeriodicSync, unregisterPeriodicSync } from '@/lib/notificationBridge';
import { writeReminderDbState } from '@/lib/reminderDb';
import { todayISO } from '@/lib/date';

const CHECK_INTERVAL_MS = 60_000;

/** ตัวเช็กแจ้งเตือนรายวัน — ทำงานได้แน่นอนเฉพาะตอนแท็บ/แอปเปิดอยู่ (ตั้งใจ ไม่ผูกกับเวลาที่แอปปิดสนิท)
 *  ส่วนกรณีแอปปิดสนิทเป็นตาข่ายรองรับผ่าน Periodic Background Sync ที่ลงทะเบียนแยกไว้ต่างหาก
 *  (ดูคอมเมนต์ข้อจำกัดใน src/lib/notificationBridge.ts) ไม่มี render ใดๆ เป็นแค่ effect */
export function DailyReminderScheduler() {
  const reminder = useUserStore((s) => s.settings.reminder);
  const lastStudyDate = useUserStore((s) => s.streak.lastStudyDate);
  const lastNotifiedDate = useUserStore((s) => s.lastNotifiedDate);
  const markReminderSent = useUserStore((s) => s.markReminderSent);

  // sync ค่าล่าสุดเข้า IndexedDB ให้ service worker อ่านได้ตอน periodicsync (ดูเหตุผลใน src/lib/reminderDb.ts)
  useEffect(() => {
    writeReminderDbState({ enabled: reminder.enabled, time: reminder.time, lastStudyDate });
  }, [reminder.enabled, reminder.time, lastStudyDate]);

  useEffect(() => {
    if (reminder.enabled) {
      tryRegisterPeriodicSync();
    } else {
      unregisterPeriodicSync();
    }
  }, [reminder.enabled]);

  useEffect(() => {
    function check() {
      const fire = shouldFireDailyReminder({
        settings: reminder,
        nowHHmm: currentHHmm(),
        todayISO: todayISO(),
        lastStudyDate,
        lastNotifiedDate,
      });
      if (fire) {
        showDailyReminderNotification();
        markReminderSent(todayISO());
      }
    }

    check();
    const id = window.setInterval(check, CHECK_INTERVAL_MS);
    document.addEventListener('visibilitychange', check);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', check);
    };
  }, [reminder, lastStudyDate, lastNotifiedDate, markReminderSent]);

  return null;
}
