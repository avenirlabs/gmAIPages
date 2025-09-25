// Simple ping endpoint
module.exports = (req, res) => {
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    const ping = process.env.PING_MESSAGE || "pong";
    res.status(200).json({
      message: ping,
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url
    });
  } catch (error) {
    console.error('Ping endpoint error:', error);
    res.status(500).json({
      error: 'Ping failed',
      message: error.message || String(error)
    });
  }
};