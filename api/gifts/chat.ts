import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'crypto';
import { searchProductsPaginated } from '../_services/search.js';
import { buildRefineChips } from '../_services/chips.js';

// Production guard: if true, return 503 when Algolia unavailable (no stubs)
const REQUIRE_ALGOLIA = String(process.env.REQUIRE_ALGOLIA || '').toLowerCase() === 'true';

// Defensive array utility
const safeArray = <T>(x: T[] | undefined | null): T[] => Array.isArray(x) ? x : [];

// Normalize filters to arrays (handle single strings)
const normalizeFilters = (filters: any) => {
  if (!filters || typeof filters !== 'object') return {};

  const normalized: any = {};

  // Normalize relation, occasion, interest to arrays
  ['relation', 'occasion', 'interest'].forEach(key => {
    if (filters[key]) {
      if (typeof filters[key] === 'string') {
        normalized[key] = [filters[key]];
      } else if (Array.isArray(filters[key])) {
        normalized[key] = safeArray(filters[key]);
      }
    }
  });

  // Handle priceRange (must be array of 2 numbers or null)
  if (filters.priceRange) {
    if (Array.isArray(filters.priceRange) && filters.priceRange.length === 2) {
      const [min, max] = filters.priceRange;
      if (typeof min === 'number' && typeof max === 'number') {
        normalized.priceRange = [min, max];
      }
    }
  }

  return normalized;
};

// UI Response Adapter
type UIResponse = {
  ok: true;
  reply: string;
  products: any[];
  refineChips: string[];
  pageInfo: { cursor: string | null; hasMore: boolean; [k: string]: any };
  meta: Record<string, any>;
};

function toUIResponse(input: {
  ok: boolean;
  source: 'algolia'|'openai'|'stub';
  query: string;
  results?: any[];
  suggestions?: string[];
  reply?: string;
  requestId?: string;
  pageInfo?: { cursor?: string | null; hasMore?: boolean; [k: string]: any };
  meta?: Record<string, any>;
}): UIResponse {
  const products = Array.isArray(input.results) ? input.results : [];
  const refineChips = Array.isArray(input.suggestions) ? input.suggestions : [];
  const reply = typeof input.reply === 'string' ? input.reply : '';
  const pageInfo = {
    cursor: input.pageInfo?.cursor ?? null,
    hasMore: Boolean(input.pageInfo?.hasMore),
    ...input.pageInfo
  };
  const meta = { ...(input.meta ?? {}), source: input.source, requestId: input.requestId ?? undefined };
  return { ok: true, reply, products, refineChips, pageInfo, meta };
}

// Chat-specific interfaces

interface ChatRequest {
  query: string;
  sessionId?: string;
  topK?: number;
  cursor?: string | null;
  filters?: {
    relation?: string[];
    occasion?: string[];
    interest?: string[];
    priceRange?: [number, number] | null;
  };
  soft?: boolean;
}

interface ChatResponse {
  ok: boolean;
  source: 'algolia' | 'openai' | 'stub';
  query: string;
  reply: string;
  suggestions: string[];
  results: Array<{
    id: string;
    title: string;
    url: string;
    score: number;
    reason: string;
    price?: number;
    currency?: string;
    image?: string;
    description?: string;
  }>;
  requestId?: string;
  error?: string;
}

// Stub data for deterministic responses
const GIFT_CATEGORIES = {
  dad: ['Dad Gifts', 'Father\'s Day Gifts', 'Gifts for Him'],
  mom: ['Mom Gifts', 'Mother\'s Day Gifts', 'Gifts for Her'],
  wife: ['Wife Gifts', 'Anniversary Gifts', 'Romantic Gifts'],
  husband: ['Husband Gifts', 'Gifts for Him', 'Men\'s Accessories'],
  kids: ['Kids Gifts', 'Children\'s Toys', 'Educational Gifts'],
  baby: ['Baby Gifts', 'Newborn Essentials', 'Baby Shower Gifts'],
  birthday: ['Birthday Gifts', 'Party Supplies', 'Celebration Items'],
  anniversary: ['Anniversary Gifts', 'Romantic Gifts', 'Couple Gifts'],
  diwali: ['Diwali Gifts', 'Festival Gifts', 'Traditional Items'],
  christmas: ['Christmas Gifts', 'Holiday Gifts', 'Festive Items']
};

