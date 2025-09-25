import type { RequestHandler } from "express";
import { getSupabaseAdmin } from "../services/supabase";

// Simple in-memory cache
const cache = new Map<string, { at: number; data: any }>();
const TTL_MS = 1000 * 60 * 10; // 10 minutes

function setCache(key: string, data: any) {
  cache.set(key, { at: Date.now(), data });
}
function getCache<T = any>(key: string): T | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > TTL_MS) {
    cache.delete(key);
    return null;
  }
  return hit.data as T;
}

export const getHome: RequestHandler = async (_req, res) => {
  const key = "home";
  const hit = getCache(key);
  if (hit) return res.json(hit);
  const sb = getSupabaseAdmin();
  if (!sb) return res.status(500).json({ error: "No Supabase config" });
  const { data, error } = await sb
    .from("pages")
    .select("title, page_description, long_description, chips, content")
    .eq("is_home", true)
    .eq("published", true)
    .limit(1)
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  setCache(key, data || null);
  return res.json(data || null);
};

export const getBySlug: RequestHandler = async (req, res) => {
  const { slug } = req.params as { slug: string };
  const key = `slug:${slug}`;
  const hit = getCache(key);
  if (hit) return res.json(hit);
  const sb = getSupabaseAdmin();
  if (!sb) return res.status(500).json({ error: "No Supabase config" });
  const { data, error } = await sb
    .from("pages")
    .select(
      "id, slug, title, page_description, long_description, chips, content, published",
    )
    .eq("slug", slug)
    .limit(1)
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  setCache(key, data || null);
  return res.json(data || null);
};

export const refreshAll: RequestHandler = async (_req, res) => {
  // Warm cache for home and all published pages
  const sb = getSupabaseAdmin();
  if (!sb) return res.status(500).json({ error: "No Supabase config" });
  cache.clear();
  const home = await sb
    .from("pages")
    .select("title, page_description, long_description, chips, content")
    .eq("is_home", true)
    .eq("published", true)
    .limit(1)
    .maybeSingle();
  if (!home.error) setCache("home", home.data || null);
  const all = await sb
    .from("pages")
    .select(
      "id, slug, title, page_description, long_description, chips, content, published",
    )
    .order("updated_at", { ascending: false })
    .limit(1000);
  if (!all.error) {
    (all.data || []).forEach((p: any) => setCache(`slug:${p.slug}`, p));
  }
  return res.json({ ok: true, warmed: (all.data || []).length });
};
