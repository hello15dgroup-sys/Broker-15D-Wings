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
          name: '15D Wings™ for Private Jet Flight Brokers',
          short_name: '15D Wings™',
          description: 'Plug into our ecosystem of D-Day Flight Certainty—set profit margins at your sole discretion, uncapped by airlines. Win the market.',
          theme_color: '#000000',
          background_color: '#000000',
          icons: [
            {
              src: 'https://lh3.googleusercontent.com/d/1RiTlsS0MWvFhiLVcy6BtJFJSk-3YyoA8',
              sizes: '192x192',
              type: 'image/jpeg'
            },
            {
              src: 'https://lh3.googleusercontent.com/d/1RiTlsS0MWvFhiLVcy6BtJFJSk-3YyoA8',
              sizes: '512x512',
              type: 'image/jpeg'
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
