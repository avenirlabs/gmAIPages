// Dynamic page content by slug endpoint
import { createClient } from '@supabase/supabase-js';

// Simple in-memory cache
const cache = new Map();
const TTL_MS = 1000 * 60 * 10; // 10 minutes

function setCache(key, data) {
  cache.set(key, { at: Date.now(), data });
}

function getCache(key) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > TTL_MS) {
    cache.delete(key);
    return null;
  }
  return hit.data;
}

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE;
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

export default async function handler(req, res) {
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    const { slug } = req.query;
    if (!slug) {
      return res.status(400).json({ error: "Slug parameter required" });
    }

    const key = `slug:${slug}`;
    const hit = getCache(key);
    if (hit) return res.json(hit);

    const sb = getSupabaseAdmin();
    if (!sb) return res.status(500).json({ error: "No Supabase config" });

    const { data, error } = await sb
      .from("pages")
      .select("id, slug, title, page_description, long_description, chips, content, published")
      .eq("slug", slug)
      .limit(1)
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });

    setCache(key, data || null);
    return res.json(data || null);

  } catch (e) {
    console.error('Page by slug endpoint error:', e);
    return res.status(500).json({
      error: e?.message || "Failed to fetch page",
      timestamp: new Date().toISOString()
    });
  }
}