const PRODUCT_SUGGESTIONS = {
  mug: { title: 'Personalized Photo Mug', url: '/products/photo-mug', reason: 'Perfect for daily use with personal touch' },
  book: { title: 'Bestselling Fiction Book', url: '/products/fiction-book', reason: 'Great for book lovers and relaxation' },
  watch: { title: 'Stylish Wrist Watch', url: '/products/wrist-watch', reason: 'Elegant accessory for any occasion' },
  jewelry: { title: 'Gold Plated Necklace', url: '/products/gold-necklace', reason: 'Beautiful jewelry for special occasions' },
  chocolate: { title: 'Luxury Chocolate Box', url: '/products/chocolate-box', reason: 'Sweet treat that everyone loves' },
  flowers: { title: 'Fresh Flower Bouquet', url: '/products/flower-bouquet', reason: 'Classic gift that brightens any day' },
  perfume: { title: 'Premium Fragrance', url: '/products/premium-perfume', reason: 'Luxurious scent for special someone' },
  wallet: { title: 'Leather Wallet', url: '/products/leather-wallet', reason: 'Practical gift with premium quality' }
};

function generateStubResponse(query: string) {
  const normalizedQuery = query.toLowerCase();

  // Generate refine chips based on query keywords
  const refineChips: string[] = [];
  for (const [keyword, categoryList] of Object.entries(GIFT_CATEGORIES)) {
    if (normalizedQuery.includes(keyword)) {
      refineChips.push(...categoryList.slice(0, 2));
    }
  }

  // Add some default refine chips if none matched
  if (refineChips.length === 0) {
    refineChips.push('Popular Gifts', 'Trending Items', 'Gift Cards');
  }

  // Generate products based on query keywords
  const products = [];
  let score = 0.9;
  let idCounter = 1;

  for (const [keyword, product] of Object.entries(PRODUCT_SUGGESTIONS)) {
    if (normalizedQuery.includes(keyword) && products.length < 5) {
      products.push({
        id: `stub_${idCounter++}`,
        ...product,
        score: score,
        reason: `Matches "${keyword}" in your search: ${product.reason}`,
        price: Math.floor(Math.random() * 100) + 20,
        currency: 'USD',
        image: '/placeholder-gift.jpg',
        description: `${product.title} - ${product.reason}`
      });
      score -= 0.1;
    }
  }

  // Add default products if none matched
  if (products.length === 0) {
    products.push(
      {
        id: 'stub_default_1',
        title: 'Gift Voucher',
        url: '/products/gift-voucher',
        score: 0.8,
        reason: 'Versatile gift option for any occasion',
        price: 50,
        currency: 'USD',
        image: '/placeholder-voucher.jpg',
        description: 'Perfect gift voucher for any special occasion'
      },
      {
        id: 'stub_default_2',
        title: 'Personalized Photo Frame',
        url: '/products/photo-frame',
        score: 0.7,
        reason: 'Memorable keepsake with personal touch',
        price: 35,
        currency: 'USD',
        image: '/placeholder-frame.jpg',
        description: 'Beautiful personalized photo frame for cherished memories'
      }
    );
  }

  return {
    source: 'stub',
    query,
    reply: `Found ${products.length} gift suggestions for "${query}". These are handpicked recommendations that match your search.`,
    results: products,
    suggestions: [...new Set(refineChips)].slice(0, 5)
  };
}

