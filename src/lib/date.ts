/** วันที่วันนี้แบบ ISO 'YYYY-MM-DD' ตามเวลาเครื่องผู้ใช้ */
export function todayISO(): string {
  return toISO(new Date());
}

export function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** จำนวนวันระหว่างสอง ISO date (b - a) เป็นจำนวนเต็ม */
export function diffDaysISO(a: string, b: string): number {
  const da = new Date(`${a}T00:00:00`);
  const db = new Date(`${b}T00:00:00`);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((db.getTime() - da.getTime()) / msPerDay);
}

/** ขยับ ISO date ไป delta วัน (ลบได้) คืนค่าเป็น ISO date ใหม่ */
export function shiftISO(dateISO: string, deltaDays: number): string {
  const d = new Date(`${dateISO}T00:00:00`);
  d.setDate(d.getDate() + deltaDays);
  return toISO(d);
}
