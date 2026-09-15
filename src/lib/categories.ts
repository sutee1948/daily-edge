import type { Category, LessonFormat } from '@/types/content';

export interface CategoryMeta {
  id: Category;
  label: string;
  emoji: string;
  // ระบุ class เต็มแบบ literal (ไม่ใช่ต่อสตริง) เพื่อให้ Tailwind สแกนเจอตอน build
  text: string;
  bg: string;
  bgSoft: string;
  border: string;
  ring: string;
}

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  'china-strategy': {
    id: 'china-strategy',
    label: 'กลยุทธ์จีน',
    emoji: '🀄',
    text: 'text-cat-china',
    bg: 'bg-cat-china',
    bgSoft: 'bg-cat-china/10',
    border: 'border-cat-china',
    ring: 'ring-cat-china',
  },
  'read-people': {
    id: 'read-people',
    label: 'การอ่านคน',
    emoji: '🔍',
    text: 'text-cat-people',
    bg: 'bg-cat-people',
    bgSoft: 'bg-cat-people/10',
    border: 'border-cat-people',
    ring: 'ring-cat-people',
  },
  'people-mgmt': {
    id: 'people-mgmt',
    label: 'การบริหารคน',
    emoji: '👥',
    text: 'text-cat-mgmt',
    bg: 'bg-cat-mgmt',
    bgSoft: 'bg-cat-mgmt/10',
    border: 'border-cat-mgmt',
    ring: 'ring-cat-mgmt',
  },
  relationships: {
    id: 'relationships',
    label: 'ความสัมพันธ์',
    emoji: '💬',
    text: 'text-cat-love',
    bg: 'bg-cat-love',
    bgSoft: 'bg-cat-love/10',
    border: 'border-cat-love',
    ring: 'ring-cat-love',
  },
  brain: {
    id: 'brain',
    label: 'สมอง',
    emoji: '🧠',
    text: 'text-cat-brain',
    bg: 'bg-cat-brain',
    bgSoft: 'bg-cat-brain/10',
    border: 'border-cat-brain',
    ring: 'ring-cat-brain',
  },
  'self-dev': {
    id: 'self-dev',
    label: 'พัฒนาตนเอง',
    emoji: '🚀',
    text: 'text-cat-growth',
    bg: 'bg-cat-growth',
    bgSoft: 'bg-cat-growth/10',
    border: 'border-cat-growth',
    ring: 'ring-cat-growth',
  },
  'dev-career': {
    id: 'dev-career',
    label: 'อาชีพโปรแกรมเมอร์',
    emoji: '💻',
    text: 'text-cat-dev',
    bg: 'bg-cat-dev',
    bgSoft: 'bg-cat-dev/10',
    border: 'border-cat-dev',
    ring: 'ring-cat-dev',
  },
};

export const FORMAT_META: Record<LessonFormat, { label: string; hint: string }> = {
  classic: { label: 'หลักการ', hint: 'ปูหลักการ → ตัวอย่าง → วิธีใช้' },
  story: { label: 'เรื่องเล่า', hint: 'เคสจริง → ถอดบทเรียน' },
  'myth-bust': { label: 'ล้างความเชื่อผิด', hint: 'เชื่อกันว่า... → หลักฐานจริง' },
  playbook: { label: 'สคริปต์ใช้จริง', hint: 'สถานการณ์ → ขั้นตอนที่ใช้ได้ทันที' },
  decode: { label: 'ถอดรหัส', hint: 'ตีความก่อน → เฉลยหลักจิตวิทยา' },
  versus: { label: 'เทียบให้ชัด', hint: 'สองแนวคิดที่คนสับสน' },
};

export function categoryOf(category: Category): CategoryMeta {
  return CATEGORY_META[category];
}
