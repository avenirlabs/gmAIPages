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

  const { slug } = req.query;

  try {
    if (req.method === "GET") {
      const { data, error } = await sb
        .from("menus")
        .select("data")
        .eq("slug", slug)
        .single();

      if (error || !data) {
        console.error("GET menus error:", error);
        return res.status(404).json({ error: error?.message || "Menu not found" });
      }

      const items = Array.isArray(data?.data?.items)
        ? data.data.items
        : (Array.isArray(data?.data) ? data.data : []);

      return res.json({ items });
    }

    if (req.method === "PUT") {
      const body = req.body || {};
      if (!Array.isArray(body.items)) {
        return res.status(400).json({ error: "Body must be { items: [...] }" });
      }

      const { error: upsertErr } = await sb
        .from("menus")
        .upsert(
          { slug, data: { items: body.items }, updated_at: new Date().toISOString() },
          { onConflict: "slug" }
        );

      if (upsertErr) {
        console.error("PUT menus upsert error:", upsertErr);
        return res.status(500).json({ error: upsertErr.message });
      }

      return res.json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Menu API error:", error);
    return res.status(500).json({ error: error.message });
  }
};