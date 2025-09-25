// Test WooCommerce connection
export default async function handler(req, res) {
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    const base = (process.env.WOOCOMMERCE_BASE_URL || "").replace(/\/+$/, "");
    const key = process.env.WOOCOMMERCE_CONSUMER_KEY;
    const secret = process.env.WOOCOMMERCE_CONSUMER_SECRET;

    if (!base || !key || !secret) {
      return res.json({
        error: "WooCommerce credentials not configured",
        hasBase: !!base,
        hasKey: !!key,
        hasSecret: !!secret,
        basePrefix: base ? base.substring(0, 20) + '...' : 'missing'
      });
    }

    // Test connection with a simple API call
    const url = new URL(base + "/wp-json/wc/v3/products");
    url.searchParams.set("per_page", "1");
    url.searchParams.set("status", "publish");
    url.searchParams.set("consumer_key", key);
    url.searchParams.set("consumer_secret", secret);

    console.log('Testing WooCommerce URL:', url.toString().replace(key, 'KEY').replace(secret, 'SECRET'));

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "GiftsGuru/1.0"
      },
    });

    const responseText = await response.text();

    return res.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      responsePreview: responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''),
      url: url.toString().replace(key, 'KEY').replace(secret, 'SECRET')
    });

  } catch (error) {
    console.error('WooCommerce test error:', error);
    return res.json({
      error: error.message,
      stack: error.stack
    });
  }
}