import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  define: {
    // Prevent eval-ish dev fallbacks and enable React prod mode
    "process.env.NODE_ENV": JSON.stringify("production"),
    global: "window",
  },
  build: {
    target: "es2019",
    sourcemap: false,             // avoid devtool sources that can use eval
    minify: "terser",             // terser tends to avoid Function constructors
    outDir: "dist/spa",
    emptyOutDir: false,
    lib: {
      entry: path.resolve(__dirname, "widget/src/widget.tsx"),
      name: "GiftsmateChat",      // not used by IIFE runtime, but required by Vite
      formats: ["iife"],
      fileName: () => "giftsmate-chat.js",
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true, // collapses dynamic graph; avoids runtime codegen
      },
    },
  },
  esbuild: {
    supported: { "dynamic-import": true }, // don't polyfill with Function("...")
  },
});
