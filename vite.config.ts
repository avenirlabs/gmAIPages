import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  appType: "spa",
  server: {
    host: "::",
    port: 8080,
    fs: {
      allow: ["./client", "./shared"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**"],
    },
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        configure: (proxy, options) => {
          // Fallback to mock responses when proxy target is unavailable
          proxy.on('error', (err, req, res) => {
            console.log('API proxy error, falling back to mock');
            if (req.url?.includes('/api/gifts/chat')) {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                ok: true,
                reply: "This is a development mock response. Please run the API server or deploy to Vercel for real data.",
                products: [
                  { id: "mock1", title: "Mock Gift 1", url: "/mock1", score: 1, reason: "Development mock", price: 25, currency: "USD" },
                  { id: "mock2", title: "Mock Gift 2", url: "/mock2", score: 0.9, reason: "Development mock", price: 30, currency: "USD" }
                ],
                refineChips: ["Mock Category", "Development"],
                pageInfo: { cursor: null, hasMore: false },
                meta: { source: "mock", requestId: "dev-" + Date.now() }
              }));
            } else {
              res.writeHead(404, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'API not available in development' }));
            }
          });
        }
      }
    }
  },
  build: {
    outDir: "dist",
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
});
