import { defineConfig } from 'vite';
import reactSwc from '@vitejs/plugin-react-swc';
import path from 'node:path';

// ESM build with vendor/app split for modern module-based deployments
export default defineConfig({
  plugins: [reactSwc()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client'),
      '@shared': path.resolve(__dirname, 'shared'),
    },
  },
  build: {
    target: 'es2019',
    outDir: 'dist/chat-esm/assets',
    cssCodeSplit: true,
    sourcemap: false,
    minify: 'terser',
    lib: {
      entry: path.resolve(__dirname, 'src/chat/expose.ts'),
      name: 'GiftsmateChat',
      formats: ['es'],
      fileName: () => 'chat-app.js'
    },
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.info','console.debug','console.warn','console.error','console.log']
      },
      format: {
        comments: false
      }
    },
    rollupOptions: {
      output: {
        exports: 'named',
        chunkFileNames: '[name]-[hash].js',
        assetFileNames: '[name]-[hash][extname]',
        manualChunks(id) {
          // React vendor chunk
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react';
          }
          // TanStack Query separate chunk
          if (id.includes('node_modules/@tanstack/react-query')) {
            return 'query';
          }
        },
      },
    },
    emptyOutDir: true
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  esbuild: {
    legalComments: 'none',
  },
  optimizeDeps: {
    exclude: ['lodash']
  },
});
