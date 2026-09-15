# DAILY EDGE

เว็บแอปเรียนรู้วันละ 10 นาที — กลยุทธ์จีน จิตวิทยา การอ่านคน การบริหารคน ความสัมพันธ์ สมอง การพัฒนาตนเอง และอาชีพโปรแกรมเมอร์

ดูแผนงานฉบับเต็มได้ที่ [PLAN.md](./PLAN.md)

## เริ่มใช้งาน

```bash
npm install
npm run dev
```

เปิด http://localhost:5173

## คำสั่งอื่น

```bash
npm run build      # build production (มี typecheck ในตัว)
npm run preview    # ดูผล build
npm run typecheck  # เช็ก TypeScript อย่างเดียว
```

## สถานะปัจจุบัน (Phase 1–2)

- โครงแอป Vite + React + TypeScript + Tailwind + React Router + Zustand
- Flow ครบวง: วันนี้เรียนอะไร → อ่านบท → ทำควิซ → ดูผล → ทำใหม่/เรียนซ้ำ/เรื่องเกี่ยวข้อง
- เนื้อหาจริง 3 บท คนละหมวด คนละรูปแบบ:
  - `a01` "ชนะโดยไม่ต้องรบ" — ซุนวู (กลยุทธ์จีน, STORY)
  - `c01` Psychological Safety — Project Aristotle (บริหารคน, CLASSIC)
  - `e01` Testing Effect — อ่านซ้ำ vs ทดสอบตัวเอง (สมอง, MYTH-BUST)
- อัลกอริทึม "บทของวันนี้" เลี่ยงหมวด/รูปแบบซ้ำกับ 1-2 วันก่อน + ปรับความยากตาม progress ([src/lib/dailyPicker.ts](./src/lib/dailyPicker.ts))
- Streak + Freeze (เว้นได้ 2 ครั้ง/เดือนไม่เสีย streak) + แบนเนอร์ฉลอง milestone 7/30/100 วัน ([src/lib/streak.ts](./src/lib/streak.ts))
- ระบบแนะนำหัวข้อเกี่ยวข้องแบบให้คะแนนพร้อมเหตุผลต่อการ์ด ([src/lib/recommend.ts](./src/lib/recommend.ts))
- "ทำข้อสอบใหม่" การันตีว่าไม่ออกชุดคำถามซ้ำรอบก่อนหน้า
- ข้อมูลผู้ใช้เก็บใน localStorage ของเบราว์เซอร์ (ยังไม่มี backend) พร้อม versioning/migrate

ฟีเจอร์ที่เหลือ (spaced repetition, คลังบท/ค้นหา, PWA ฯลฯ) อยู่ใน Phase 3 เป็นต้นไป ตาม [PLAN.md](./PLAN.md#11-แผนงานรายเฟส-ขออนุมัติทีละเฟส)
