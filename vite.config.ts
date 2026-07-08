import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            const normalizedId = id.replace(/\\/g, '/');
            if (!normalizedId.includes('node_modules')) return;
            if (normalizedId.includes('/react/') || normalizedId.includes('/react-dom/')) {
              return 'react-vendor';
            }
            if (normalizedId.includes('@supabase')) {
              return 'supabase-vendor';
            }
            if (normalizedId.includes('/lucide-react/')) {
              return 'icons-vendor';
            }
            if (normalizedId.includes('/motion/')) {
              return 'motion-vendor';
            }
          },
        },
      },
    },
  };
});
