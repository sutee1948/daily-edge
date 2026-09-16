import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { StreakBadge } from '@/components/StreakBadge';
import { BottomNav } from '@/components/BottomNav';

export function Layout({
  children,
  hideHeader = false,
  hideNav = false,
}: {
  children: ReactNode;
  hideHeader?: boolean;
  hideNav?: boolean;
}) {
  return (
    <div className="min-h-dvh bg-paper text-ink dark:bg-[#17150f] dark:text-paper">
      {!hideHeader && (
        <header className="sticky top-0 z-20 border-b border-ink/10 bg-paper/90 backdrop-blur dark:border-white/10 dark:bg-[#17150f]/90">
          <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
            <Link to="/" className="text-base font-semibold tracking-tight">
              DAILY EDGE
            </Link>
            <StreakBadge />
          </div>
        </header>
      )}
      <main className={`mx-auto max-w-2xl px-4 pt-6 safe-bottom ${hideNav ? 'pb-16' : 'pb-24'}`}>{children}</main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
