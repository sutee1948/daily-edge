import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { ProgressBar } from '@/components/ProgressBar';
import { TRACKS } from '@/content/tracks';
import { useUserStore } from '@/store/useUserStore';
import { computeTrackProgress } from '@/lib/trackProgress';

export function Tracks() {
  const lessons = useUserStore((s) => s.lessons);

  return (
    <Layout>
      <section className="mb-6">
        <Link to="/library" className="mb-3 inline-block text-sm text-ink/65 hover:underline dark:text-paper/65">
          ← คลังบท
        </Link>
        <h1 className="mb-1 text-2xl font-bold tracking-tight">🗺 เส้นทางการเรียน</h1>
        <p className="text-sm text-ink/65 dark:text-paper/65">
          ชุดบทเรียนเรียงจากเข้าใจง่ายไปลึก เส้นละ 10 บท เลือกตามเป้าหมาย บทเดียวกันนับความคืบหน้าร่วมกันทุกเส้น
        </p>
      </section>

      <div className="grid gap-3">
        {TRACKS.map((track) => {
          const progress = computeTrackProgress(track, lessons);
          return (
            <Link
              key={track.id}
              to={`/tracks/${track.id}`}
              className="card flex flex-col gap-3 p-5 transition hover:border-ink/25 dark:hover:border-white/25"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl leading-none" aria-hidden>
                  {track.emoji}
                </span>
                <div>
                  <h2 className="text-base font-semibold leading-snug">{track.title}</h2>
                  <p className="mt-1 text-sm text-ink/65 dark:text-paper/65">{track.subtitle}</p>
                </div>
              </div>
              <div>
                <ProgressBar value={progress.percent} />
                <p className="mt-1.5 text-xs text-ink/65 dark:text-paper/65">
                  {progress.completed ? '✓ เรียนครบทั้งเส้นแล้ว' : `เรียนจบแล้ว ${progress.done}/${progress.total} บท`}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </Layout>
  );
}
