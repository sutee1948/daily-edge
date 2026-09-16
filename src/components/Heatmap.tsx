import { buildHeatmapWeeks, intensityLevel, type HeatmapCell } from '@/lib/heatmap';

const LEVEL_CLASS: Record<0 | 1 | 2 | 3, string> = {
  0: 'bg-ink/5 dark:bg-white/5',
  1: 'bg-cat-brain/30',
  2: 'bg-cat-brain/60',
  3: 'bg-cat-brain',
};

const DAY_LABELS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

function Cell({ cell }: { cell: HeatmapCell }) {
  if (cell.inFuture) return <div className="h-3 w-3 rounded-sm" />;
  const level = intensityLevel(cell.count);
  return (
    <div
      className={`h-3 w-3 rounded-sm ${LEVEL_CLASS[level]}`}
      title={`${cell.date} · ${cell.count} ครั้ง`}
    />
  );
}

export function Heatmap({ activity, weeks = 10 }: { activity: Record<string, number>; weeks?: number }) {
  const grid = buildHeatmapWeeks(activity, weeks);

  return (
    <div className="flex items-start gap-2 overflow-x-auto pb-1">
      <div className="mt-[18px] flex flex-col gap-1 text-[10px] leading-none text-ink/40 dark:text-paper/40">
        {DAY_LABELS.map((d, i) => (
          <span key={i} className="flex h-3 items-center">
            {i % 2 === 1 ? d : ''}
          </span>
        ))}
      </div>
      <div className="flex gap-1">
        {grid.map((col, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {col.map((cell) => (
              <Cell key={cell.date} cell={cell} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
