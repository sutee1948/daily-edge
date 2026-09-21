// โครงสร้างข้อมูลเนื้อหา — ตรงตาม PLAN.md ข้อ 9

export type Category =
  | 'china-strategy'
  | 'read-people'
  | 'people-mgmt'
  | 'relationships'
  | 'brain'
  | 'self-dev'
  | 'dev-career';

export type LessonFormat = 'classic' | 'story' | 'myth-bust' | 'playbook' | 'decode' | 'versus';

export type Difficulty = 1 | 2 | 3;

export interface Beat {
  heading: string;
  body: string;
}

export interface EvidenceSource {
  label: string;
  url?: string;
  year?: number;
}

export interface Evidence {
  summary: string;
  /** บอกข้อจำกัดของงานวิจัย เช่น replicate ได้บางส่วน — บังคับใส่ถ้ามีข้อโต้แย้ง */
  caveat?: string;
  sources: EvidenceSource[];
}

export type QuestionType = 'mcq' | 'scenario' | 'true-false-why' | 'odd-one-out';

export interface QuestionOption {
  id: string;
  text: string;
  /** อธิบายทุกตัวเลือก รวมตัวลวง ว่าทำไมถูก/ผิด */
  explain: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  difficulty: Difficulty;
  prompt: string;
  options: QuestionOption[];
  correctId: string;
  /** ข้อนี้วัด beat ไหน (index เริ่มที่ 0) — ใช้ชี้จุดที่ต้องอ่านซ้ำ */
  targetBeat?: number;
}

/** เนื้อหาดิบที่เขียนโดยผู้เขียนบท — ยังไม่มี wordCount/estimatedMinutes */
export interface LessonSource {
  id: string;
  title: string;
  subtitle: string;
  category: Category;
  format: LessonFormat;
  difficulty: Difficulty;
  tags: string[];
  hook: string;
  beats: Beat[];
  evidence: Evidence;
  tryToday: string[];
  keyTakeaway: string;
  ethicalNote?: string;
  relatedIds: string[];
  questions: Question[];
}

/** เนื้อหาที่ผ่านการคำนวณ wordCount/estimatedMinutes แล้ว — ใช้แสดงผลจริง */
export interface Lesson extends LessonSource {
  wordCount: number;
  estimatedMinutes: number;
}

/** ข้อมูลเบาของบทเรียน — อยู่ในบันเดิลหลักตลอด ใช้กับหน้ารายการ/การ์ด/ตัวเลือกบทประจำวัน/ระบบแนะนำ
 *  ส่วนเนื้อหาเต็ม (beats, evidence, quiz ฯลฯ) โหลดแยกตามบทเมื่อเปิดอ่านจริง (ดู src/content/index.ts) */
export type LessonMeta = Pick<
  Lesson,
  | 'id'
  | 'title'
  | 'subtitle'
  | 'category'
  | 'format'
  | 'difficulty'
  | 'tags'
  | 'hook'
  | 'relatedIds'
  | 'wordCount'
  | 'estimatedMinutes'
>;

/** เส้นทางการเรียน (Track) — ชุดบทเรียนที่จัดลำดับจากง่ายไปยากสำหรับเป้าหมายเดียว
 *  ใช้ id ของบทเรียนล้วนๆ (ไม่ซ้ำสำเนาเนื้อหา) จึงอยู่ในบันเดิลหลักได้โดยไม่บวม */
export interface Track {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  /** ผู้เรียนแบบไหนเหมาะกับเส้นทางนี้ — แสดงในหน้ารายละเอียด */
  audience: string;
  /** รหัสบทตามลำดับที่ควรเรียน */
  lessonIds: string[];
}
