import { Link, useLocation } from 'react-router-dom';
import { useEffect, useRef, type ReactNode } from 'react';
import { m } from 'framer-motion';
import { StreakBadge } from '@/components/StreakBadge';
import { BottomNav } from '@/components/BottomNav';

// ข้าม animation ตอนโหลดหน้าแรกสุดของเซสชัน (กันดีเลย์ FCP/LCP จากการ fade-in)
// แต่ยังคงทรานซิชันไว้ตอนสลับหน้าในแอประหว่างใช้งานต่อไปตามปกติ
let hasAnimatedOnce = false;

export function Layout({
  children,
  hideHeader = false,
  hideNav = false,
}: {
  children: ReactNode;
  hideHeader?: boolean;
  hideNav?: boolean;
}) {
  const { pathname } = useLocation();
  const skipInitialAnimation = useRef(!hasAnimatedOnce).current;

  useEffect(() => {
    hasAnimatedOnce = true;
  }, []);

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
      <m.main
        key={pathname}
        initial={skipInitialAnimation ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className={`mx-auto max-w-2xl px-4 pt-6 safe-bottom ${hideNav ? 'pb-16' : 'pb-24'}`}
      >
        {children}
      </m.main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
