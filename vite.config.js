import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// No GitHub Pages o site fica em usuario.github.io/<repo>/, então o workflow
// define BASE_PATH. Em desenvolvimento e em hospedagens de raiz, fica '/'.
const base = process.env.BASE_PATH || '/';

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.png', 'icon-maskable.png', 'apple-touch-icon.png', 'favicon.svg'],
      manifest: {
        name: 'Minha Agenda',
        short_name: 'Agenda',
        description: 'Agenda profissional: agendamentos, clientes e faturamento',
        lang: 'pt-BR',
        id: base,
        scope: base,
        start_url: base,
        display: 'standalone',
        background_color: '#fbf5f6',
        theme_color: '#a8496a',
        icons: [
          { src: 'icon.png', sizes: '1024x1024', type: 'image/png', purpose: 'any' },
          { src: 'icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: { navigateFallback: `${base}index.html` },
    }),
  ],
});
