import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
let helmet: any = null;
let compression: any = null;
let rateLimit: any = null;
try {
  helmet = require("helmet").default ?? require("helmet");
} catch {}
try {
  compression = require("compression").default ?? require("compression");
} catch {}
try {
  rateLimit =
    require("express-rate-limit").default ?? require("express-rate-limit");
} catch {}
import { handleDemo } from "./routes/demo";
import { handleChat } from "./routes/gifts";
import { getHome, getBySlug, refreshAll } from "./routes/pages";
import { getNavLinks } from "./routes/nav";
import { getMenu, updateMenu } from "./routes/menus";
import {
  getFeaturedProducts,
  getProducts,
  clearWooCache,
} from "./routes/woocommerce";

function allowedOrigins(): string[] {
  const env = process.env.ALLOWED_ORIGINS || "";
  return env
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function createServer() {
  const app = express();

  // Security & perf
  if (helmet) app.use(helmet({ contentSecurityPolicy: false }));
  if (compression) app.use(compression());

  // CORS allowlist (no credentials by default)
  const origins = allowedOrigins();
  app.use(
    cors({
      origin: origins.length ? origins : undefined,
      methods: ["GET", "POST", "PUT", "OPTIONS"],
      credentials: false,
    }),
  );

  // Body parsers with limits
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  // Rate limiters
  const apiLimiter = rateLimit
    ? rateLimit({
        windowMs: 60_000,
        max: 60,
        standardHeaders: true,
        legacyHeaders: false,
      })
    : (_req: any, _res: any, next: any) => next();
  const giftsLimiter = rateLimit
    ? rateLimit({
        windowMs: 60_000,
        max: 20,
        standardHeaders: true,
        legacyHeaders: false,
      })
    : (_req: any, _res: any, next: any) => next();
  app.use("/api", apiLimiter as any);

  // Example API routes
  // Helper to register both /api/* and /* for Netlify function rewrite compatibility
  const map = (method: "get" | "post", path: string, handler: any) => {
    (app as any)[method](path, handler);
    const withoutApi = path.replace(/^\/api\//, "/");
    if (withoutApi !== path) (app as any)[method](withoutApi, handler);
  };

  map("get", "/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  map("get", "/api/debug/env", (_req, res) => {
    res.json({
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      supabaseUrlPrefix: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.substring(0, 20) + '...' : 'missing',
      hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE,
      supabaseKeyPrefix: process.env.SUPABASE_SERVICE_ROLE ? process.env.SUPABASE_SERVICE_ROLE.substring(0, 20) + '...' : 'missing',
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      openaiKeyPrefix: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 20) + '...' : 'missing',
      hasAlgolia: !!process.env.ALGOLIA_APP_ID,
      algoliaAppId: process.env.ALGOLIA_APP_ID || 'missing',
      nodeEnv: process.env.NODE_ENV,
      platform: process.platform,
      isVercel: !!process.env.VERCEL,
      timestamp: new Date().toISOString(),
      envKeysCount: Object.keys(process.env).length
    });
  });

  map("get", "/api/debug/supabase", async (_req, res) => {
    try {
      const { getSupabaseAdmin } = await import("./services/supabase");
      const sb = getSupabaseAdmin();
      if (!sb) {
        return res.json({ error: "Supabase client not initialized - missing credentials" });
      }

      // Test actual database connection by querying pages table
      const { data, error } = await sb
        .from("pages")
        .select("count")
        .limit(1);

      return res.json({
        supabaseConnected: true,
        databaseTest: error ? `Database Error: ${error.message}` : `Database connected - found pages table`,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      return res.json({
        supabaseConnected: false,
        error: err.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  map("get", "/api/demo", handleDemo);

  // Nav links
  map("get", "/api/nav/links", getNavLinks);

  // Menu routes
  map("get", "/api/menus/main", getMenu);
  map("put", "/api/menus/main", updateMenu);

  // Gift chat route (tighter rate limit)
  (app as any).post("/api/gifts/chat", giftsLimiter, handleChat);
  (app as any).post("/gifts/chat", giftsLimiter, handleChat);

  // Page cache routes
  map("get", "/api/pages/home", getHome);
  map("get", "/api/pages/:slug", getBySlug);
  map("post", "/api/admin/cache/refresh", async (_req, res, next) => {
    try {
      clearWooCache();
      return await (refreshAll as any)(_req, res, next);
    } catch (e) {
      next(e);
    }
  });

  // WooCommerce products
  map("get", "/api/woocommerce/featured", getFeaturedProducts);
  map("get", "/api/woocommerce/products", getProducts);


  // Central error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const code = typeof err?.status === "number" ? err.status : 500;
    res.status(code).json({ error: err?.message || "Server error", code });
  });

  return app;
}
