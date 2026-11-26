import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'react', test: /node_modules[\/](react|react-dom|scheduler)[\/]/ },
            { name: 'supabase', test: /node_modules[\/]@supabase[\/]/ },
          ],
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'favicon.ico', 'apple-touch-icon-180x180.png'],
      manifest: {
        id: '/',
        name: 'Caixa — finanças pessoais',
        short_name: 'Caixa',
        description: 'Controle financeiro pessoal: lançamentos, parcelas, contas e metas.',
        lang: 'pt-BR',
        theme_color: '#151515',
        background_color: '#151515',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/#/overview',
        categories: ['finance', 'productivity'],
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'Lançar', url: '/#/transactions', icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
          { name: 'Contas', url: '/#/bills', icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,ico,png,woff2}'],
        globIgnores: ['splash/**'],
        navigateFallback: '/index.html',
      },
    }),
  ],
});
