/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

// Phase 7: เผยแพร่บน GitHub Pages ที่ https://<user>.github.io/daily-edge/ — คนละ origin/path จาก dev server
// ตั้ง GH_PAGES_BASE=/daily-edge/ เฉพาะใน workflow ตอน build เพื่อ deploy (ดู .github/workflows/deploy.yml)
// ปกติ (dev/preview ในเครื่อง) ไม่ตั้งค่านี้ จึงยังรันที่ root '/' เหมือนเดิม
const base = process.env.GH_PAGES_BASE || '/';

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script-defer', // กัน registerSW.js บล็อกการ render หน้าแรก (Lighthouse render-blocking-insight)
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'DAILY EDGE — ความรู้วันละ 10 นาที',
        short_name: 'DAILY EDGE',
        description:
          'เรียนรู้วันละ 10 นาที: กลยุทธ์จีน จิตวิทยา การอ่านคน การบริหารคน ความสัมพันธ์ สมอง และการพัฒนาตนเอง',
        theme_color: '#d6503f',
        background_color: '#fbf9f5',
        display: 'standalone',
        // '.' = โฟลเดอร์เดียวกับ manifest เอง จึงใช้ได้ทั้ง root '/' (dev) และ subpath '/daily-edge/' (GH Pages)
        // โดยไม่ต้อง hardcode base ซ้ำสองที่
        start_url: '.',
        scope: '.',
        lang: 'th',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        // HashRouter แปลว่าทุกเส้นทางเสิร์ฟจาก index.html เดียวกัน — precache แค่ shell ก็พอสำหรับทุกหน้า
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        // ดึง public/sw-notifications.js เข้า service worker ที่ Workbox สร้างอัตโนมัติ (importScripts) —
        // เพิ่ม event listener สำหรับ Periodic Background Sync (แจ้งเตือนรายวันแม้ไม่ได้เปิดแท็บทิ้งไว้)
        // เส้นทางเป็น relative จึงใช้ได้ทั้ง dev (root) และ GH Pages (subpath) โดยไม่ต้องพึ่ง `base` ที่นี่
        importScripts: ['sw-notifications.js'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
