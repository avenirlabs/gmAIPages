// Admin cache refresh endpoint
export default async function handler(req, res) {
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // For now, just return success - in a full implementation this would clear caches
    console.log('Cache refresh requested at:', new Date().toISOString());

    return res.json({
      success: true,
      message: "Cache refresh initiated",
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Cache refresh error:', error);
    return res.status(500).json({
      error: "Failed to refresh cache",
      details: error?.message,
      timestamp: new Date().toISOString()
    });
  }
}