/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

export default defineConfig({
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
        start_url: '/',
        lang: 'th',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        // HashRouter แปลว่าทุกเส้นทางเสิร์ฟจาก index.html เดียวกัน — precache แค่ shell ก็พอสำหรับทุกหน้า
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
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
