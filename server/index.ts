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
      methods: ["GET", "POST", "OPTIONS"],
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

  map("get", "/api/demo", handleDemo);

  // Nav links
  map("get", "/api/nav/links", getNavLinks);

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
