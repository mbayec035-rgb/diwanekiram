import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'DiwaneKiram — Bibliothèque des Xassidas',
        short_name: 'DiwaneKiram',
        description:
          'Bibliothèque numérique des xassidas : lecture bilingue, transcription phonétique et traduction française.',
        lang: 'fr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#05070a',
        theme_color: '#05070a',
        categories: ['education', 'books'],
        icons: [
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icons-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            urlPattern: /\/data\/.*\.json$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'diwanekiram-data',
              /* Le catalogue compte 558 fichiers JSON pour 277 œuvres (texte,
                 traduction éventuelle, index), 6,3 Mo au total. La limite
                 précédente, 200, était atteinte après quelques œuvres : le
                 cache évacuait sans cesse et la moitié du catalogue demeurait
                 indisponible hors ligne. 1200 laisse le catalogue entier
                 tenir en cache, très au-dessus de la valeur par défaut de
                 Workbox (60), pour que la lecture hors ligne soit complète
                 plutôt que partiellement servie. */
              expiration: { maxEntries: 1200, maxAgeSeconds: 60 * 60 * 24 * 90 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'diwanekiram-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
})
