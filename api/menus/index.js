import { createClient } from "@supabase/supabase-js";

export default async function handler(_req, res) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    return res.status(500).json({ error: "Supabase env vars missing" });
  }
  const sb = createClient(url, key, { auth: { persistSession: false } });

  const { data, error } = await sb.from("menus").select("slug").order("slug");
  if (error) return res.status(500).json({ error: error.message });

  // convenience: show available slugs and a suggested default
  const slugs = (data || []).map(r => r.slug);
  const hasMain = slugs.includes("main");
  res.json({ slugs, default: hasMain ? "main" : slugs[0] || null });
}