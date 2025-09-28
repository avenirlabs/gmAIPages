import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'crypto';

interface ChatRequest {
  query: string;
  sessionId?: string;
  topK?: number;
}

interface ChatResponse {
  ok: boolean;
  source: 'stub' | 'openai';
  query: string;
  suggestions: string[];
  results: Array<{
    title: string;
    url: string;
    score: number;
    reason: string;
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

  // Generate suggestions based on query keywords
  const suggestions: string[] = [];
  for (const [keyword, categoryList] of Object.entries(GIFT_CATEGORIES)) {
    if (normalizedQuery.includes(keyword)) {
      suggestions.push(...categoryList.slice(0, 2));
    }
  }

  // Add some default suggestions if none matched
  if (suggestions.length === 0) {
    suggestions.push('Popular Gifts', 'Trending Items', 'Gift Cards');
  }

  // Generate results based on query keywords
  const results = [];
  let score = 0.9;

  for (const [keyword, product] of Object.entries(PRODUCT_SUGGESTIONS)) {
    if (normalizedQuery.includes(keyword) && results.length < 5) {
      results.push({
        ...product,
        score: score,
        reason: `Matches "${keyword}" in your search: ${product.reason}`
      });
      score -= 0.1;
    }
  }

  // Add default results if none matched
  if (results.length === 0) {
    results.push(
      {
        title: 'Gift Voucher',
        url: '/products/gift-voucher',
        score: 0.8,
        reason: 'Versatile gift option for any occasion'
      },
      {
        title: 'Personalized Photo Frame',
        url: '/products/photo-frame',
        score: 0.7,
        reason: 'Memorable keepsake with personal touch'
      }
    );
  }

  return {
    source: 'stub',
    query,
    suggestions: [...new Set(suggestions)].slice(0, 5),
    results
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

    return {
      source: 'openai',
      query,
      suggestions: parsed.suggestions.slice(0, 5),
      results: parsed.results.slice(0, 4).map((item: any) => ({
        title: String(item.title || 'Gift Item'),
        url: String(item.url || '/products/item'),
        score: Math.max(0, Math.min(1, Number(item.score) || 0.5)),
        reason: String(item.reason || 'Recommended gift option')
      }))
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

    // Generate response using OpenAI if available, otherwise use stub
    let responseData: Omit<ChatResponse, 'ok' | 'requestId'>;

    if (process.env.OPENAI_API_KEY) {
      responseData = await getOpenAIResponse(query);
    } else {
      responseData = generateStubResponse(query);
    }

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