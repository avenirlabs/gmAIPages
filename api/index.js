////////////////////////////////////////////////////////
// TOP: imports + app + JSON body parsing
////////////////////////////////////////////////////////
import express from "express";
import serverless from "serverless-http";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const app = express();
app.use(express.json({ limit: "2mb" }));

// optional CORS (safe for now; tighten later)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).end();
  next();
});

// Supabase client (server-side)
const sb = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY,
  { auth: { persistSession: false } }
);

// tiny async wrapper so thrown errors return JSON 500 (not crash)
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

////////////////////////////////////////////////////////
// Health probes (to diagnose prod quickly)
////////////////////////////////////////////////////////
app.get(["/api/health", "/health"], (req, res) => res.json({ ok: true }));

app.get("/api/health/env", (req, res) => {
  const hasUrl = !!process.env.SUPABASE_URL;
  const hasSvc = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  res.json({ ok: hasUrl && hasSvc, hasUrl, hasSvc });
});

app.get("/api/health/db", wrap(async (req, res) => {
  const { data, error } = await sb.from("menus").select("slug").limit(1);
  if (error) {
    console.error("DB health error:", error);
    return res.status(500).json({ ok: false, error: error.message });
  }
  res.json({ ok: true, sample: data?.[0]?.slug ?? null });
}));

////////////////////////////////////////////////////////
// Menus: GET -> { items: [...] } from public.menus(slug, data jsonb)
////////////////////////////////////////////////////////
app.get("/api/menus/:slug", wrap(async (req, res) => {
  const { slug } = req.params;
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
}));

////////////////////////////////////////////////////////
// Menus: PUT -> upsert { slug, data: { items } }
////////////////////////////////////////////////////////
app.put("/api/menus/:slug", wrap(async (req, res) => {
  const { slug } = req.params;
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
}));

////////////////////////////////////////////////////////
// (Optional) Seed endpoint to create a default 'main' menu once
////////////////////////////////////////////////////////
app.post("/api/menus/seed", wrap(async (req, res) => {
  const seed = { items: [
    { type: "link", label: "Home", to: "/" },
    { type: "link", label: "Shop", to: "/shop" }
  ]};
  const { error } = await sb.from("menus").upsert(
    { slug: "main", data: seed, updated_at: new Date().toISOString() },
    { onConflict: "slug" }
  );
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
}));

// Admin authentication helper
async function requireAdmin(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }

  const token = authHeader.slice(7); // Remove 'Bearer ' prefix
  if (!sb) {
    throw new Error('Supabase not configured');
  }

  // Verify the JWT token with Supabase
  const { data: { user }, error } = await sb.auth.getUser(token);

  if (error || !user) {
    throw new Error('Invalid or expired token');
  }

  return user;
}

// Algolia client
async function getAlgoliaClient() {
  const appId = process.env.ALGOLIA_APP_ID;
  const apiKey = process.env.ALGOLIA_API_KEY;
  if (!appId || !apiKey) return null;

  try {
    const mod = await import('algoliasearch');
    const ctor = mod.default ?? mod.algoliasearch;
    return ctor(appId, apiKey);
  } catch (error) {
    console.error('Failed to import algoliasearch:', error);
    return null;
  }
}

// Simple caching
const cache = new Map();
const TTL_MS = 1000 * 60 * 10;

function setCache(key, data) {
  cache.set(key, { at: Date.now(), data });
}

function getCache(key) {
  const hit = cache.get(key);
  if (!hit || Date.now() - hit.at > TTL_MS) {
    cache.delete(key);
    return null;
  }
  return hit.data;
}

// Debug endpoints
app.get(["/api/debug", "/debug"], (req, res) => {
  return res.json({
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    supabaseUrlPrefix: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.substring(0, 20) + '...' : 'missing',
    hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasOpenAI: !!process.env.OPENAI_API_KEY,
    hasAlgolia: !!process.env.ALGOLIA_APP_ID,
    algoliaAppId: process.env.ALGOLIA_APP_ID || 'missing',
    nodeEnv: process.env.NODE_ENV,
    isVercel: !!process.env.VERCEL,
    timestamp: new Date().toISOString()
  });
});

