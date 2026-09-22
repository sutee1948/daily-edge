# DAILY EDGE

เว็บแอปเรียนรู้วันละ 10 นาที — กลยุทธ์จีน จิตวิทยา การอ่านคน การบริหารคน ความสัมพันธ์ สมอง การพัฒนาตนเอง และอาชีพโปรแกรมเมอร์

🔗 **ใช้งานจริง:** https://sutee1948.github.io/daily-edge/ (deploy อัตโนมัติจาก branch `main` ผ่าน [.github/workflows/deploy.yml](./.github/workflows/deploy.yml))

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
npm run stats             # ตารางจำนวนคำ/นาที/รูปแบบ/ความยากของทุกบท
npm run gen-content       # สร้าง src/content/meta.generated.ts ใหม่จากไฟล์บท
npm test                  # รัน unit test ทั้งหมดด้วย Vitest
npm run test:watch        # เหมือนกันแต่รันค้างไว้ระหว่างพัฒนา
```

## สถานะปัจจุบัน (Phase 1–7)

- โครงแอป Vite + React + TypeScript + Tailwind + React Router + Zustand
- Flow ครบวง: วันนี้เรียนอะไร → อ่านบท → ทำควิซ → ดูผล → ทำใหม่/เรียนซ้ำ/เรื่องเกี่ยวข้อง
- **เนื้อหาจริง 70 บท ครบทั้ง 7 หมวด หมวดละ 10 บท** (~650–800 คำ/บท, ~8–9 นาที/บททุกบท, 8–9 คำถาม/บท) — รายการเต็มดู [docs/lesson-catalogue.md](./docs/lesson-catalogue.md): 🀄 กลยุทธ์จีน · 🔍 การอ่านคน · 👥 บริหารคน · 💬 ความสัมพันธ์ · 🧠 สมอง · 🚀 พัฒนาตนเอง · 💻 อาชีพ dev — ทุกบทมี evidence + caveat + แหล่งอ้างอิง (บทหมวดอ่านคน/ความสัมพันธ์มี ethicalNote)
- **เส้นทางการเรียน 10 เส้น** ([src/content/tracks.ts](./src/content/tracks.ts)): 7 เส้นรายหมวด + *จากโปรแกรมเมอร์สู่หัวหน้าทีม* / *โน้มน้าวและเจรจา* / *เรียนรู้ให้เร็วและจำนาน* — หน้า `/tracks`, หน้ารายละเอียด `/tracks/:id`, และการ์ด "เรียนต่อ" บนหน้า Today
- **สรุปรายสัปดาห์** บน `/progress` (จันทร์–อาทิตย์ เลื่อนดูย้อนหลังได้): ตัวเลขจริง ประโยคเด็ดของบทที่จบ บทที่ควรทบทวน สิ่งที่ควรลองสัปดาห์หน้า ([src/lib/weeklyRecap.ts](./src/lib/weeklyRecap.ts))
- **โหลดเนื้อหาแบบ lazy**: ข้อมูลเบา (meta) ของทุกบทอยู่ในบันเดิลหลัก เนื้อหาเต็มแยก 1 chunk ต่อบท `npm run gen-content` สร้าง meta อัตโนมัติ (รันให้เองใน dev/build/test)
- อัลกอริทึม "บทของวันนี้" เลี่ยงหมวด/รูปแบบซ้ำกับ 1-2 วันก่อน + ปรับความยากตาม progress ([src/lib/dailyPicker.ts](./src/lib/dailyPicker.ts)) — จำลอง 70 วันผ่าน store จริงได้ครบ 70 บทไม่ซ้ำ และไม่ซ้ำหมวดติดกันเลย ([src/store/dailyPickSimulation.test.ts](./src/store/dailyPickSimulation.test.ts))
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
- **Vitest**: 133 tests ครอบคลุม dailyPicker (รวมจำลอง 70 วันผ่าน store จริง)/srs/recommend/quiz-scoring/streak/readingTime/contentValidation/tracks/weeklyRecap/dailyReminder/smoke render ของหน้าใหม่ — รันผ่านหมดด้วย `npm test`
- **Deploy: GitHub Pages** ผ่าน GitHub Actions ([.github/workflows/deploy.yml](./.github/workflows/deploy.yml)) — push เข้า `main` แล้ว build+deploy อัตโนมัติ ลิงก์ใช้งานจริงอยู่ด้านบนของไฟล์นี้
- **แจ้งเตือนรายวัน** ที่ `/settings` (ปิดไว้เป็นค่าเริ่มต้น) — ตัวเช็กหลักทำงานตอนแอปเปิดอยู่ ([src/components/DailyReminderScheduler.tsx](./src/components/DailyReminderScheduler.tsx) + ตรรกะล้วนๆ ที่ [src/lib/dailyReminder.ts](./src/lib/dailyReminder.ts)) เสริมด้วย Periodic Background Sync ผ่าน service worker ([public/sw-notifications.js](./public/sw-notifications.js)) เป็นตาข่ายรองรับตอนแอปปิดสนิท **แต่รองรับเฉพาะบางเบราว์เซอร์ (Chrome/Edge ที่ติดตั้งแอปแล้ว) ไม่รองรับ Safari/iOS และ Firefox เลย** เพราะแอปนี้ไม่มี backend/push server จึงใช้ Web Push แบบเต็มรูปแบบไม่ได้ — บอกข้อจำกัดนี้ไว้ตรงๆ ในหน้า Settings

**⚠️ ข้อที่ยังไม่ผ่านเกณฑ์:** Lighthouse **Performance บน mobile throttling อยู่ที่ 76-87** (เป้าหมาย ≥90) — วัดจริงแล้วหลายรอบ สาเหตุคือแอปเป็น client-side-rendered SPA ล้วน (ไม่มี SSR/prerender) ทำให้ FCP/LCP ช้าภายใต้การจำลองมือถือ+เน็ตช้าของ Lighthouse (TBT และ CLS อยู่ในเกณฑ์ดีมาก ไม่ใช่ปัญหาโค้ดทำงานช้า) — บน **desktop preset ได้ 99/100** รายละเอียดและทางเลือกถัดไปดูที่ [PLAN.md ข้อ 12](./PLAN.md#12-ความเสี่ยงและวิธีรับมือ)

ทุกเฟสตามแผน (1–7) เสร็จแล้ว รายละเอียดการอนุมัติแต่ละเฟสดูที่ [PLAN.md ข้อ 15](./PLAN.md#15-บันทึกการอนุมัติ) ฟีเจอร์เสริมที่ยังไม่ได้ทำ (sync ข้ามเครื่อง, TTS ภาษาไทย, export เข้า Obsidian/Notion) อยู่ใน [PLAN.md ข้อ 11 Phase 7](./PLAN.md#11-แผนงานรายเฟส-ขออนุมัติทีละเฟส) เผื่ออยากทำต่อในอนาคต
