// Consolidated API handler for all routes
// Single serverless function to stay within Vercel Hobby plan limits

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

// Admin authentication helper
async function requireAdmin(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }

  const token = authHeader.slice(7); // Remove 'Bearer ' prefix
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  // Verify the JWT token with Supabase
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new Error('Invalid or expired token');
  }

  return user;
}

// Supabase client
function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
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

// Route handlers
const handlers = {
  // Debug endpoints
  'GET /debug': async (req, res) => {
    return res.json({
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      supabaseUrlPrefix: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.substring(0, 20) + '...' : 'missing',
      hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE,
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      hasAlgolia: !!process.env.ALGOLIA_APP_ID,
      algoliaAppId: process.env.ALGOLIA_APP_ID || 'missing',
      nodeEnv: process.env.NODE_ENV,
      isVercel: !!process.env.VERCEL,
      timestamp: new Date().toISOString()
    });
  },

  'GET /ping': async (req, res) => {
    const ping = process.env.PING_MESSAGE || "pong";
    return res.json({ message: ping, timestamp: new Date().toISOString() });
  },

  'GET /hello': async (req, res) => {
    return res.json({ message: "Hello from Vercel!", timestamp: new Date().toISOString() });
  },

  // Navigation
  'GET /nav/links': async (req, res) => {
    const cached = getCache('nav-links');
    if (cached) return res.json({ links: cached });

    const sb = getSupabaseAdmin();
    if (!sb) return res.json({ links: [], error: "No Supabase config" });

    try {
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
    } catch (e) {
      return res.json({ links: [], error: e.message });
    }
  },

  // Pages
  'GET /pages/home': async (req, res) => {
    const cached = getCache('home');
    if (cached) return res.json(cached);

    const sb = getSupabaseAdmin();
    if (!sb) return res.status(500).json({ error: "No Supabase config" });

    try {
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
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  },

  'GET /pages/:slug': async (req, res, params) => {
    const { slug } = params;
    const cached = getCache(`slug:${slug}`);
    if (cached) return res.json(cached);

    const sb = getSupabaseAdmin();
    if (!sb) return res.status(500).json({ error: "No Supabase config" });

    try {
      const { data, error } = await sb
        .from("pages")
        .select("id, slug, title, page_description, long_description, chips, content, published")
        .eq("slug", slug)
        .limit(1)
        .maybeSingle();

      if (error) return res.status(500).json({ error: error.message });

      setCache(`slug:${slug}`, data || null);
      return res.json(data || null);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  },

  // WooCommerce
  'GET /woocommerce/products': async (req, res) => {
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

    try {
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
    } catch (err) {
      return res.status(500).json({ error: "Failed to fetch products", details: err.message });
    }
  },

  'GET /woocommerce/featured': async (req, res) => {
    req.query = { ...req.query, source: 'featured' };
    return handlers['GET /woocommerce/products'](req, res);
  },

  // Chat/Search
  'GET /gifts/chat': async (req, res) => {
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
  },

  // Debug POST endpoint
  'POST /debug-body': async (req, res) => {
    return res.json({
      receivedBody: req.body,
      bodyType: typeof req.body,
      isBuffer: Buffer.isBuffer(req.body),
      rawBody: req.body ? req.body.toString() : null,
      headers: req.headers,
      timestamp: new Date().toISOString()
    });
  },

  'POST /gifts/chat': async (req, res) => {
    try {
      // Handle different body parsing scenarios
      let bodyData = req.body;

      // If body is string, try to parse it
      if (typeof bodyData === "string") {
        try {
          bodyData = JSON.parse(bodyData);
        } catch (parseError) {
          return res.status(400).json({
            error: "Invalid JSON in request body",
            details: parseError.message,
            receivedBody: typeof req.body,
            sample: "Expected: {\"query\": \"your search term\"}"
          });
        }
      }

      // If body is Buffer, convert and parse
      if (Buffer.isBuffer(bodyData)) {
        try {
          bodyData = JSON.parse(bodyData.toString("utf8"));
        } catch (parseError) {
          return res.status(400).json({
            error: "Invalid JSON in buffer body",
            details: parseError.message
          });
        }
      }

      // Handle both query and message formats + pagination params
      const {
        query,
        message,
        sessionId,
        history,
        selectedRefinements,
        cursor,
        page,
        perPage,
        intentToken,
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
      let searchLatencyMs = 0;

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
          searchLatencyMs = searchResult.processingTimeMS || 0;

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

    } catch (error) {
      return res.status(500).json({ error: "Failed to process chat request", details: error.message });
    }
  },

  // Admin
  'POST /admin/cache/refresh': async (req, res) => {
    cache.clear();
    return res.json({ success: true, message: "Cache cleared", timestamp: new Date().toISOString() });
  },

  // Test endpoints
  'GET /test-algolia': async (req, res) => {
    const appId = process.env.ALGOLIA_APP_ID;
    const apiKey = process.env.ALGOLIA_API_KEY;
    const indexName = process.env.ALGOLIA_INDEX_NAME || 'gmProducts';

    if (!appId || !apiKey) {
      return res.json({ error: "Algolia credentials not configured", hasAppId: !!appId, hasApiKey: !!apiKey });
    }

    try {
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
    } catch (error) {
      return res.json({ error: "Algolia test failed", details: error.message });
    }
  },

  'GET /test-woo': async (req, res) => {
    const base = (process.env.WOOCOMMERCE_BASE_URL || "").replace(/\/+$/, "");
    const key = process.env.WOOCOMMERCE_CONSUMER_KEY;
    const secret = process.env.WOOCOMMERCE_CONSUMER_SECRET;

    if (!base || !key || !secret) {
      return res.json({ error: "WooCommerce credentials not configured" });
    }

    try {
      const url = new URL(base + "/wp-json/wc/v3/products");
      url.searchParams.set("per_page", "1");
      url.searchParams.set("consumer_key", key);
      url.searchParams.set("consumer_secret", secret);

      const response = await fetch(url.toString());

      return res.json({
        success: response.ok,
        status: response.status,
        statusText: response.statusText
      });
    } catch (error) {
      return res.json({ error: error.message });
    }
  },

  // --- GET menu by slug ---
  'GET /menus/:slug': async (req, res, params) => {
    const { slug } = params;
    const sb = getSupabaseAdmin();
    if (!sb) {
      return res.status(500).json({ error: "No Supabase config" });
    }

    const { data, error } = await sb
      .from("menus")
      .select("data")
      .eq("slug", slug)
      .single();

    if (error || !data) {
      return res.status(500).json({ error: error?.message || "Menu not found" });
    }

    const items = Array.isArray(data?.data?.items)
      ? data.data.items
      : (Array.isArray(data?.data) ? data.data : []);

    res.json({ items });
  },

  // --- PUT menu by slug ---
  'PUT /menus/:slug': async (req, res, params) => {
    const { slug } = params;
    const body = req.body;
    const sb = getSupabaseAdmin();
    if (!sb) {
      return res.status(500).json({ error: "No Supabase config" });
    }

    const { error } = await sb
      .from("menus")
      .upsert({
        slug,
        data: { items: body.items },
        updated_at: new Date().toISOString()
      }, { onConflict: "slug" });

    if (error) return res.status(500).json({ error: error.message });
    res.json({ ok: true });
  },

  // Analytics endpoints (admin-protected)
  'POST /admin/analytics/kpis': async (req, res) => {
    try {
      await requireAdmin(req);
      const supabase = getSupabaseAdmin();
      if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

      const { p_start, p_end } = req.body;
      const { data, error } = await supabase.rpc('get_chat_kpis', { p_start, p_end });

      if (error) {
        console.error('KPIs fetch error:', error);
        return res.status(500).json({ error: 'Failed to fetch KPIs' });
      }

      return res.json(data || []);
    } catch (e) {
      return res.status(401).json({ error: e.message || 'Authentication failed' });
    }
  },

  'GET /admin/analytics/quality': async (req, res) => {
    try {
      await requireAdmin(req);
      const supabase = getSupabaseAdmin();
      if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

      const { data, error } = await supabase.from('v_chat_assistant_quality').select('*');

      if (error) {
        console.error('Quality fetch error:', error);
        return res.status(500).json({ error: 'Failed to fetch quality metrics' });
      }

      return res.json(data || []);
    } catch (e) {
      return res.status(401).json({ error: e.message || 'Authentication failed' });
    }
  },

  'GET /admin/analytics/geo': async (req, res) => {
    try {
      await requireAdmin(req);
      const supabase = getSupabaseAdmin();
      if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

      const { data, error } = await supabase.from('v_chat_geo').select('*');

      if (error) {
        console.error('Geo fetch error:', error);
        return res.status(500).json({ error: 'Failed to fetch geography data' });
      }

      return res.json(data || []);
    } catch (e) {
      return res.status(401).json({ error: e.message || 'Authentication failed' });
    }
  },

  'GET /admin/analytics/products/top': async (req, res) => {
    try {
      await requireAdmin(req);
      const supabase = getSupabaseAdmin();
      if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

      const { data, error } = await supabase.from('v_product_impressions_top').select('*');

      if (error) {
        console.error('Top products fetch error:', error);
        return res.status(500).json({ error: 'Failed to fetch top products' });
      }

      return res.json(data || []);
    } catch (e) {
      return res.status(401).json({ error: e.message || 'Authentication failed' });
    }
  },

  'GET /admin/analytics/sessions/depth': async (req, res) => {
    try {
      await requireAdmin(req);
      const supabase = getSupabaseAdmin();
      if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

      const { data, error } = await supabase.from('v_chat_session_depth').select('*');

      if (error) {
        console.error('Session depth fetch error:', error);
        return res.status(500).json({ error: 'Failed to fetch session depth' });
      }

      return res.json(data || []);
    } catch (e) {
      return res.status(401).json({ error: e.message || 'Authentication failed' });
    }
  },

  'GET /admin/analytics/chips': async (req, res) => {
    try {
      await requireAdmin(req);
      const supabase = getSupabaseAdmin();
      if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

      const { data, error } = await supabase.from('v_chat_chip_usage').select('*');

      if (error) {
        console.error('Chip usage fetch error:', error);
        return res.status(500).json({ error: 'Failed to fetch chip usage' });
      }

      return res.json(data || []);
    } catch (e) {
      return res.status(401).json({ error: e.message || 'Authentication failed' });
    }
  },

  'GET /admin/analytics/filters': async (req, res) => {
    try {
      await requireAdmin(req);
      const supabase = getSupabaseAdmin();
      if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

      const { data, error } = await supabase.from('v_chat_filter_usage').select('*');

      if (error) {
        console.error('Filter usage fetch error:', error);
        return res.status(500).json({ error: 'Failed to fetch filter usage' });
      }

      return res.json(data || []);
    } catch (e) {
      return res.status(401).json({ error: e.message || 'Authentication failed' });
    }
  },

  'GET /admin/analytics/pages/top': async (req, res) => {
    try {
      await requireAdmin(req);
      const supabase = getSupabaseAdmin();
      if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

      const { data, error } = await supabase.from('v_chat_top_pages_30d').select('*');

      if (error) {
        console.error('Top pages fetch error:', error);
        return res.status(500).json({ error: 'Failed to fetch top pages' });
      }

      return res.json(data || []);
    } catch (e) {
      return res.status(401).json({ error: e.message || 'Authentication failed' });
    }
  }
};

// Main handler
export default async function handler(req, res) {
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Parse the path
    const path = req.url?.split('?')[0] || '/';
    const normalizedPath = path.startsWith('/api') ? path.substring(4) : path;

    // Handle dynamic routes (like /pages/:slug)
    let route = `${req.method} ${normalizedPath}`;
    let params = {};

    // Check for exact match first
    if (handlers[route]) {
      return await handlers[route](req, res, params);
    }

    // Check for dynamic routes
    if (normalizedPath.startsWith('/pages/') && normalizedPath !== '/pages/home') {
      const slug = normalizedPath.substring(7); // Remove '/pages/'
      params.slug = slug;
      route = `${req.method} /pages/:slug`;
    }

    if (normalizedPath.startsWith('/menus/') && normalizedPath !== '/menus/main') {
      const slug = normalizedPath.substring(7); // Remove '/menus/'
      params.slug = slug;
      route = `${req.method} /menus/:slug`;
    }

    if (handlers[route]) {
      return await handlers[route](req, res, params);
    }

    // No handler found
    return res.status(404).json({
      error: "Endpoint not found",
      path: normalizedPath,
      method: req.method,
      availableRoutes: Object.keys(handlers)
    });

  } catch (error) {
    console.error('API handler error:', error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}