app.get(["/api/ping", "/ping"], (req, res) => {
  const ping = process.env.PING_MESSAGE || "pong";
  return res.json({ message: ping, timestamp: new Date().toISOString() });
});

// Navigation
app.get(["/api/nav/links", "/nav/links"], wrap(async (req, res) => {
  const cached = getCache('nav-links');
  if (cached) return res.json({ links: cached });

  if (!sb) return res.json({ links: [], error: "No Supabase config" });

  const { data, error } = await sb
    .from("nav_links")
    .select("label, href, position")
    .eq("visible", true)
    .order("position", { ascending: true });

  if (error) {
    console.error('Nav links error:', error);
    return res.json({ links: [], error: error.message, fallback: true });
  }

  const links = (data || []).map((l) => ({
    label: String(l.label || ""),
    href: String(l.href || "#"),
    position: Number(l.position ?? 0),
  }));

  setCache('nav-links', links);
  return res.json({ links });
}));

// Pages
app.get(["/api/pages/home", "/pages/home"], wrap(async (req, res) => {
  const cached = getCache('home');
  if (cached) return res.json(cached);

  if (!sb) return res.status(500).json({ error: "No Supabase config" });

  const { data, error } = await sb
    .from("pages")
    .select("title, page_description, long_description, chips, content")
    .eq("is_home", true)
    .eq("published", true)
    .limit(1)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });

  setCache('home', data || null);
  return res.json(data || null);
}));

app.get(["/api/pages/:slug", "/pages/:slug"], wrap(async (req, res) => {
  const { slug } = req.params;
  const cached = getCache(`slug:${slug}`);
  if (cached) return res.json(cached);

  if (!sb) return res.status(500).json({ error: "No Supabase config" });

  const { data, error } = await sb
    .from("pages")
    .select("id, slug, title, page_description, long_description, chips, content, published")
    .eq("slug", slug)
    .limit(1)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });

  setCache(`slug:${slug}`, data || null);
  return res.json(data || null);
}));

// WooCommerce
app.get(["/api/woocommerce/products", "/woocommerce/products"], wrap(async (req, res) => {
  const source = req.query?.source || "featured";
  const per_page = req.query?.per_page || "20";
  const cacheKey = `woo-${source}-${per_page}`;

  const cached = getCache(cacheKey);
  if (cached) return res.json({ products: cached });

  const base = (process.env.WOOCOMMERCE_BASE_URL || "").replace(/\/+$/, "");
  const key = process.env.WOOCOMMERCE_CONSUMER_KEY;
  const secret = process.env.WOOCOMMERCE_CONSUMER_SECRET;

  if (!base || !key || !secret) {
    return res.status(500).json({ error: "WooCommerce credentials not configured" });
  }

  const url = new URL(base + "/wp-json/wc/v3/products");
  url.searchParams.set("per_page", String(per_page));
  url.searchParams.set("status", "publish");
  url.searchParams.set("featured", "true"); // Always get featured for now
  url.searchParams.set("_fields", "id,name,permalink,images,price,regular_price,sale_price");
  url.searchParams.set("consumer_key", key);
  url.searchParams.set("consumer_secret", secret);

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json", "User-Agent": "GiftsGuru/1.0" }
  });

  if (!response.ok) {
    const text = await response.text();
    return res.status(response.status).json({ error: "WooCommerce API error", details: text });
  }

  const data = await response.json();
  const products = data.map((p) => ({
    id: p.id,
    name: p.name,
    link: p.permalink,
    image: p.images && p.images.length ? p.images[0].src : undefined,
    price: p.price ? parseFloat(p.price) : undefined,
    regular_price: p.regular_price ? parseFloat(p.regular_price) : undefined,
    sale_price: p.sale_price ? parseFloat(p.sale_price) : undefined,
  }));

  setCache(cacheKey, products);
  return res.json({ products });
}));

