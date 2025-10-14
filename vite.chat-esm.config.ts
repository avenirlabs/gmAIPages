import { defineConfig } from 'vite';
import reactSwc from '@vitejs/plugin-react-swc';
import path from 'node:path';

// ESM build with vendor/app split for modern module-based deployments
// Optimized for small bundle sizes with aggressive minification
export default defineConfig({
  plugins: [reactSwc()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client'),
      '@shared': path.resolve(__dirname, 'shared'),
    },
  },
  build: {
    target: 'es2020',
    outDir: 'dist/chat-esm',
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
        pure_funcs: ['console.info', 'console.debug', 'console.warn', 'console.error', 'console.log'],
        passes: 2,
        unsafe: true,
        unsafe_comps: true,
        unsafe_math: true,
        unsafe_methods: true,
        unsafe_proto: true,
        unsafe_regexp: true,
        unsafe_undefined: true,
      },
      mangle: {
        safari10: true,
      },
      format: {
        comments: false,
        ecma: 2020,
      },
    },
    rollupOptions: {
      output: {
        exports: 'named',
        chunkFileNames: '[name]-[hash].js',
        assetFileNames: '[name]-[hash][extname]',
        compact: true,
        manualChunks(id) {
          // React vendor chunk (most stable, longest cache)
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor';
          }
          // TanStack Query separate chunk (can be lazy loaded)
          if (id.includes('node_modules/@tanstack/react-query')) {
            return 'query-vendor';
          }
          // Radix UI components (if used)
          if (id.includes('node_modules/@radix-ui')) {
            return 'ui-vendor';
          }
        },
      },
    },
    emptyOutDir: true,
    chunkSizeWarningLimit: 150,
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    'global': 'window',
  },
  esbuild: {
    legalComments: 'none',
    treeShaking: true,
  },
  optimizeDeps: {
    exclude: ['lodash'],
  },
});
