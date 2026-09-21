import { Link } from 'react-router-dom';
import { ProgressBar } from '@/components/ProgressBar';
import type { LessonMeta, Track } from '@/types/content';
import type { TrackProgress } from '@/lib/trackProgress';

/** การ์ด "เรียนต่อในเส้นทาง" บนหน้า Today — แยกเป็นคอมโพเนนต์ล้วนๆ (รับ props อย่างเดียว) เพื่อทดสอบเรนเดอร์ได้โดยไม่ต้องพึ่ง store */
export function ContinueTrackCard({
  track,
  progress,
  nextLesson,
}: {
  track: Track;
  progress: TrackProgress;
  nextLesson: LessonMeta;
}) {
  return (
    <section className="card mb-3 p-4" aria-label="เรียนต่อในเส้นทาง">
      <p className="mb-1 text-xs text-ink/65 dark:text-paper/65">เส้นทางที่กำลังเรียน</p>
      <Link to={`/tracks/${track.id}`} className="text-base font-semibold hover:underline">
        {track.emoji} {track.title}
      </Link>
      <ProgressBar value={progress.percent} className="mt-3" />
      <p className="mt-1.5 text-xs text-ink/65 dark:text-paper/65">
        เรียนจบแล้ว {progress.done}/{progress.total} บท
      </p>
      <Link
        to={`/lesson/${nextLesson.id}`}
        className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-ink/5 p-3 text-sm transition hover:bg-ink/10 dark:bg-white/5 dark:hover:bg-white/10"
      >
        <span>
          <span className="block text-xs text-ink/65 dark:text-paper/65">บทถัดไป</span>
          <span className="font-medium">{nextLesson.title}</span>
        </span>
        <span className="shrink-0 text-edge" aria-hidden>
          เรียนต่อ →
        </span>
      </Link>
    </section>
  );
}
