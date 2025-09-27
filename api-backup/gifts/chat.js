// Algolia chat/search endpoint
import { randomUUID } from 'crypto';

async function getAlgoliaClient() {
  const appId = process.env.ALGOLIA_APP_ID;
  const apiKey = process.env.ALGOLIA_API_KEY;

  if (!appId || !apiKey) return null;

  try {
    // Dynamic import for algoliasearch using the correct pattern
    const mod = await import('algoliasearch');
    const ctor = mod.default ?? mod.algoliasearch;
    return ctor(appId, apiKey);
  } catch (error) {
    console.error('Failed to import algoliasearch:', error);
    return null;
  }
}

async function searchProducts(query, filters = [], limit = 12, context) {
  const client = await getAlgoliaClient();
  if (!client) return [];

  const indexName = process.env.ALGOLIA_INDEX_NAME || 'gmProducts';
  const index = client.initIndex(indexName);

  try {
    const { hits } = await index.search(query, {
      hitsPerPage: limit,
      filters: filters.join(' AND '),
    });

    return hits.map(hit => ({
      id: hit.objectID || hit.id,
      name: hit.name || hit.title,
      link: hit.link || hit.url,
      image: hit.image,
      price: hit.price,
      regular_price: hit.regular_price,
      sale_price: hit.sale_price,
    }));
  } catch (error) {
    console.error('Algolia search error:', error);
    return [];
  }
}

async function parseUserQueryWithOpenAI(query) {
  // If OpenAI is not available, return a simple fallback
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return {
      intent: query.toLowerCase().includes('gift') ? 'gift_search' : 'general_search',
      keywords: query.split(' ').filter(word => word.length > 2),
      chips: [],
      context: { fallback: true }
    };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a gift recommendation assistant. Parse user queries and extract gift intent, keywords, and relevant context. Return JSON only.'
          },
          {
            role: 'user',
            content: `Parse this gift query: "${query}"`
          }
        ],
        max_tokens: 150,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (content) {
      try {
        return JSON.parse(content);
      } catch {
        // Fallback if JSON parsing fails
        return {
          intent: 'gift_search',
          keywords: query.split(' ').filter(word => word.length > 2),
          chips: [],
          context: { openai_fallback: true }
        };
      }
    }

    throw new Error('No content in OpenAI response');

  } catch (error) {
    console.error('OpenAI parsing error:', error);
    // Fallback parsing
    return {
      intent: query.toLowerCase().includes('gift') ? 'gift_search' : 'general_search',
      keywords: query.split(' ').filter(word => word.length > 2),
      chips: [],
      context: { error: error.message }
    };
  }
}

function logChatEvent(data) {
  // Simple console logging for now
  console.log('Chat event:', {
    timestamp: new Date().toISOString(),
    ...data
  });
}

export default async function handler(req, res) {
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method === 'GET') {
      return res.status(200).json({
        message: "Chat endpoint ready. Send POST request with {\"query\": \"your search\"} to search.",
        timestamp: new Date().toISOString(),
        method: 'POST'
      });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed. Use POST.' });
    }

    const started = Date.now();
    let bodyAny = req.body;

    // Parse body if it's a string or buffer
    if (typeof bodyAny === "string") {
      try {
        bodyAny = JSON.parse(bodyAny);
      } catch {}
    }
    if (bodyAny && typeof bodyAny === "object" && Buffer.isBuffer(bodyAny)) {
      try {
        bodyAny = JSON.parse(bodyAny.toString("utf8"));
      } catch {}
    }

    const { query, sessionId } = bodyAny || {};

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return res.status(400).json({
        error: "Missing or invalid query parameter",
        timestamp: new Date().toISOString()
      });
    }

    const actualSessionId = sessionId || randomUUID();

    // Parse the user query
    const parseResult = await parseUserQueryWithOpenAI(query.trim());

    // Search for products
    const searchQuery = parseResult.keywords?.join(' ') || query;
    const products = await searchProducts(searchQuery, [], 12, parseResult.context);

    const elapsed = Date.now() - started;

    // Log the event
    logChatEvent({
      sessionId: actualSessionId,
      query: query.trim(),
      parseResult,
      productCount: products.length,
      elapsed
    });

    return res.json({
      sessionId: actualSessionId,
      query: query.trim(),
      intent: parseResult.intent || 'general_search',
      keywords: parseResult.keywords || [],
      chips: parseResult.chips || [],
      products,
      metadata: {
        elapsed,
        timestamp: new Date().toISOString(),
        context: parseResult.context
      }
    });

  } catch (error) {
    console.error('Chat endpoint error:', error);
    return res.status(500).json({
      error: "Failed to process chat request",
      details: error?.message,
      timestamp: new Date().toISOString()
    });
  }
}