app.get(["/api/woocommerce/featured", "/woocommerce/featured"], wrap(async (req, res) => {
  req.query = { ...req.query, source: 'featured' };
  // Redirect to main products endpoint
  return app._router.handle({ ...req, url: req.url.replace('/featured', '/products') }, res);
}));

// Chat/Search
app.get(["/api/gifts/chat", "/gifts/chat"], (req, res) => {
  return res.json({
    message: "Chat endpoint ready. Send POST request with {\"query\": \"your search\"} to search.",
    timestamp: new Date().toISOString(),
    method: 'POST',
    example: {
      url: '/api/gifts/chat',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { query: 'birthday gifts for mom' }
    }
  });
});

app.post(["/api/gifts/chat", "/gifts/chat"], wrap(async (req, res) => {
  // Handle different body parsing scenarios
  let bodyData = req.body;

  // If body is string, try to parse it
  if (typeof bodyData === "string") {
    bodyData = JSON.parse(bodyData);
  }

  // If body is Buffer, convert and parse
  if (Buffer.isBuffer(bodyData)) {
    bodyData = JSON.parse(bodyData.toString("utf8"));
  }

  // Handle both query and message formats + pagination params
  const {
    query,
    message,
    sessionId,
    selectedRefinements,
    cursor,
    page,
    perPage,
    filters
  } = bodyData || {};
  const searchQuery = query || message;

  if (!searchQuery || typeof searchQuery !== "string" || searchQuery.trim().length === 0) {
    return res.status(400).json({
      error: "Missing or invalid query/message parameter",
      receivedBody: bodyData,
      expectedFormat: "{ \"message\": \"your search term\" } or { \"query\": \"your search term\" }",
      debug: {
        hasQuery: !!query,
        hasMessage: !!message,
        queryType: typeof searchQuery,
        bodyType: typeof bodyData,
        bodyKeys: bodyData ? Object.keys(bodyData) : []
      }
    });
  }

  const actualSessionId = sessionId || randomUUID();
  const startTime = Date.now();

  // Parse pagination parameters
  const pageSize = perPage || parseInt(process.env.CHAT_PAGE_SIZE) || 12;
  let currentPage = 1;

  // Parse cursor if provided (format: "page:X")
  if (cursor) {
    const match = cursor.match(/^page:(\d+)$/);
    if (match) {
      currentPage = parseInt(match[1]);
    }
  } else if (page && page > 0) {
    currentPage = page;
  }

  // Search with Algolia
  const client = await getAlgoliaClient();
  let products = [];
  let totalHits = 0;

  if (client) {
    try {
      const indexName = process.env.ALGOLIA_INDEX_NAME || 'gmProducts';
      const searchResult = await client.searchSingleIndex({
        indexName,
        searchParams: {
          query: searchQuery.trim(),
          hitsPerPage: pageSize,
          page: currentPage - 1, // Algolia uses 0-based pages
          attributesToRetrieve: [
            'objectID',
            'title',
            'name',
            'description',
            'price',
            'currency',
            'image',
            'url',
            'link',
            'tags',
            'vendor'
          ]
        }
      });

      const hits = searchResult.hits || [];
      totalHits = searchResult.nbHits || 0;

      products = hits.map(hit => ({
        id: hit.objectID || hit.id,
        title: hit.name || hit.title,
        description: hit.description,
        price: hit.price,
        currency: hit.currency || 'USD',
        image: hit.image,
        url: hit.link || hit.url,
        tags: hit.tags || [],
        vendor: hit.vendor,
        score: hit._score
      }));
    } catch (searchError) {
      console.error('Algolia search error:', searchError);
    }
  }

  // Generate refinement chips based on search results
  const refineChips = [];
  if (products.length > 0) {
    // Extract unique categories/tags from products for refinement
    const allTags = products.flatMap(p => p.tags || []);
    const uniqueTags = [...new Set(allTags)].slice(0, 5);
    refineChips.push(...uniqueTags);

    // Add price range suggestions
    const prices = products.filter(p => p.price).map(p => p.price);
    if (prices.length > 0) {
      const maxPrice = Math.max(...prices);
      if (maxPrice > 50) refineChips.push("under $50");
      if (maxPrice > 100) refineChips.push("under $100");
    }
  }

  // Calculate pagination info
  const totalPages = Math.ceil(totalHits / pageSize);
  const hasNext = currentPage < totalPages;
  const hasPrev = currentPage > 1;

  const pageInfo = {
    total: totalHits,
    pageSize,
    page: currentPage,
    totalPages,
    ...(hasNext && { nextCursor: `page:${currentPage + 1}` }),
    ...(hasPrev && { prevCursor: `page:${currentPage - 1}` })
  };

  // Generate a helpful reply
  const reply = totalHits > 0
    ? `Found ${totalHits} gift${totalHits === 1 ? '' : 's'} for "${searchQuery.trim()}". ${currentPage > 1 ? `Showing page ${currentPage} of ${totalPages}.` : ''} You can refine your search using the chips below.`
    : `Sorry, I couldn't find any gifts matching "${searchQuery.trim()}". Try a different search term or browse our featured products.`;

  // Generate intentToken for subsequent pages (simple hash of query + filters)
  const intentData = {
    query: searchQuery.trim(),
    selectedRefinements: selectedRefinements || []
  };
  const intentTokenGenerated = Buffer.from(JSON.stringify(intentData)).toString('base64');

  const totalLatencyMs = Date.now() - startTime;

  return res.json({
    reply,
    products,
    refineChips,
    pageInfo,
    appliedFilters: filters, // Echo applied filters
    facets: {}, // Empty for now - will be populated when Algolia index has facet fields
    meta: {
      queryLatencyMs: totalLatencyMs,
      source: 'algolia',
      intentToken: intentTokenGenerated,
      broadened: false // TODO: Implement zero-hit fallback in consolidated API
    }
  });
}));

