import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      /* Le nouveau service worker attend le clic « Recharger » : il ne
         supprime plus les anciens chunks sous une page ouverte. */
      registerType: 'prompt',
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
        /* Le noyau applicatif seul est précaché : HTML, JS, CSS, polices,
           icônes. Il s'installe en quelques secondes et garantit que
           l'application s'ouvre hors ligne, même sur un réseau instable.
           Les JSON du catalogue sont téléchargés séparément, par lots,
           avec reprise et progression (voir src/services/offlineCatalog.ts). */
        globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2,ico}'],
        navigateFallback: 'index.html',
        /* Supprime les anciens précaches lors d'une mise à jour du service
           worker, pour ne pas conserver indéfiniment les fichiers obsolètes. */
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            /* Catalogue : servi depuis le cache, alimenté par le
               téléchargement repris. Les URL ne sont pas versionnées, donc
               le service worker change de cache quand le manifeste change. */
            urlPattern: /\/data\/.*\.json$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'diwanekiram-data-v3',
              expiration: {
                maxEntries: 700,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
})
