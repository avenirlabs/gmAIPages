import type { RequestHandler } from "express";
import { getSupabaseAdmin } from "../services/supabase";

// Types for nested navigation
interface NavLink {
  id: string;
  label: string;
  href?: string;
  children?: NavLink[];
  isMega?: boolean;
}

interface NavResponse {
  items: NavLink[];
}

// Simple in-memory cache for nav links
let cached: { at: number; data: NavLink[] } | null = null;
const TTL_MS = 1000 * 60 * 5; // 5 minutes

function buildNavTree(flatLinks: any[]): NavLink[] {
  const linkMap = new Map<string, NavLink>();
  const rootItems: NavLink[] = [];

  // First pass: create all nav items
  for (const item of flatLinks) {
    const navItem: NavLink = {
      id: item.id || item.label, // fallback to label for backward compatibility
      label: String(item.label || ""),
      href: item.href || undefined,
      isMega: Boolean(item.is_mega),
    };
    linkMap.set(navItem.id, navItem);
  }

  // Second pass: build parent-child relationships
  for (const item of flatLinks) {
    const navItem = linkMap.get(item.id || item.label)!;

    if (item.parent_id && linkMap.has(item.parent_id)) {
      // This is a child item
      const parent = linkMap.get(item.parent_id)!;
      if (!parent.children) parent.children = [];
      parent.children.push(navItem);
    } else {
      // This is a root item
      rootItems.push(navItem);
    }
  }

  return rootItems;
}

export const getNavLinks = async (_req: any, res: any) => {
  try {
    if (cached && Date.now() - cached.at < TTL_MS) {
      // Return both legacy format and new nested format for backward compatibility
      return res.json({
        links: cached.data.filter(item => !item.children || item.children.length === 0).map(item => ({
          label: item.label,
          href: item.href || "#",
          position: 0 // legacy field
        })),
        items: cached.data
      });
    }

    const sb = getSupabaseAdmin();
    if (!sb) return res.status(500).json({ error: "No Supabase config" });

    // Try new schema first, fallback to legacy
    const { data, error } = await sb
      .from("nav_links")
      .select("id, label, href, parent_id, sort_order, is_visible, is_mega, position")
      .eq("is_visible", true)
      .order("sort_order", { ascending: true })
      .order("label", { ascending: true }); // Secondary sort by label

    if (error) {
      // Fallback to legacy schema
      console.warn("Failed to fetch with new schema, trying legacy:", error.message);
      const { data: legacyData, error: legacyError } = await sb
        .from("nav_links")
        .select("label, href, position")
        .eq("visible", true)
        .order("position", { ascending: true });

      if (legacyError) return res.status(500).json({ error: legacyError.message });

      const legacyLinks = (legacyData || []).map((l: any) => ({
        id: l.label, // Use label as ID for legacy items
        label: String(l.label || ""),
        href: l.href || undefined,
      }));

      cached = { at: Date.now(), data: legacyLinks };
      return res.json({
        links: legacyLinks.map(item => ({
          label: item.label,
          href: item.href || "#",
          position: 0
        })),
        items: legacyLinks
      });
    }

    const navTree = buildNavTree(data || []);
    cached = { at: Date.now(), data: navTree };

    // Return both legacy format and new nested format for backward compatibility
    const flatLinks = navTree.filter(item => !item.children || item.children.length === 0);
    return res.json({
      links: flatLinks.map(item => ({
        label: item.label,
        href: item.href || "#",
        position: 0 // legacy field
      })),
      items: navTree
    });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Failed to fetch nav" });
  }
};