async function getOpenAIResponse(query: string) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Return concise gift ideas as JSON for Indian e-commerce context. Respond with JSON containing "suggestions" (array of 3-5 category strings) and "results" (array of 2-4 objects with title, url, score 0-1, reason). Focus on popular Indian gifts and occasions.'
          },
          {
            role: 'user',
            content: `Find gift suggestions for: ${query}`
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    // Try to parse the JSON response
    const parsed = JSON.parse(content);

    // Validate the structure
    if (!parsed.suggestions || !Array.isArray(parsed.suggestions) ||
        !parsed.results || !Array.isArray(parsed.results)) {
      throw new Error('Invalid response structure from OpenAI');
    }

    const results = safeArray(parsed.results).slice(0, 4).map((item: any, index: number) => ({
      id: `openai_${index + 1}`,
      title: String(item.title || 'Gift Item'),
      url: String(item.url || '/products/item'),
      score: Math.max(0, Math.min(1, Number(item.score) || 0.5)),
      reason: String(item.reason || 'Recommended gift option'),
      price: Math.floor(Math.random() * 100) + 20,
      currency: 'USD',
      image: '/placeholder-gift.jpg',
      description: String(item.title || 'Gift Item')
    }));

    return {
      source: 'openai',
      query,
      reply: `Found ${results.length} AI-powered gift suggestions for "${query}". These recommendations are tailored to your search.`,
      results,
      suggestions: safeArray(parsed.suggestions).slice(0, 5).map(s => String(s))
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    // Fall back to stub response
    return generateStubResponse(query);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    const uiPayload = toUIResponse({
      ok: true,
      source: 'stub',
      query: '',
      results: [],
      suggestions: [],
      reply: 'Method not allowed. Use POST.',
    });
    return res.status(405).json(uiPayload);
  }

  const requestId = randomUUID();

  try {
    let body: ChatRequest;

    // Parse and validate request body
    try {
      if (typeof req.body === 'string') {
        body = JSON.parse(req.body);
      } else if (Buffer.isBuffer(req.body)) {
        body = JSON.parse(req.body.toString('utf8'));
      } else {
        body = req.body;
      }
    } catch {
      const uiPayload = toUIResponse({
        ok: true,
        source: 'stub',
        query: '',
        results: [],
        suggestions: [],
        reply: 'Invalid JSON body',
        requestId,
      });
      return res.status(400).json(uiPayload);
    }

    // Validate required fields
    if (!body || typeof body.query !== 'string' || !body.query.trim()) {
      const uiPayload = toUIResponse({
        ok: true,
        source: 'stub',
        query: '',
        results: [],
        suggestions: [],
        reply: 'Missing or invalid query parameter',
        requestId,
      });
      return res.status(400).json(uiPayload);
    }

    const query = body.query.trim();
    const topK = body.topK || 10;
    const cursor = body.cursor || null;
    const filters = normalizeFilters(body.filters);
    const soft = Boolean(body.soft);

    // Build stub results first (existing behavior)
    const stubResults = generateStubResponse(query);

    // Try paginated Algolia search first
    const searchResult = await searchProductsPaginated(query, { topK, cursor, filters, soft });

    if (searchResult.timings.source === 'algolia' && searchResult.products.length > 0) {
      // Use Algolia results
      const uiPayload = toUIResponse({
        ok: true,
        source: 'algolia',
        query,
        results: searchResult.products,
        suggestions: buildRefineChips(query, searchResult.products),
        reply: `Found ${searchResult.products.length} products matching "${query}". These are real products from our catalog.`,
        requestId,
        pageInfo: searchResult.pageInfo,
        meta: {
          queryLatencyMs: searchResult.timings.queryLatencyMs,
          source: searchResult.timings.source,
          broadened: Boolean(searchResult.broadened)
        }
      });
      return res.status(200).json(uiPayload);
    } else if (REQUIRE_ALGOLIA) {
      // No mock data allowed in required mode (prod)
      console.warn('[chat] algolia required but unavailable; returning 503');
      const uiPayload = toUIResponse({
        ok: false,
        source: 'stub',
        query,
        results: [],
        suggestions: [],
        reply: 'Search temporarily unavailable',
        requestId,
        meta: { reason: 'algolia_missing_or_down' }
      });
      return res.status(503).json(uiPayload);
    } else if (process.env.OPENAI_API_KEY) {
      // Fall back to OpenAI
      try {
        const openaiResponse = await getOpenAIResponse(query);
        const uiPayload = toUIResponse({
          ok: true,
          source: 'openai',
          query,
          results: openaiResponse.results,
          suggestions: buildRefineChips(query, openaiResponse.results || []),
          reply: openaiResponse.reply,
          requestId,
          pageInfo: searchResult.pageInfo,
          meta: {
            queryLatencyMs: searchResult.timings.queryLatencyMs,
            source: 'openai',
            broadened: false
          }
        });
        console.log('[chat]', { source: 'openai', q: query, hits: openaiResponse.results?.length || 0 });
        return res.status(200).json(uiPayload);
      } catch (error) {
        console.error('OpenAI fallback failed:', error);
        const uiPayload = toUIResponse({
          ok: true,
          source: 'stub',
          query,
          results: stubResults.results,
          suggestions: buildRefineChips(query, stubResults.results || []),
          reply: stubResults.reply,
          requestId,
          pageInfo: searchResult.pageInfo,
          meta: {
            queryLatencyMs: searchResult.timings.queryLatencyMs,
            source: 'stub',
            broadened: false
          }
        });
        console.log('[chat]', { source: 'stub', q: query, hits: stubResults.results?.length || 0 });
        return res.status(200).json(uiPayload);
      }
    } else {
      // Use stub response
      const uiPayload = toUIResponse({
        ok: true,
        source: 'stub',
        query,
        results: stubResults.results,
        suggestions: buildRefineChips(query, stubResults.results || []),
        reply: stubResults.reply,
        requestId,
        pageInfo: searchResult.pageInfo,
        meta: {
          queryLatencyMs: searchResult.timings.queryLatencyMs,
          source: 'stub',
          broadened: false
        }
      });
      console.log('[chat]', { source: 'stub', q: query, hits: stubResults.results?.length || 0 });
      return res.status(200).json(uiPayload);
    }

  } catch (error) {
    console.error('Chat API error:', error);
    const uiPayload = toUIResponse({
      ok: true,
      source: 'stub',
      query: '',
      results: [],
      suggestions: [],
      reply: 'Sorry, I had trouble fetching results. Please try again.',
      requestId,
    });
    return res.status(500).json(uiPayload);
  }
}