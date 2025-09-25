// Simple debug endpoint to test environment variables
module.exports = (req, res) => {
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Check environment variables
    const envCheck = {
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      supabaseUrlPrefix: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.substring(0, 20) + '...' : 'missing',
      hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE,
      supabaseKeyPrefix: process.env.SUPABASE_SERVICE_ROLE ? process.env.SUPABASE_SERVICE_ROLE.substring(0, 20) + '...' : 'missing',
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      openaiKeyPrefix: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 20) + '...' : 'missing',
      hasAlgolia: !!process.env.ALGOLIA_APP_ID,
      algoliaAppId: process.env.ALGOLIA_APP_ID || 'missing',
      nodeEnv: process.env.NODE_ENV,
      platform: process.platform,
      isVercel: !!process.env.VERCEL,
      timestamp: new Date().toISOString(),
      envKeysCount: Object.keys(process.env).length
    };

    res.status(200).json(envCheck);
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({
      error: 'Debug endpoint failed',
      message: error.message || String(error)
    });
  }
};