// Admin cache refresh
app.post(["/api/admin/cache/refresh", "/admin/cache/refresh"], (req, res) => {
  cache.clear();
  return res.json({ success: true, message: "Cache cleared", timestamp: new Date().toISOString() });
});

// Analytics endpoints (admin-protected)
app.post(["/api/admin/analytics/kpis", "/admin/analytics/kpis"], wrap(async (req, res) => {
  await requireAdmin(req);
  if (!sb) return res.status(500).json({ error: 'Supabase not configured' });

  const { p_start, p_end } = req.body;
  const { data, error } = await sb.rpc('get_chat_kpis', { p_start, p_end });

  if (error) {
    console.error('KPIs fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch KPIs' });
  }

  return res.json(data || []);
}));

// Test endpoints
app.get(["/api/test-algolia", "/test-algolia"], wrap(async (req, res) => {
  const appId = process.env.ALGOLIA_APP_ID;
  const apiKey = process.env.ALGOLIA_API_KEY;
  const indexName = process.env.ALGOLIA_INDEX_NAME || 'gmProducts';

  if (!appId || !apiKey) {
    return res.json({ error: "Algolia credentials not configured", hasAppId: !!appId, hasApiKey: !!apiKey });
  }

  const client = await getAlgoliaClient();
  if (!client) {
    return res.json({ error: "Failed to create Algolia client" });
  }

  const index = client.initIndex(indexName);
  const { hits, nbHits } = await index.search('test', { hitsPerPage: 1 });

  return res.json({
    success: true,
    appId,
    indexName,
    totalResults: nbHits,
    sampleHit: hits[0] ? { objectID: hits[0].objectID, name: hits[0].name } : null
  });
}));

////////////////////////////////////////////////////////
// Final error handler + export for Vercel
////////////////////////////////////////////////////////
app.use((err, req, res, _next) => {
  console.error("API error:", err);
  res.status(500).json({ error: err?.message || "Internal error" });
});

export default serverless(app);