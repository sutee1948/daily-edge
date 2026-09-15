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
        edge: {
          DEFAULT: '#d6503f', // accent เริ่มต้น (แดงชาด — จีน)
        },
        cat: {
          china: '#c1462f', // แดงชาด
          people: '#7c5cbf', // ม่วง — อ่านคน
          mgmt: '#2f6fb3', // น้ำเงิน — บริหารคน
          love: '#e0784a', // ชมพูอมส้ม — ความสัมพันธ์
          brain: '#2f9e78', // เขียวมิ้นต์ — สมอง
          growth: '#c8932a', // เหลืองอำพัน — พัฒนาตน
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
