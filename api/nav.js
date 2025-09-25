// Navigation links endpoint
import { createClient } from '@supabase/supabase-js';

// Simple in-memory cache for nav links
let cached = null;
const TTL_MS = 1000 * 60 * 5; // 5 minutes

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

    if (cached && Date.now() - cached.at < TTL_MS) {
      return res.json({ links: cached.data });
    }

    const sb = getSupabaseAdmin();
    if (!sb) {
      return res.status(500).json({ error: "No Supabase config" });
    }

    const { data, error } = await sb
      .from("nav_links")
      .select("label, href, position")
      .eq("visible", true)
      .order("position", { ascending: true });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const links = (data || []).map((l) => ({
      label: String(l.label || ""),
      href: String(l.href || "#"),
      position: Number(l.position ?? 0),
    }));

    cached = { at: Date.now(), data: links };
    return res.json({ links });

  } catch (e) {
    console.error('Nav endpoint error:', e);
    return res.status(500).json({
      error: e?.message || "Failed to fetch nav",
      timestamp: new Date().toISOString()
    });
  }
}