import type { LessonFormat } from '@/types/content';
import { FORMAT_META } from '@/lib/categories';

export function FormatBadge({ format, className = '' }: { format: LessonFormat; className?: string }) {
  const meta = FORMAT_META[format];
  return (
    <span
      className={`inline-flex items-center rounded-full border border-ink/15 px-3 py-1 text-sm text-ink/70 dark:border-white/15 dark:text-paper/65 ${className}`}
      title={meta.hint}
    >
      {meta.label}
    </span>
  );
}
