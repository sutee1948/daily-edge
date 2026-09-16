import { useRef, useState } from 'react';
import { Layout } from '@/components/Layout';
import { useUserStore } from '@/store/useUserStore';

const THEME_OPTIONS = [
  { value: 'light', label: '☀️ สว่าง' },
  { value: 'dark', label: '🌙 มืด' },
  { value: 'system', label: '💻 ตามระบบ' },
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
        <h2 className="mb-1 text-sm font-semibold text-ink/70 dark:text-paper/70">สำรอง/กู้คืนข้อมูล</h2>
        <p className="mb-3 text-xs leading-relaxed text-ink/50 dark:text-paper/50">
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
        <p className="mb-3 text-xs leading-relaxed text-ink/50 dark:text-paper/50">
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
