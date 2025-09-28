import { createClient } from "@supabase/supabase-js";

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
    // Initialize Supabase client inside the handler
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({
        error: "Missing Supabase configuration",
        hasUrl: !!process.env.SUPABASE_URL,
        hasKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      });
    }

    const sb = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY,
      { auth: { persistSession: false } }
    );

    if (req.method === "GET") {
      try {
        // First, let's see what slugs are available for debugging
        const { data: allMenus, error: listError } = await sb
          .from("menus")
          .select("slug");

        if (listError) {
          console.error("Error listing menus:", listError);
          return res.status(500).json({
            error: "Database error listing menus",
            details: listError.message,
            requestedSlug: slug
          });
        }

        // Now try to get the specific menu
        const { data, error } = await sb
          .from("menus")
          .select("data")
          .eq("slug", slug);

        if (error) {
          console.error("GET menus error:", error);
          return res.status(500).json({
            error: error.message,
            requestedSlug: slug,
            availableSlugs: allMenus?.map(m => m.slug) || [],
            totalMenus: allMenus?.length || 0
          });
        }

        if (!data || data.length === 0) {
          return res.status(404).json({
            error: "Menu not found",
            requestedSlug: slug,
            availableSlugs: allMenus?.map(m => m.slug) || [],
            totalMenus: allMenus?.length || 0
          });
        }

        const menuData = data[0]; // Get first result instead of using .single()
        const items = Array.isArray(menuData?.data?.items)
          ? menuData.data.items
          : (Array.isArray(menuData?.data) ? menuData.data : []);

        return res.json({ items });
      } catch (queryError) {
        console.error("Unexpected menu query error:", queryError);
        return res.status(500).json({
          error: "Unexpected database error",
          details: queryError.message,
          requestedSlug: slug
        });
      }
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