import { useEffect } from 'react';
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom';
import { Today } from '@/routes/Today';
import { Lesson } from '@/routes/Lesson';
import { Quiz } from '@/routes/Quiz';
import { Result } from '@/routes/Result';
import { Review } from '@/routes/Review';
import { Library } from '@/routes/Library';
import { Bookmarks } from '@/routes/Bookmarks';
import { Progress } from '@/routes/Progress';
import { Settings } from '@/routes/Settings';
import { NotFound } from '@/routes/NotFound';
import { useUserStore } from '@/store/useUserStore';

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

export function App() {
  return (
    <HashRouter>
      <ScrollToTop />
      <ThemeSync />
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
    </HashRouter>
  );
}
