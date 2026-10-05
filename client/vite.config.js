import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Kept in sync with tailwind.config.js tokens (page = lime-wash, door = brand blue).
const PAGE = '#F3F1EA';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // We show our own "new version" prompt (src/components/AppStatus.jsx) instead of swapping code mid-use.
      registerType: 'prompt',
      injectRegister: null,
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Carb Cycle Tracker',
        short_name: 'Carb Cycle',
        description: 'Food log, macros and carb cycling, sized to your body.',
        lang: 'en',
        dir: 'auto',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: PAGE,
        theme_color: PAGE,
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Data: network first (fresh when online), last copy when offline.
            // Per-user responses — this cache is cleared on logout (src/lib/offline.js).
            urlPattern: ({ url, request }) => url.pathname.startsWith('/api/') && request.method === 'GET'
              && !url.pathname.startsWith('/api/admin') && !url.pathname.startsWith('/api/auth'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-get',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 80, maxAgeSeconds: 7 * 24 * 3600 },
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-css' },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-files',
              expiration: { maxEntries: 30, maxAgeSeconds: 365 * 24 * 3600 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    // Allow importing the shared nutrition engine from ../shared
    fs: { allow: ['..'] },
    proxy: {
      '/api': 'http://127.0.0.1:3001',
    },
  },
});
