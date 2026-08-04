import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [],
        manifest: {
          name: '15D WINGS',
          short_name: '15D',
          description: '15D WINGS Coordination App',
          theme_color: '#000000',
          background_color: '#000000',
          icons: [
            {
              src: 'https://uploads.onecompiler.io/43z22g7dk/44b5wdtpn/1000301979.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'https://uploads.onecompiler.io/43z22g7dk/44b5wdtpn/1000301979.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 10485760 // 10 MB
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
