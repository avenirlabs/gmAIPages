import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

// ---- Supabase admin (accept both SERVICE_ROLE and SERVICE_ROLE_KEY; fallback to ANON if RLS is off)
function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

// ---- Optional Algolia client (kept from original)
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

// ---- Tiny in-memory cache
const cache = new Map();
const TTL_MS = 1000 * 60 * 10;
function setCache(key, data) { cache.set(key, { at: Date.now(), data }); }
function getCache(key) {
  const hit = cache.get(key);
  if (!hit || Date.now() - hit.at > TTL_MS) { cache.delete(key); return null; }
  return hit.data;
}

// ---- Handlers map (kept original endpoints; added menus)
const handlers = {
  // ---------- Debug / probes ----------
  'GET /debug': async (_req, res) => {
    return res.json({
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      supabaseUrlPrefix: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.slice(0, 20) + '...' : 'missing',
      hasSupabaseServiceRole: !!(process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY),
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      hasAlgolia: !!process.env.ALGOLIA_APP_ID,
      nodeEnv: process.env.NODE_ENV,
      isVercel: !!process.env.VERCEL,
      timestamp: new Date().toISOString()
    });
  },
  'GET /ping': async (_req, res) => res.json({ pong: true, ts: new Date().toISOString() }),
  'GET /hello': async (_req, res) => res.json({ message: 'Hello from Vercel!', ts: new Date().toISOString() }),

  // ---------- Navigation (kept) ----------
  'GET /nav/links': async (_req, res) => {
    const cached = getCache('nav-links');
    if (cached) return res.json({ links: cached });
    const sb = getSupabaseAdmin();
    if (!sb) return res.json({ links: [], error: 'No Supabase config' });
    try {
      const { data, error } = await sb
        .from('nav_links')
        .select('label, href, position')
        .eq('visible', true)
        .order('position', { ascending: true });
      if (error) return res.json({ links: [], error: error.message, fallback: true });
      const links = (data || []).map(l => ({
        label: String(l.label || ''),
        href: String(l.href || '#'),
        position: Number(l.position ?? 0),
      }));
      setCache('nav-links', links);
      return res.json({ links });
    } catch (e) { return res.json({ links: [], error: e.message }); }
  },

  // ---------- Pages (kept) ----------
  'GET /pages/home': async (_req, res) => {
    const cached = getCache('home');
    if (cached) return res.json(cached);
    const sb = getSupabaseAdmin();
    if (!sb) return res.status(500).json({ error: 'No Supabase config' });
    try {
      const { data, error } = await sb
        .from('pages')
        .select('title, page_description, long_description, chips, content')
        .eq('is_home', true)
        .eq('published', true)
        .limit(1)
        .maybeSingle();
      if (error) return res.status(500).json({ error: error.message });
      setCache('home', data || null);
      return res.json(data || null);
    } catch (e) { return res.status(500).json({ error: e.message }); }
  },
  'GET /pages/:slug': async (_req, res, params) => {
    const { slug } = params;
    const cached = getCache(`slug:${slug}`);
    if (cached) return res.json(cached);
    const sb = getSupabaseAdmin();
    if (!sb) return res.status(500).json({ error: 'No Supabase config' });
    try {
      const { data, error } = await sb
        .from('pages')
        .select('id, slug, title, page_description, long_description, chips, content, published')
        .eq('slug', slug)
        .limit(1)
        .maybeSingle();
      if (error) return res.status(500).json({ error: error.message });
      setCache(`slug:${slug}`, data || null);
      return res.json(data || null);
    } catch (e) { return res.status(500).json({ error: e.message }); }
  },

  // ---------- Menus (NEW) ----------
  'GET /menus': async (_req, res) => {
    const sb = getSupabaseAdmin();
    if (!sb) return res.status(500).json({ error: 'No Supabase config' });
    try {
      const { data, error } = await sb.from('menus').select('slug').order('slug');
      if (error) return res.status(500).json({ error: error.message });
      const slugs = (data || []).map(r => r.slug);
      res.json({ slugs, default: slugs.includes('main') ? 'main' : slugs[0] || null });
    } catch (e) { res.status(500).json({ error: e.message }); }
  },
  'GET /menus/:slug': async (_req, res, params) => {
    const { slug } = params;
    const cacheKey = `menu:${slug}`;
    const cached = getCache(cacheKey);
    if (cached) return res.json({ items: cached });
    const sb = getSupabaseAdmin();
    if (!sb) return res.status(500).json({ error: 'No Supabase config' });
    try {
      const { data, error } = await sb
        .from('menus')
        .select('data')
        .eq('slug', slug)
        .maybeSingle(); // <- avoids PGRST116
      if (error) return res.status(500).json({ error: error.message, slug });
      if (!data) {
        const { data: all } = await sb.from('menus').select('slug').order('slug');
        return res.status(404).json({ error: `Menu '${slug}' not found`, availableSlugs: (all || []).map(r => r.slug) });
      }
      const items = Array.isArray(data?.data?.items) ? data.data.items :
                    Array.isArray(data?.data)        ? data.data : [];
      setCache(cacheKey, items);
      return res.json({ items });
    } catch (e) { return res.status(500).json({ error: e.message, slug }); }
  },
  'PUT /menus/:slug': async (req, res, params) => {
    const { slug } = params;
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'Invalid JSON body' }); } }
    if (Buffer.isBuffer(body))    { try { body = JSON.parse(body.toString('utf8')); } catch { return res.status(400).json({ error: 'Invalid JSON body' }); } }
    if (!Array.isArray(body?.items)) return res.status(400).json({ error: 'Body must be { items: [...] }' });
    const sb = getSupabaseAdmin();
    if (!sb) return res.status(500).json({ error: 'No Supabase config' });
    try {
      const { error } = await sb
        .from('menus')
        .upsert({ slug, data: { items: body.items }, updated_at: new Date().toISOString() }, { onConflict: 'slug' });
      if (error) return res.status(500).json({ error: error.message, slug });
      setCache(`menu:${slug}`, body.items);
      return res.json({ ok: true });
    } catch (e) { return res.status(500).json({ error: e.message, slug }); }
  },

  // ---------- WooCommerce (kept) ----------
  'GET /woocommerce/products': async (req, res) => {
    const source = req.query?.source || 'featured';
    const per_page = req.query?.per_page || '20';
    const cacheKey = `woo-${source}-${per_page}`;
    const cached = getCache(cacheKey);
    if (cached) return res.json({ products: cached });
    const base = (process.env.WOOCOMMERCE_BASE_URL || '').replace(/\/+$/, '');
    const key = process.env.WOOCOMMERCE_CONSUMER_KEY;
    const secret = process.env.WOOCOMMERCE_CONSUMER_SECRET;
    if (!base || !key || !secret) return res.status(500).json({ error: 'WooCommerce credentials not configured' });
    try {
      const url = new URL(base + '/wp-json/wc/v3/products');
      url.searchParams.set('per_page', String(per_page));
      url.searchParams.set('status', 'publish');
      url.searchParams.set('featured', 'true');
      url.searchParams.set('_fields', 'id,name,permalink,images,price,regular_price,sale_price');
      url.searchParams.set('consumer_key', key);
      url.searchParams.set('consumer_secret', secret);
      const response = await fetch(url.toString(), { headers: { Accept: 'application/json', 'User-Agent': 'GiftsGuru/1.0' } });
      if (!response.ok) { const text = await response.text(); return res.status(response.status).json({ error: 'WooCommerce API error', details: text }); }
      const data = await response.json();
      const products = data.map(p => ({
        id: p.id, name: p.name, link: p.permalink,
        image: p.images && p.images.length ? p.images[0].src : undefined,
        price: p.price ? parseFloat(p.price) : undefined,
        regular_price: p.regular_price ? parseFloat(p.regular_price) : undefined,
        sale_price: p.sale_price ? parseFloat(p.sale_price) : undefined,
      }));
      setCache(cacheKey, products);
      return res.json({ products });
    } catch (err) { return res.status(500).json({ error: 'Failed to fetch products', details: err.message }); }
  },
  'GET /woocommerce/featured': async (req, res) => {
    req.query = { ...req.query, source: 'featured' };
    return handlers['GET /woocommerce/products'](req, res);
  },

  // ---------- Chat/Search (kept) ----------
  'GET /gifts/chat': async (_req, res) => {
    return res.json({
      message: 'Chat endpoint ready. POST {"query":"your search"} to /api/gifts/chat',
      timestamp: new Date().toISOString()
    });
  },
  'POST /gifts/chat': async (req, res) => {
    try {
      let bodyData = req.body;
      if (typeof bodyData === 'string') { try { bodyData = JSON.parse(bodyData); } catch (e) { return res.status(400).json({ error: 'Invalid JSON', details: e.message }); } }
      if (Buffer.isBuffer(bodyData))    { try { bodyData = JSON.parse(bodyData.toString('utf8')); } catch (e) { return res.status(400).json({ error: 'Invalid JSON', details: e.message }); } }
      const { query, message, sessionId, selectedRefinements, cursor, page, perPage, filters } = bodyData || {};
      const searchQuery = query || message;
      if (!searchQuery || typeof searchQuery !== 'string' || !searchQuery.trim()) {
        return res.status(400).json({ error: 'Missing query/message' });
      }

      const actualSessionId = sessionId || randomUUID();
      const startTime = Date.now();
      const pageSize = perPage || parseInt(process.env.CHAT_PAGE_SIZE) || 12;
      let currentPage = 1;
      if (cursor) { const m = String(cursor).match(/^page:(\d+)$/); if (m) currentPage = parseInt(m[1]); }
      else if (page && page > 0) currentPage = page;

      const client = await getAlgoliaClient();
      let products = [], totalHits = 0, searchLatencyMs = 0;
      if (client) {
        try {
          const indexName = process.env.ALGOLIA_INDEX_NAME || 'gmProducts';
          const searchResult = await client.searchSingleIndex({
            indexName,
            searchParams: { query: searchQuery.trim(), hitsPerPage: pageSize, page: currentPage - 1,
              attributesToRetrieve: ['objectID','title','name','description','price','currency','image','url','link','tags','vendor'] }
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
        } catch (searchError) { console.error('Algolia search error:', searchError); }
      }

      const refineChips = [];
      if (products.length) {
        const allTags = products.flatMap(p => p.tags || []);
        const uniqueTags = [...new Set(allTags)].slice(0, 5);
        refineChips.push(...uniqueTags);
        const prices = products.filter(p => p.price).map(p => p.price);
        if (prices.length) {
          const maxPrice = Math.max(...prices);
          if (maxPrice > 50) refineChips.push('under $50');
          if (maxPrice > 100) refineChips.push('under $100');
        }
      }

      const totalPages = Math.ceil(totalHits / pageSize);
      const hasNext = currentPage < totalPages;
      const hasPrev = currentPage > 1;
      const pageInfo = { total: totalHits, pageSize, page: currentPage, totalPages,
        ...(hasNext && { nextCursor: `page:${currentPage + 1}` }),
        ...(hasPrev && { prevCursor: `page:${currentPage - 1}` }) };

      const reply = totalHits > 0
        ? `Found ${totalHits} result${totalHits === 1 ? '' : 's'} for "${searchQuery.trim()}".`
        : `Sorry, no results for "${searchQuery.trim()}".`;

      return res.json({
        reply, products, refineChips, pageInfo,
        appliedFilters: filters, facets: {},
        meta: { queryLatencyMs: Date.now() - startTime, source: 'algolia', intentToken: Buffer.from(JSON.stringify({ query: searchQuery.trim(), selectedRefinements: selectedRefinements || [] })).toString('base64'), broadened: false }
      });
    } catch (error) { return res.status(500).json({ error: 'Failed to process chat request', details: error.message }); }
  },

  // ---------- Admin ----------
  'POST /admin/cache/refresh': async (_req, res) => { cache.clear(); return res.json({ success: true, message: 'Cache cleared', ts: new Date().toISOString() }); }
};

// ---- Main catch-all handler
export default async function handler(req, res) {
  try {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.status(200).end();

    // Normalize path: strip /api prefix (Vercel includes it for functions)
    const path = req.url?.split('?')[0] || '/';
    const normalizedPath = path.startsWith('/api') ? path.substring(4) : path;

    let route = `${req.method} ${normalizedPath}`;
    let params = {};

    // exact match first
    if (handlers[route]) return await handlers[route](req, res, params);

    // dynamic: /pages/:slug
    if (normalizedPath.startsWith('/pages/') && normalizedPath !== '/pages/home') {
      params.slug = normalizedPath.substring(7);
      route = `${req.method} /pages/:slug`;
    }

    // dynamic: /menus/:slug
    if (!handlers[route] && normalizedPath.startsWith('/menus/') && normalizedPath !== '/menus') {
      params.slug = normalizedPath.substring(7);
      route = `${req.method} /menus/:slug`;
    }

    // final dispatch
    if (handlers[route]) return await handlers[route](req, res, params);

    return res.status(404).json({ error: 'Endpoint not found', path: normalizedPath, method: req.method, availableRoutes: Object.keys(handlers) });
  } catch (error) {
    console.error('API handler error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message, ts: new Date().toISOString() });
  }
}