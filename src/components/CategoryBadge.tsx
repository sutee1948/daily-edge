import type { Category } from '@/types/content';
import { categoryOf } from '@/lib/categories';

export function CategoryBadge({ category, className = '' }: { category: Category; className?: string }) {
  const meta = categoryOf(category);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${meta.bgSoft} ${meta.text} ${className}`}
    >
      <span aria-hidden>{meta.emoji}</span>
      {meta.label}
    </span>
  );
}
