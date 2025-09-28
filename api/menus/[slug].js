import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  // CORS (optional)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,PUT,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).end();

  const { slug } = req.query;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    return res.status(500).json({ error: "Supabase env vars missing", hasUrl: !!url, hasKey: !!key });
  }
  const sb = createClient(url, key, { auth: { persistSession: false } });

  try {
    if (req.method === "GET") {
      // ✅ tolerant: do NOT use .single(); use maybeSingle() and handle null
      const { data, error } = await sb
        .from("menus")
        .select("data")
        .eq("slug", slug)
        .maybeSingle();

      if (error) {
        console.error("GET menus error:", error);
        return res.status(500).json({ error: error.message, requestedSlug: slug });
      }
      if (!data) {
        // Helpful: list available slugs for debugging
        const { data: all } = await sb.from("menus").select("slug").order("slug");
        return res.status(404).json({
          error: `Menu '${slug}' not found`,
          availableSlugs: all?.map(r => r.slug) ?? []
        });
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
        return res.status(500).json({ error: upsertErr.message, requestedSlug: slug });
      }
      return res.json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    console.error("Menu API crash:", e);
    return res.status(500).json({ error: e?.message || "Internal error" });
  }
}