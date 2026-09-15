import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.png', 'icon-maskable.png'],
      manifest: {
        name: 'Minha Agenda',
        short_name: 'Agenda',
        description: 'Agenda profissional: agendamentos, clientes e faturamento',
        lang: 'pt-BR',
        start_url: '/',
        display: 'standalone',
        background_color: '#EFEDEA',
        theme_color: '#C97C8E',
        icons: [
          { src: 'icon.png', sizes: '1024x1024', type: 'image/png', purpose: 'any' },
          { src: 'icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
});
