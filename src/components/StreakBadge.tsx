import { useUserStore } from '@/store/useUserStore';

export function StreakBadge() {
  const streak = useUserStore((s) => s.streak);

  return (
    <div
      className="inline-flex items-center gap-1.5 rounded-full bg-ink/5 px-3 py-1.5 text-sm font-medium text-ink dark:bg-white/10 dark:text-paper"
      title={`สถิติสูงสุด ${streak.best} วัน · เหลือ Freeze ${streak.freezesLeft} ครั้ง`}
    >
      <span aria-hidden>🔥</span>
      <span>{streak.current} วันติด</span>
    </div>
  );
}
