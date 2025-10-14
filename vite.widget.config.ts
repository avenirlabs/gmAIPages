import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";

// ⚠️ CSP-safe widget build:
// - IIFE only (no dynamic import runtimes)
// - No sourcemaps (avoid inline data: URLs)
// - Single-file output with all CSS inlined
// - Explicit production defines
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, "widget/src/widget.tsx"),
      name: "GiftsmateChatWidget",
      formats: ["iife"],
      fileName: () => "giftsmate-chat.js",
    },
    outDir: "dist/spa",
    emptyOutDir: false,
    sourcemap: false,
    minify: "esbuild",
    target: "es2020",
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        entryFileNames: "giftsmate-chat.js",
        chunkFileNames: "giftsmate-chat.[hash].js",
        assetFileNames: "giftsmate-chat.[hash][extname]",
        inlineDynamicImports: true,
        hoistTransitiveImports: false,
      },
    },
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
    global: "window",
  },
  esbuild: {
    legalComments: "none",
    supported: { "dynamic-import": true },
  },
  css: {
    postcss: "./postcss.config.js",
  },
});
