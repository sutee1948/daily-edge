import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/', label: 'วันนี้', emoji: '🏠', end: true },
  { to: '/library', label: 'คลังบท', emoji: '📚', end: false },
  { to: '/progress', label: 'ความคืบหน้า', emoji: '📈', end: false },
  { to: '/settings', label: 'ตั้งค่า', emoji: '⚙️', end: false },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-ink/10 bg-paper/95 backdrop-blur safe-bottom dark:border-white/10 dark:bg-[#17150f]/95">
      <div className="mx-auto flex max-w-2xl items-stretch justify-around">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs transition ${
                isActive ? 'text-edge' : 'text-ink/50 dark:text-paper/50'
              }`
            }
          >
            <span className="text-lg leading-none" aria-hidden>
              {tab.emoji}
            </span>
            {tab.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
