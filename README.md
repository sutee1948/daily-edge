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
npm test                  # รัน unit test ทั้งหมดด้วย Vitest
npm run test:watch        # เหมือนกันแต่รันค้างไว้ระหว่างพัฒนา
```

## สถานะปัจจุบัน (Phase 1–5)

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
- **หน้า `/library`** ค้นหา (ครอบคลุมทั้งเนื้อหาบท ไม่ใช่แค่ชื่อ) + กรองตามหมวด · **`/bookmarks`** พร้อมจดโน้ตส่วนตัวต่อบท (กดบุ๊กมาร์กได้จากหน้าอ่านบท)
- **ระบบทบทวนแบบเว้นระยะ (SM-2 lite)** — ตอบผิดข้อไหนในควิซหลัก บทนั้นเข้าคิวทบทวนอัตโนมัติ ช่วงเวลา 1→3→7→16→35 วัน ขึ้นการ์ด "ทบทวน 2 นาที" บนหน้า Today เมื่อถึงกำหนด ([src/lib/srs.ts](./src/lib/srs.ts))
- **หน้า `/progress`** heatmap กิจกรรมย้อนหลัง, คะแนนเฉลี่ยรายหมวด, รายการ "บทที่ยังไม่แน่น"
- **หน้า `/settings`** สลับธีม, ส่งออก/นำเข้าข้อมูลเป็นไฟล์ JSON (round-trip ตรงเป๊ะ), รีเซ็ตข้อมูล
- ข้อมูลผู้ใช้เก็บใน localStorage ของเบราว์เซอร์ (ยังไม่มี backend) พร้อม versioning/migrate
- **แอนิเมชัน**: ทรานซิชันหน้า (fade+slide), การ์ดควิซพลิกเวลาเปลี่ยนข้อ, วงแหวนคะแนน pop-in — ผ่าน `framer-motion` + `LazyMotion` (ตัดขนาดบันเดิล) และเคารพ `prefers-reduced-motion`
- **คีย์บอร์ดลัด**: เลขข้อ `1`-`4` เลือกคำตอบ, `Enter` ไปข้อถัดไปหลังเฉลย (Quiz/Review), `/` โฟกัสช่องค้นหา (Library)
- **PWA**: ติดตั้งลงมือถือได้ (`manifest.webmanifest` + ไอคอน SVG) และ**ใช้งานออฟไลน์ได้เต็มแอป** — service worker cache ทุกหน้า/JS/CSS (เพราะใช้ HashRouter ทุกเส้นทางจึงเสิร์ฟจาก `index.html` เดียวกัน) ยืนยันจากการตรวจ precache manifest ของไฟล์ build จริงแล้ว
- **Accessibility**: contrast ทุกสีผ่าน WCAG AA (คำนวณ+ยืนยันด้วย Lighthouse จริง ได้ **100/100**), focus ring ชัดเจนทุกปุ่ม/ลิงก์, ปรับขนาดตัวอักษรได้ที่ `/settings`
- **Vitest**: 74 unit tests ครอบคลุม dailyPicker/srs/recommend/quiz-scoring/streak/readingTime/contentValidation — รันผ่านหมดด้วย `npm test`

**⚠️ ข้อที่ยังไม่ผ่านเกณฑ์:** Lighthouse **Performance บน mobile throttling อยู่ที่ 76-87** (เป้าหมาย ≥90) — วัดจริงแล้วหลายรอบ สาเหตุคือแอปเป็น client-side-rendered SPA ล้วน (ไม่มี SSR/prerender) ทำให้ FCP/LCP ช้าภายใต้การจำลองมือถือ+เน็ตช้าของ Lighthouse (TBT และ CLS อยู่ในเกณฑ์ดีมาก ไม่ใช่ปัญหาโค้ดทำงานช้า) — บน **desktop preset ได้ 99/100** รายละเอียดและทางเลือกถัดไปดูที่ [PLAN.md ข้อ 12](./PLAN.md#12-ความเสี่ยงและวิธีรับมือ)

ฟีเจอร์ที่เหลือ (เนื้อหาเพิ่มเป็น 70 บท, เผยแพร่จริง ฯลฯ) อยู่ใน Phase 6 เป็นต้นไป ตาม [PLAN.md](./PLAN.md#11-แผนงานรายเฟส-ขออนุมัติทีละเฟส)
