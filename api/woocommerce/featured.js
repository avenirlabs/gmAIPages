// WooCommerce featured products endpoint

// Cache with TTL and ETag
const cache = new Map();
const TTL_MS = 1000 * 60 * 10; // 10 minutes

function computeEtag(obj) {
  const s = JSON.stringify(obj);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return `W/"${h.toString(16)}-${s.length}"`;
}

function mapProducts(data) {
  return data.map((p) => ({
    id: p.id,
    name: p.name,
    link: p.permalink,
    image: p.images && p.images.length ? p.images[0].src : undefined,
    price: p.price ? parseFloat(p.price) : undefined,
    regular_price: p.regular_price ? parseFloat(p.regular_price) : undefined,
    sale_price: p.sale_price ? parseFloat(p.sale_price) : undefined,
  }));
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

    const base = (process.env.WOOCOMMERCE_BASE_URL || "").replace(/\/+$/, "");
    const key = process.env.WOOCOMMERCE_CONSUMER_KEY;
    const secret = process.env.WOOCOMMERCE_CONSUMER_SECRET;

    if (!base || !key || !secret) {
      return res.status(500).json({ error: "WooCommerce credentials not configured" });
    }

    const per_page = req.query.per_page || "20";
    const cacheKey = `featured:${per_page}`;
    const hit = cache.get(cacheKey);

    if (hit && Date.now() - hit.at < TTL_MS) {
      const inm = req.headers["if-none-match"];
      if (inm && inm === hit.etag) {
        return res.status(304).end();
      }
      res.setHeader("ETag", hit.etag);
      res.setHeader("Cache-Control", "public, max-age=300");
      return res.json({ products: hit.data });
    }

    const url = new URL(base + "/wp-json/wc/v3/products");
    url.searchParams.set("per_page", String(per_page));
    url.searchParams.set("status", "publish");
    url.searchParams.set("featured", "true");
    url.searchParams.set("_fields", "id,name,permalink,images,price,regular_price,sale_price");
    url.searchParams.set("consumer_key", key);
    url.searchParams.set("consumer_secret", secret);

    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({
        error: "WooCommerce API error",
        details: text
      });
    }

    const data = await response.json();
    const products = mapProducts(data);
    const etag = computeEtag(products);

    cache.set(cacheKey, { at: Date.now(), data: products, etag });

    res.setHeader("ETag", etag);
    res.setHeader("Cache-Control", "public, max-age=300");
    return res.json({ products });

  } catch (err) {
    console.error('WooCommerce endpoint error:', err);
    return res.status(500).json({
      error: "Failed to fetch products",
      details: err?.message,
      timestamp: new Date().toISOString()
    });
  }
}