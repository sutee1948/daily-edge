import { useRef, useState } from 'react';
import { Layout } from '@/components/Layout';
import { useUserStore } from '@/store/useUserStore';
import { isNotificationSupported, requestNotificationPermission } from '@/lib/notificationBridge';

const THEME_OPTIONS = [
  { value: 'light', label: '☀️ สว่าง' },
  { value: 'dark', label: '🌙 มืด' },
  { value: 'system', label: '💻 ตามระบบ' },
] as const;

const FONT_SCALE_OPTIONS = [
  { value: 0.9, label: 'เล็ก' },
  { value: 1, label: 'ปกติ' },
  { value: 1.1, label: 'ใหญ่' },
  { value: 1.25, label: 'ใหญ่มาก' },
] as const;

export function Settings() {
  const settings = useUserStore((s) => s.settings);
  const updateSettings = useUserStore((s) => s.updateSettings);
  const exportState = useUserStore((s) => s.exportState);
  const importState = useUserStore((s) => s.importState);
  const resetAll = useUserStore((s) => s.resetAll);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  async function handleReminderToggle(nextEnabled: boolean) {
    setPermissionDenied(false);
    if (!nextEnabled) {
      updateSettings({ reminder: { ...settings.reminder, enabled: false } });
      return;
    }
    const permission = await requestNotificationPermission();
    if (permission === 'granted') {
      updateSettings({ reminder: { ...settings.reminder, enabled: true } });
    } else {
      setPermissionDenied(true);
    }
  }

  function handleExport() {
    const data = exportState();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily-edge-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const ok = importState(parsed);
        setImportMsg(ok ? { ok: true, text: 'นำเข้าข้อมูลสำเร็จ ✅' } : { ok: false, text: 'ไฟล์นี้ไม่ใช่ไฟล์สำรองข้อมูลที่ถูกต้อง' });
      } catch {
        setImportMsg({ ok: false, text: 'อ่านไฟล์ไม่สำเร็จ ตรวจสอบว่าเป็นไฟล์ JSON ที่ export จากแอปนี้' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function handleResetClick() {
    if (!confirmingReset) {
      setConfirmingReset(true);
      return;
    }
    resetAll();
    setConfirmingReset(false);
  }

  return (
    <Layout>
      <section className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">ตั้งค่า</h1>
      </section>

      <section className="card mb-6 p-4">
        <h2 className="mb-3 text-sm font-semibold text-ink/70 dark:text-paper/70">ธีม</h2>
        <div className="flex gap-2">
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => updateSettings({ theme: opt.value })}
              className={`flex-1 rounded-xl2 border px-3 py-2.5 text-sm transition ${
                settings.theme === opt.value
                  ? 'border-edge bg-edge/10 text-edge'
                  : 'border-ink/12 text-ink/70 dark:border-white/12 dark:text-paper/70'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      <section className="card mb-6 p-4">
        <h2 className="mb-3 text-sm font-semibold text-ink/70 dark:text-paper/70">ขนาดตัวอักษร</h2>
        <div className="flex gap-2">
          {FONT_SCALE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => updateSettings({ fontScale: opt.value })}
              className={`flex-1 rounded-xl2 border px-3 py-2.5 text-sm transition ${
                settings.fontScale === opt.value
                  ? 'border-edge bg-edge/10 text-edge'
                  : 'border-ink/12 text-ink/70 dark:border-white/12 dark:text-paper/70'
              }`}
              style={{ fontSize: `${opt.value}em` }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      <section className="card mb-6 p-4">
        <div className="mb-1 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-ink/70 dark:text-paper/70">🔔 แจ้งเตือนรายวัน</h2>
          <button
            type="button"
            role="switch"
            aria-checked={settings.reminder.enabled}
            onClick={() => handleReminderToggle(!settings.reminder.enabled)}
            disabled={!isNotificationSupported()}
            className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:cursor-not-allowed disabled:opacity-40 ${
              settings.reminder.enabled ? 'bg-edge' : 'bg-ink/15 dark:bg-white/15'
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                settings.reminder.enabled ? 'left-[22px]' : 'left-0.5'
              }`}
            />
          </button>
        </div>

        {!isNotificationSupported() ? (
          <p className="text-xs leading-relaxed text-ink/65 dark:text-paper/65">
            เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือน
          </p>
        ) : (
          <>
            <p className="mb-3 text-xs leading-relaxed text-ink/65 dark:text-paper/65">
              เตือนตอนที่ยังไม่ได้เรียนวันนี้ ใช้ได้แน่นอนเมื่อเปิดแท็บ/แอปทิ้งไว้ในเบราว์เซอร์ ส่วนตอนปิดแอปสนิทจะแจ้งเตือนได้
              เฉพาะบางเบราว์เซอร์ที่ติดตั้งแอปแล้ว (เช่น Chrome บนแอนดรอยด์/เดสก์ท็อป) และเวลาที่แจ้งอาจไม่ตรงเป๊ะตามที่ตั้งไว้ —
              ไม่รองรับใน Safari/iOS เลย
            </p>
            {permissionDenied && (
              <p className="mb-3 text-xs font-medium text-cat-china">
                เบราว์เซอร์ปฏิเสธสิทธิ์การแจ้งเตือน กรุณาเปิดสิทธิ์ให้เว็บไซต์นี้ในตั้งค่าเบราว์เซอร์แล้วลองอีกครั้ง
              </p>
            )}
            {settings.reminder.enabled && (
              <label className="flex items-center gap-2 text-sm">
                เตือนเวลา
                <input
                  type="time"
                  value={settings.reminder.time}
                  onChange={(e) => updateSettings({ reminder: { ...settings.reminder, time: e.target.value } })}
                  className="rounded-lg border border-ink/10 bg-paper px-2 py-1.5 text-sm outline-none focus:border-edge dark:border-white/10 dark:bg-white/5"
                />
              </label>
            )}
          </>
        )}
      </section>

      <section className="card mb-6 p-4">
        <h2 className="mb-1 text-sm font-semibold text-ink/70 dark:text-paper/70">สำรอง/กู้คืนข้อมูล</h2>
        <p className="mb-3 text-xs leading-relaxed text-ink/65 dark:text-paper/65">
          ข้อมูลทั้งหมดเก็บอยู่ในเบราว์เซอร์นี้เท่านั้น แนะนำให้ส่งออกเก็บไว้เป็นระยะเพื่อกันข้อมูลหาย
        </p>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={handleExport} className="btn-secondary">
            ⬇️ ส่งออกข้อมูล (JSON)
          </button>
          <button type="button" onClick={handleImportClick} className="btn-secondary">
            ⬆️ นำเข้าข้อมูล
          </button>
          <input ref={fileInputRef} type="file" accept="application/json" onChange={handleFileChange} className="hidden" />
        </div>
        {importMsg && (
          <p className={`mt-3 text-sm ${importMsg.ok ? 'text-cat-brain' : 'text-cat-china'}`}>{importMsg.text}</p>
        )}
      </section>

      <section className="card p-4">
        <h2 className="mb-1 text-sm font-semibold text-ink/70 dark:text-paper/70">รีเซ็ตข้อมูล</h2>
        <p className="mb-3 text-xs leading-relaxed text-ink/65 dark:text-paper/65">
          ล้างความคืบหน้า streak และประวัติทั้งหมด แนะนำให้ส่งออกสำรองไว้ก่อน
        </p>
        <button
          type="button"
          onClick={handleResetClick}
          className={`btn-secondary ${confirmingReset ? '!border-cat-china !text-cat-china' : ''}`}
        >
          {confirmingReset ? 'กดอีกครั้งเพื่อยืนยันการรีเซ็ต' : '🗑️ รีเซ็ตข้อมูลทั้งหมด'}
        </button>
      </section>
    </Layout>
  );
}
