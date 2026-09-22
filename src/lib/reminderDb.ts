/**
 * สะพานเก็บสถานะแจ้งเตือนรายวันไว้ใน IndexedDB (แยกจาก zustand/persist ที่ใช้ localStorage)
 * เพราะ service worker เข้าถึง localStorage ของหน้าเว็บไม่ได้เลย (คนละ storage context) แต่เข้าถึง
 * IndexedDB ได้ — ฝั่งหน้าเว็บ (ผ่าน DailyReminderScheduler) เขียนค่านี้ทุกครั้งที่ enabled/time/lastStudyDate
 * เปลี่ยน ฝั่ง service worker (public/sw-notifications.js) อ่านค่านี้ตอน periodicsync เพื่อตัดสินว่าควรแจ้งเตือนไหม
 *
 * ⚠️ DB_NAME/STORE_NAME/KEY ต้องตรงกับที่ประกาศซ้ำไว้ใน public/sw-notifications.js เพราะไฟล์นั้นเป็น plain JS
 * รันในบริบท service worker แยกกัน import โมดูล TypeScript นี้ตรงๆ ไม่ได้ (ดู workbox.importScripts ใน vite.config.ts)
 */

export const REMINDER_DB_NAME = 'daily-edge-reminder';
export const REMINDER_STORE_NAME = 'flags';
export const REMINDER_KEY = 'state';

export interface ReminderDbState {
  enabled: boolean;
  /** 'HH:mm' — เก็บไว้เผื่ออนาคต ปัจจุบัน service worker ยังไม่ใช้ตัดสินเวลา (periodicsync คุมจังหวะเอง) */
  time: string;
  lastStudyDate: string | null;
}

function openReminderDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('indexedDB not supported'));
      return;
    }
    const req = indexedDB.open(REMINDER_DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(REMINDER_STORE_NAME)) {
        req.result.createObjectStore(REMINDER_STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** เขียนสถานะล่าสุด — เรียกจากฝั่งหน้าเว็บเท่านั้น ล้มเหลวแบบเงียบๆ ได้ (เช่น private mode บล็อก IndexedDB)
 *  เพราะเป็นแค่ตาข่ายรองรับของ periodicsync ไม่ใช่กลไกหลัก ไม่ควรทำให้แอปพังถ้าเขียนไม่สำเร็จ */
export async function writeReminderDbState(state: ReminderDbState): Promise<void> {
  try {
    const db = await openReminderDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(REMINDER_STORE_NAME, 'readwrite');
      tx.objectStore(REMINDER_STORE_NAME).put(state, REMINDER_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // ดูคอมเมนต์ข้างบน — ข้ามเงียบๆ ได้
  }
}
