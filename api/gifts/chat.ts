import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'crypto';

// Algolia integration (inlined to avoid import issues in serverless)
interface AlgoliaHit {
  objectID: string;
  title?: string;
  name?: string;
  product_title?: string;
  heading?: string;
  url?: string;
  permalink?: string;
  slug?: string;
  handle?: string;
  image?: string;
  images?: string[];
  thumbnail?: string;
  _rankingInfo?: { nbExactWords?: number; };
  [key: string]: any;
}

interface MappedHit {
  id: string;
  title: string;
  url: string;
  image: string | null;
  score: number;
  reason: string;
  price?: number;
  currency?: string;
  description?: string;
}

interface AlgoliaSearchResult {
  source: 'algolia' | 'stub';
  results: MappedHit[];
}

async function getAlgoliaIndex() {
  try {
    const appId = process.env.ALGOLIA_APP_ID;
    const apiKey = process.env.ALGOLIA_API_KEY;
    const indexName = process.env.ALGOLIA_INDEX_NAME;

    if (!appId || !apiKey || !indexName) {
      return null;
    }

    const mod = await import('algoliasearch');
    const { algoliasearch } = mod;

    if (typeof algoliasearch !== 'function') {
      throw new Error(`algoliasearch is not a function, got ${typeof algoliasearch}`);
    }

    const client = algoliasearch(appId, apiKey);
    return { client, indexName };
  } catch (error) {
    console.error('[algolia]', { msg: 'Failed to initialize', error: error?.message });
    return null;
  }
}

function mapHit(hit: AlgoliaHit): MappedHit {
  const title = hit.title || hit.name || hit.product_title || hit.heading || String(hit.objectID);

  let url: string;
  if (hit.url) {
    url = hit.url;
  } else if (hit.permalink) {
    url = hit.permalink;
  } else if (hit.slug) {
    url = `/products/${hit.slug}`;
  } else if (hit.handle) {
    url = `/products/${hit.handle}`;
  } else {
    url = `/products/${hit.objectID}`;
  }

  const image = hit.image || hit.images?.[0] || hit.thumbnail || null;
  const score = hit._rankingInfo?.nbExactWords || 1;

  return {
    id: hit.objectID,
    title,
    url,
    image,
    score,
    reason: 'algolia match',
    price: hit.price ? Number(hit.price) : undefined,
    currency: hit.currency || 'USD',
    description: hit.description || title
  };
}

async function searchAlgolia(q: string, topK: number = 10): Promise<AlgoliaSearchResult> {
  try {
    const algoliaConfig = await getAlgoliaIndex();

    if (!algoliaConfig) {
      return { source: 'stub', results: [] };
    }

    const { client, indexName } = algoliaConfig;

    const searchResponse = await client.searchSingleIndex({
      indexName,
      searchParams: {
        query: q,
        hitsPerPage: topK
      }
    });

    const results = searchResponse.hits.map((hit: any) => mapHit(hit as AlgoliaHit));

    return {
      source: 'algolia',
      results
    };

  } catch (error) {
    console.error('[algolia]', { msg: error?.message });
    return { source: 'stub', results: [] };
  }
}

interface ChatRequest {
  query: string;
  sessionId?: string;
  topK?: number;
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

function generateStubResponse(query: string): Omit<ChatResponse, 'ok' | 'requestId'> {
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

async function getOpenAIResponse(query: string): Promise<Omit<ChatResponse, 'ok' | 'requestId'>> {
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

    const results = parsed.results.slice(0, 4).map((item: any, index: number) => ({
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
      suggestions: parsed.suggestions.slice(0, 5)
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
    return res.status(405).json({
      ok: false,
      error: 'Method not allowed. Use POST.'
    });
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
      return res.status(400).json({
        ok: false,
        error: 'Invalid JSON body',
        requestId
      });
    }

    // Validate required fields
    if (!body || typeof body.query !== 'string' || !body.query.trim()) {
      return res.status(400).json({
        ok: false,
        error: 'Missing or invalid query parameter',
        requestId
      });
    }

    const query = body.query.trim();
    const topK = body.topK || 10;

    // Build stub results first (existing behavior)
    const stubResults = generateStubResponse(query);

    // Try Algolia search first
    const algoliaSearch = await searchAlgolia(query, topK);

    let responseData: Omit<ChatResponse, 'ok' | 'requestId'>;
    let source: 'algolia' | 'openai' | 'stub' = 'stub';

    if (algoliaSearch.source === 'algolia' && algoliaSearch.results.length > 0) {
      // Use Algolia results
      source = 'algolia';
      responseData = {
        source: 'algolia',
        query,
        reply: `Found ${algoliaSearch.results.length} products matching "${query}". These are real products from our catalog.`,
        results: algoliaSearch.results,
        suggestions: stubResults.suggestions // Use stub suggestions as fallback
      };
    } else if (process.env.OPENAI_API_KEY) {
      // Fall back to OpenAI
      try {
        responseData = await getOpenAIResponse(query);
        source = responseData.source as 'openai';
      } catch (error) {
        console.error('OpenAI fallback failed:', error);
        responseData = stubResults;
        source = 'stub';
      }
    } else {
      // Use stub response
      responseData = stubResults;
      source = 'stub';
    }

    // Add timing logs
    console.log('[chat]', { source, q: query, hits: responseData.results.length });

    const response: ChatResponse = {
      ok: true,
      requestId,
      ...responseData
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('Chat API error:', error);
    return res.status(500).json({
      ok: false,
      error: 'Internal server error',
      requestId
    });
  }
}