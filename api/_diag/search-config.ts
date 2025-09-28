import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Set headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      ok: false,
      error: 'Method not allowed. Use GET.'
    });
  }

  // Check environment variables presence (never expose values)
  const config = {
    ok: true,
    algolia: {
      hasAppId: !!process.env.ALGOLIA_APP_ID,
      hasApiKey: !!process.env.ALGOLIA_API_KEY,
      hasIndex: !!process.env.ALGOLIA_INDEX_NAME,
      indexName: process.env.ALGOLIA_INDEX_NAME || null
    },
    supabase: {
      hasUrl: !!process.env.SUPABASE_URL,
      hasAnon: !!process.env.SUPABASE_ANON_KEY
    },
    openai: {
      hasKey: !!process.env.OPENAI_API_KEY
    },
    chatEndpoint: '/api/gifts/chat'
  };

  return res.status(200).json(config);
}