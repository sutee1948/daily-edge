/* global self, indexedDB, clients */
// ไฟล์นี้ถูกดึงเข้า service worker ที่ Workbox สร้างให้อัตโนมัติผ่าน importScripts()
// (ตั้งค่าไว้ที่ workbox.importScripts ใน vite.config.ts) — รันในบริบท service worker (ไม่ใช่หน้าเว็บ)
// จึงเป็น plain JS ล้วนๆ ห้าม import โมดูล TypeScript ของแอปตรงๆ
//
// หน้าที่: เป็น "ตาข่ายรองรับ" ให้ยังมีโอกาสแจ้งเตือนแม้ผู้ใช้ไม่ได้เปิดแท็บทิ้งไว้ ผ่าน Periodic Background Sync
// ซึ่งรองรับเฉพาะ Chrome/Edge (เดสก์ท็อป/แอนดรอยด์) ที่ติดตั้งแอปแล้วและมี engagement พอ — เบราว์เซอร์อื่น
// (Safari/iOS, Firefox) จะไม่มี event นี้เกิดขึ้นเลย เป็นข้อจำกัดของแพลตฟอร์ม ไม่ใช่บั๊ก ตัวที่ทำงานแน่นอนคือ
// การเช็กระหว่างเปิดแอปอยู่ใน src/components/DailyReminderScheduler.tsx
//
// ⚠️ ค่าคงที่ด้านล่างต้องตรงกับ src/lib/reminderDb.ts เป๊ะ (คนละไฟล์เพราะ SW อ่าน localStorage ของหน้าเว็บไม่ได้
// ต้องผ่าน IndexedDB ที่ทั้งสองฝั่งเข้าถึงร่วมกันได้แทน)
const REMINDER_DB_NAME = 'daily-edge-reminder';
const REMINDER_STORE_NAME = 'flags';
const REMINDER_KEY = 'state';
const REMINDER_TAG = 'daily-lesson-reminder';

function readReminderState() {
  return new Promise((resolve) => {
    let req;
    try {
      req = indexedDB.open(REMINDER_DB_NAME, 1);
    } catch {
      resolve(null);
      return;
    }
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(REMINDER_STORE_NAME)) {
        req.result.createObjectStore(REMINDER_STORE_NAME);
      }
    };
    req.onsuccess = () => {
      try {
        const tx = req.result.transaction(REMINDER_STORE_NAME, 'readonly');
        const getReq = tx.objectStore(REMINDER_STORE_NAME).get(REMINDER_KEY);
        getReq.onsuccess = () => resolve(getReq.result || null);
        getReq.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    };
    req.onerror = () => resolve(null);
  });
}

function todayISOInSW() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

async function checkAndNotify() {
  const state = await readReminderState();
  if (!state || !state.enabled) return;
  if (state.lastStudyDate === todayISOInSW()) return; // เรียนวันนี้ไปแล้ว ไม่ต้องเตือน

  await self.registration.showNotification('ถึงเวลาความรู้วันนี้แล้ว 📖', {
    body: 'ใช้เวลาไม่ถึง 10 นาที เปิดแอปแล้วอ่านบทของวันนี้ได้เลย',
    icon: 'icon.svg',
    tag: REMINDER_TAG,
  });
}

self.addEventListener('periodicsync', (event) => {
  if (event.tag === REMINDER_TAG) {
    event.waitUntil(checkAndNotify());
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const existing = clientList.find((c) => 'focus' in c);
      if (existing) return existing.focus();
      if (clients.openWindow) return clients.openWindow('./');
    }),
  );
});
