import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY,
  { auth: { persistSession: false } }
);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Test basic health
    if (req.url === "/api/health") {
      return res.json({ ok: true });
    }

    // Test environment variables
    if (req.url === "/api/health/env") {
      const hasUrl = !!process.env.SUPABASE_URL;
      const hasSvc = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
      return res.json({ ok: hasUrl && hasSvc, hasUrl, hasSvc });
    }

    // Test database connection
    if (req.url === "/api/health/db") {
      const { data, error } = await sb.from("menus").select("slug").limit(1);
      if (error) {
        console.error("DB health error:", error);
        return res.status(500).json({ ok: false, error: error.message });
      }
      return res.json({ ok: true, sample: data?.[0]?.slug ?? null });
    }

    return res.json({ ok: true });
  } catch (error) {
    console.error("Health check error:", error);
    return res.status(500).json({ error: error.message });
  }
};