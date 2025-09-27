import type { RequestHandler } from "express";
import { getSupabaseAdmin } from "../services/supabase";

// Types for menu structure
interface MenuLink {
  label: string;
  to: string;
  badge?: string;
}

interface MenuColumn {
  heading: string;
  links: MenuLink[];
}

interface PromoSection {
  title: string;
  text: string;
  to: string;
}

type NavItem =
  | { type: "link"; label: string; to: string }
  | {
      type: "mega";
      label: string;
      columns: MenuColumn[];
      promo?: PromoSection;
    };

interface MenuResponse {
  items: NavItem[];
}

// Simple in-memory cache for menu data
let cached: { at: number; data: NavItem[] } | null = null;
const TTL_MS = 1000 * 60 * 10; // 10 minutes

// Fallback menu used if no data in Supabase
const FALLBACK_MENU: NavItem[] = [
  { type: "link", label: "Home", to: "/" },
  {
    type: "mega",
    label: "Shop",
    columns: [
      {
        heading: "By Relationship",
        links: [
          { label: "Gifts for Him", to: "/gifts-him" },
          { label: "Gifts for Her", to: "/gifts-her" },
          { label: "For Parents", to: "/parents" },
          { label: "For Kids", to: "/kids" }
        ]
      },
      {
        heading: "By Occasion",
        links: [
          { label: "Diwali Gifts", to: "/diwali-gifts", badge: "Trending" },
          { label: "Birthday", to: "/birthday" },
          { label: "Anniversary", to: "/anniversary" },
          { label: "Housewarming", to: "/housewarming" }
        ]
      },
      {
        heading: "By Category",
        links: [
          { label: "Personalized", to: "/personalized" },
          { label: "Home & Decor", to: "/home-decor" },
          { label: "Office & Desk", to: "/office-desk" },
          { label: "Accessories", to: "/accessories" }
        ]
      }
    ],
    promo: {
      title: "Corporate Gifting",
      text: "Curated catalog, bulk pricing, brand-ready.",
      to: "/corporate-gifts"
    }
  },
  { type: "link", label: "Corporate Gifts", to: "/corporate-gifts" },
  { type: "link", label: "Diwali Gifts", to: "/diwali-gifts" }
];

export const getMenu: RequestHandler = async (_req, res) => {
  try {
    if (cached && Date.now() - cached.at < TTL_MS) {
      return res.json({ items: cached.data });
    }

    const sb = getSupabaseAdmin();
    if (!sb) {
      // Return fallback menu when no Supabase
      return res.json({ items: FALLBACK_MENU });
    }

    const { data, error } = await sb
      .from("menus")
      .select("slug, data")
      .eq("slug", "main")
      .single();

    if (error || !data?.data) {
      console.warn("No menu data found, using fallback:", error?.message);
      return res.json({ items: FALLBACK_MENU });
    }

    const menuData = data.data as any;
    if (!menuData.items || !Array.isArray(menuData.items)) {
      console.warn("Invalid menu data structure, using fallback");
      return res.json({ items: FALLBACK_MENU });
    }

    cached = { at: Date.now(), data: menuData.items };
    return res.json({ items: menuData.items });
  } catch (e: any) {
    console.error("Menu fetch error:", e?.message);
    return res.json({ items: FALLBACK_MENU });
  }
};

export const updateMenu: RequestHandler = async (req, res) => {
  try {
    const sb = getSupabaseAdmin();
    if (!sb) {
      return res.status(500).json({ error: "Supabase not configured" });
    }

    const menuData = req.body;

    // Basic validation
    if (!menuData || !Array.isArray(menuData.items)) {
      return res.status(400).json({
        error: 'Menu must be an object with an "items" array'
      });
    }

    // Validate menu structure
    for (const item of menuData.items) {
      if (!item.type || !item.label) {
        return res.status(400).json({
          error: 'Each menu item must have "type" and "label" properties'
        });
      }
      if (item.type === "link" && !item.to) {
        return res.status(400).json({
          error: 'Link menu items must have a "to" property'
        });
      }
      if (item.type === "mega" && !Array.isArray(item.columns)) {
        return res.status(400).json({
          error: 'Mega menu items must have a "columns" array'
        });
      }
    }

    const { error } = await sb
      .from("menus")
      .upsert({
        slug: "main",
        data: menuData,
        updated_at: new Date().toISOString()
      });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Clear cache
    cached = null;

    return res.json({ success: true });
  } catch (e: any) {
    console.error("Menu update error:", e?.message);
    return res.status(500).json({ error: e?.message || "Failed to update menu" });
  }
};