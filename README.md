# DAILY EDGE

เว็บแอปเรียนรู้วันละ 10 นาที — กลยุทธ์จีน จิตวิทยา การอ่านคน การบริหารคน ความสัมพันธ์ สมอง การพัฒนาตนเอง และอาชีพโปรแกรมเมอร์

ดูแผนงานฉบับเต็มได้ที่ [PLAN.md](./PLAN.md) และคู่มือเขียนบทเรียนที่ [docs/content-style-guide.md](./docs/content-style-guide.md)

## เริ่มใช้งาน

```bash
npm install
npm run dev
```

เปิด http://localhost:5173

## คำสั่งอื่น

```bash
npm run build             # build production (validate-content + typecheck ในตัว)
npm run preview           # ดูผล build
npm run typecheck         # เช็ก TypeScript อย่างเดียว
npm run validate-content  # เช็กคุณภาพเนื้อหาทุกบทตามเช็กลิสต์ใน docs/content-style-guide.md
```

## สถานะปัจจุบัน (Phase 1–3)

- โครงแอป Vite + React + TypeScript + Tailwind + React Router + Zustand
- Flow ครบวง: วันนี้เรียนอะไร → อ่านบท → ทำควิซ → ดูผล → ทำใหม่/เรียนซ้ำ/เรื่องเกี่ยวข้อง
- **เนื้อหาจริง 14 บท ครบทั้ง 7 หมวด หมวดละ 2 บท** (655–708 คำ/บท, ~8 นาที/บททุกบท, 8 คำถาม/บท):

  | หมวด | บท 1 | บท 2 |
  |---|---|---|
  | 🀄 กลยุทธ์จีน | `a01` ซุนวู "ชนะโดยไม่ต้องรบ" (STORY) | `a05` หานเฟยจื่อ 势 อำนาจจากตำแหน่ง (CLASSIC) |
  | 🔍 การอ่านคน | `b01` Thin-slicing (STORY) | `b03` จับโกหกแม่นแค่ 54% (MYTH-BUST) |
  | 👥 บริหารคน | `c01` Psychological Safety (CLASSIC) | `c02` Radical Candor (PLAYBOOK) |
  | 💬 ความสัมพันธ์ | `d01` Mere Exposure Effect (CLASSIC) | `d05` ตรงข้ามดึงดูดกัน (ความเชื่อผิด) (MYTH-BUST) |
  | 🧠 สมอง | `e01` Testing Effect (MYTH-BUST) | `e02` นอน=กด Compile ความจำ (CLASSIC) |
  | 🚀 พัฒนาตนเอง | `f01` 10,000 ชั่วโมง (ความเชื่อผิด) (MYTH-BUST) | `f02` Implementation Intentions (PLAYBOOK) |
  | 💻 อาชีพ dev | `g01` DORA 4 ตัวชี้วัด (CLASSIC) | `g04` Planning Fallacy (STORY) |

- อัลกอริทึม "บทของวันนี้" เลี่ยงหมวด/รูปแบบซ้ำกับ 1-2 วันก่อน + ปรับความยากตาม progress ([src/lib/dailyPicker.ts](./src/lib/dailyPicker.ts)) — จำลอง 14 วันแล้วเลือกครบทั้ง 14 บทโดยไม่ซ้ำหมวดติดกันเลย
- Streak + Freeze (เว้นได้ 2 ครั้ง/เดือนไม่เสีย streak) + แบนเนอร์ฉลอง milestone 7/30/100 วัน ([src/lib/streak.ts](./src/lib/streak.ts))
- ระบบแนะนำหัวข้อเกี่ยวข้องแบบให้คะแนนพร้อมเหตุผลต่อการ์ด ทุกบทมี relatedIds ข้ามหมวดอย่างน้อย 1 บท ([src/lib/recommend.ts](./src/lib/recommend.ts))
- "ทำข้อสอบใหม่" การันตีว่าไม่ออกชุดคำถามซ้ำรอบก่อนหน้า
- `scripts/validate-content.ts` ตรวจเช็กลิสต์คุณภาพอัตโนมัติทุกครั้งที่ build (จำนวนคำ, evidence/caveat, ethicalNote, relatedIds ข้ามหมวด, ความถูกต้องของคำถามควิซ ฯลฯ)
- ข้อมูลผู้ใช้เก็บใน localStorage ของเบราว์เซอร์ (ยังไม่มี backend) พร้อม versioning/migrate

ฟีเจอร์ที่เหลือ (spaced repetition, คลังบท/ค้นหา, PWA ฯลฯ) อยู่ใน Phase 4 เป็นต้นไป ตาม [PLAN.md](./PLAN.md#11-แผนงานรายเฟส-ขออนุมัติทีละเฟส)
