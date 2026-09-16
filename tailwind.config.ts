import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        thai: ['"IBM Plex Sans Thai"', '"Noto Sans Thai"', 'system-ui', 'sans-serif'],
        latin: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: {
          DEFAULT: '#1c1a17',
          soft: '#4a453f',
        },
        paper: {
          DEFAULT: '#fbf9f5',
          raised: '#ffffff',
        },
        // สีทุกตัวด้านล่างผ่านการคำนวณ WCAG contrast แบบ worst-case แล้ว (>=4.6:1) ครอบคลุมทั้ง
        // ข้อความล้วนบนพื้น paper และกรณีที่ใช้จริงบ่อยสุดคือ CategoryBadge (ตัวหนังสือสีเดียวกับพื้น
        // การ์ดที่ tint 10% ของตัวเองซ้อนบนการ์ดสีขาว) ซึ่งเข้มกว่าที่ตาคาดไว้มาก — ยืนยันด้วย Lighthouse
        // accessibility audit จริงแล้ว (ดู PLAN.md ข้อ 11 Phase 5) ถ้าจะปรับสีใหม่ ต้องคำนวณ contrast ซ้ำ ไม่ใช่กะเอา
        edge: {
          DEFAULT: '#b34335', // accent เริ่มต้น (แดงชาด — จีน)
        },
        cat: {
          china: '#b5422c', // แดงชาด
          people: '#7657b5', // ม่วง — อ่านคน
          mgmt: '#2d6bac', // น้ำเงิน — บริหารคน
          love: '#9e5534', // ส้มอมน้ำตาล — ความสัมพันธ์
          brain: '#237659', // เขียวมิ้นต์เข้ม — สมอง
          growth: '#86631c', // เหลืองอำพันเข้ม/มัสตาร์ด — พัฒนาตน
          dev: '#4f6478', // เทาน้ำเงิน — dev
        },
      },
      maxWidth: {
        prose: '68ch',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
} satisfies Config;
