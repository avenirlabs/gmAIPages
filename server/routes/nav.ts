import type { RequestHandler } from "express";
import { getSupabaseAdmin } from "../services/supabase";

// Simple in-memory cache for nav links
let cached: { at: number; data: any[] } | null = null;
const TTL_MS = 1000 * 60 * 5; // 5 minutes

export const getNavLinks: RequestHandler = async (_req, res) => {
  try {
    if (cached && Date.now() - cached.at < TTL_MS) {
      return res.json({ links: cached.data });
    }
    const sb = getSupabaseAdmin();
    if (!sb) return res.status(500).json({ error: "No Supabase config" });
    const { data, error } = await sb
      .from("nav_links")
      .select("label, href, position")
      .eq("visible", true)
      .order("position", { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    const links = (data || []).map((l: any) => ({
      label: String(l.label || ""),
      href: String(l.href || "#"),
      position: Number(l.position ?? 0),
    }));
    cached = { at: Date.now(), data: links };
    return res.json({ links });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Failed to fetch nav" });
  }
};
