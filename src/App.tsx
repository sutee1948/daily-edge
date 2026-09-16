import { lazy, Suspense, useEffect } from 'react';
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom';
import { LazyMotion, domAnimation } from 'framer-motion';
import { Today } from '@/routes/Today';
import { useUserStore } from '@/store/useUserStore';

// แบ่งโค้ดตามเส้นทาง (route-based code splitting) — คงเหลือแค่ Today.tsx (หน้าแรก) ไว้ในบันเดิลหลัก
// ที่เหลือโหลดแยกทีหลังตามจริงเมื่อผู้ใช้ไปหน้านั้นๆ ลดขนาดบันเดิลตั้งต้นลงมาก (ดีต่อ Lighthouse Performance)
const Lesson = lazy(() => import('@/routes/Lesson').then((m) => ({ default: m.Lesson })));
const Quiz = lazy(() => import('@/routes/Quiz').then((m) => ({ default: m.Quiz })));
const Result = lazy(() => import('@/routes/Result').then((m) => ({ default: m.Result })));
const Review = lazy(() => import('@/routes/Review').then((m) => ({ default: m.Review })));
const Library = lazy(() => import('@/routes/Library').then((m) => ({ default: m.Library })));
const Bookmarks = lazy(() => import('@/routes/Bookmarks').then((m) => ({ default: m.Bookmarks })));
const Progress = lazy(() => import('@/routes/Progress').then((m) => ({ default: m.Progress })));
const Settings = lazy(() => import('@/routes/Settings').then((m) => ({ default: m.Settings })));
const NotFound = lazy(() => import('@/routes/NotFound').then((m) => ({ default: m.NotFound })));

function RouteFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-paper dark:bg-[#17150f]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink/15 border-t-edge dark:border-white/15" />
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function ThemeSync() {
  const theme = useUserStore((s) => s.settings.theme);

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    function apply() {
      const isDark = theme === 'dark' || (theme === 'system' && media.matches);
      root.classList.toggle('dark', isDark);
    }

    apply();
    if (theme === 'system') {
      media.addEventListener('change', apply);
      return () => media.removeEventListener('change', apply);
    }
  }, [theme]);

  return null;
}

function FontScaleSync() {
  const fontScale = useUserStore((s) => s.settings.fontScale);

  useEffect(() => {
    document.documentElement.style.fontSize = `${16 * fontScale}px`;
  }, [fontScale]);

  return null;
}

export function App() {
  return (
    <HashRouter>
      <ScrollToTop />
      <ThemeSync />
      <FontScaleSync />
      {/* LazyMotion + domAnimation: ใช้ <m.*> แทน <motion.*> ทั่วแอป เพื่อตัดขนาดบันเดิลของ
          framer-motion ลงมาก (ไม่โหลดฟีเจอร์ drag/layout ที่ไม่ได้ใช้) */}
      <LazyMotion features={domAnimation} strict>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Today />} />
            <Route path="/lesson/:id" element={<Lesson />} />
            <Route path="/lesson/:id/quiz" element={<Quiz />} />
            <Route path="/lesson/:id/result" element={<Result />} />
            <Route path="/lesson/:id/review" element={<Review />} />
            <Route path="/library" element={<Library />} />
            <Route path="/bookmarks" element={<Bookmarks />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </LazyMotion>
    </HashRouter>
  );
}
