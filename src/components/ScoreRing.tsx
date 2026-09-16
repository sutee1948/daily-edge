import { m } from 'framer-motion';

export function ScoreRing({ score, total, size = 108 }: { score: number; total: number; size?: number }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = total > 0 ? score / total : 0;
  const offset = circumference * (1 - pct);

  const color = pct === 1 ? '#237659' : pct >= 0.75 ? '#2d6bac' : '#b5422c';

  return (
    <m.div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      initial={{ opacity: 0, scale: 0.75 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={10} className="stroke-ink/10 dark:stroke-white/10" fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={10}
          stroke={color}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 600ms 150ms ease-out' }}
        />
      </svg>
      <m.div
        className="absolute inset-0 flex flex-col items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <span className="text-2xl font-semibold text-ink dark:text-paper">
          {score}/{total}
        </span>
      </m.div>
    </m.div>
  );
}
