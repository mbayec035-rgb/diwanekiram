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
        /* Tout le catalogue est précaché : les 556 fichiers JSON (5,5 Mo)
           contiennent le manifeste, les auteurs, les versets et les
           traductions. Une fois l'application ouverte en ligne, chaque œuvre
           reste lisible hors ligne — y compris celles jamais consultées. */
        globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2,json}'],
        navigateFallback: 'index.html',
        /* Supprime les anciens précaches lors d'une mise à jour du service
           worker, pour ne pas conserver indéfiniment les fichiers obsolètes. */
        cleanupOutdatedCaches: true,
      },
      devOptions: { enabled: false },
    }),
  ],
})
