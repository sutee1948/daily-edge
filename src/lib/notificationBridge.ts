/**
 * โค้ดที่แตะ Notification API / Service Worker จริง — แยกออกจาก src/lib/dailyReminder.ts (ตรรกะล้วนๆ ทดสอบได้)
 * เพราะฟังก์ชันในไฟล์นี้ต้องมี window/Notification/serviceWorker จริง จึงไม่มี unit test ตรงๆ
 * (ทดสอบผ่าน shouldFireDailyReminder + การอ่าน component ที่เรียกใช้แทน)
 */

const REMINDER_TAG = 'daily-lesson-reminder';

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied';
  if (Notification.permission !== 'default') return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

/** แสดงแจ้งเตือน — ผ่าน service worker ถ้ามี (ทำงานได้แม้แท็บไม่ได้โฟกัส) ไม่งั้น fallback เป็น Notification ตรงๆ */
export async function showDailyReminderNotification(): Promise<void> {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return;

  const title = 'ถึงเวลาความรู้วันนี้แล้ว 📖';
  const options: NotificationOptions = {
    body: 'ใช้เวลาไม่ถึง 10 นาที เปิดแอปแล้วอ่านบทของวันนี้ได้เลย',
    icon: 'icon.svg',
    tag: REMINDER_TAG,
    // renotify ไม่มีใน type ของ NotificationOptions บางเวอร์ชัน TS lib — ใส่ผ่าน as any ถ้าจำเป็นก็ข้ามได้ ไม่ใช่สาระสำคัญ
  };

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, options);
      return;
    }
  } catch {
    // ตกไป fallback ด้านล่าง
  }

  try {
    new Notification(title, options);
  } catch {
    // บางเบราว์เซอร์ (เช่น Safari) ไม่รองรับ Notification constructor ตรงๆ นอก service worker — ยอมข้ามเงียบๆ
  }
}

/**
 * พยายามลงทะเบียน Periodic Background Sync เพื่อให้มีโอกาสได้แจ้งเตือนแม้ไม่ได้เปิดแท็บทิ้งไว้
 * รองรับเฉพาะ Chrome/Edge บนเดสก์ท็อปและแอนดรอยด์ที่ "ติดตั้ง" แอปแล้วและมี engagement พอ (เบราว์เซอร์เป็นคนตัดสิน)
 * ไม่รองรับใน Safari/iOS และ Firefox เลย — เมื่อไม่รองรับฟังก์ชันนี้จะคืน false เงียบๆ ไม่ error
 * เวลาที่ยิงจริงก็ไม่ตรงกับเวลาที่ผู้ใช้ตั้งเป๊ะ (เบราว์เซอร์เลือกจังหวะเอง) ตัวที่ตรงเวลาแน่นอนคือตัวเช็กระหว่างเปิดแอปอยู่
 * (ดู src/components/DailyReminderScheduler.tsx) ส่วนนี้เป็นแค่ตาข่ายรองรับเพิ่มเติม
 */
export async function tryRegisterPeriodicSync(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    const anyReg = reg as ServiceWorkerRegistration & {
      periodicSync?: { register: (tag: string, opts: { minInterval: number }) => Promise<void> };
    };
    if (!anyReg.periodicSync) return false;

    if ('permissions' in navigator) {
      try {
        const status = await navigator.permissions.query({ name: 'periodic-background-sync' as PermissionName });
        if (status.state !== 'granted') return false;
      } catch {
        // เบราว์เซอร์บางตัวไม่รู้จักชื่อ permission นี้เลย — ลองลงทะเบียนตรงๆ ต่อไป แล้วให้ catch ด้านล่างจับถ้าพัง
      }
    }

    await anyReg.periodicSync.register(REMINDER_TAG, { minInterval: 24 * 60 * 60 * 1000 });
    return true;
  } catch {
    return false;
  }
}

export async function unregisterPeriodicSync(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const anyReg = reg as ServiceWorkerRegistration & {
      periodicSync?: { unregister: (tag: string) => Promise<void> };
    };
    await anyReg.periodicSync?.unregister(REMINDER_TAG);
  } catch {
    // ไม่มี periodicSync หรือไม่เคยลงทะเบียนไว้ก็ไม่ใช่ปัญหา
  }
}
