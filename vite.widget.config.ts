import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

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
      name: "GiftsmateChat",
      fileName: () => "giftsmate-chat.js",
      formats: ["iife"],
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        assetFileNames: (asset) => {
          if (asset.name === "style.css") return "giftsmate-chat.css";
          return asset.name || "asset-[name][extname]";
        },
      },
    },
    outDir: "dist/spa",
    emptyOutDir: false,
  },
});