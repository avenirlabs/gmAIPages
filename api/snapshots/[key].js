/**
 * Snapshots Endpoint - Server-Rendered Product Cards
 *
 * Provides curated product snapshots for WordPress plugin server-side rendering.
 * Dual mode: Algolia (production) or Static presets (demo/fallback).
 *
 * @route GET /api/snapshots/:key.json
 * @example GET /api/snapshots/dad-birthday.json
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * @typedef {Object} SnapshotItem
 * @property {string} id - Unique product identifier
 * @property {string} title - Product name
 * @property {string} url - Absolute URL to product page
 * @property {string} image - Absolute URL to product image
 * @property {number} price - Price in PAISE (₹699 = 69900)
 * @property {string} [currency] - ISO currency code (default: INR)
 * @property {string} [badge] - Optional badge text
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const BASE_URL = 'https://www.giftsmate.net';
const CDN_URL = 'https://www.giftsmate.net'; // Can be changed to CDN domain

// Algolia configuration
const ALGOLIA_APP_ID = process.env.ALGOLIA_APP_ID || '';
const ALGOLIA_API_KEY = process.env.ALGOLIA_API_KEY || '';
const ALGOLIA_INDEX_PREFIX = process.env.ALGOLIA_INDEX_PREFIX || 'giftsmate';

// Check if Algolia is configured
const HAS_ALGOLIA = !!(ALGOLIA_APP_ID && ALGOLIA_API_KEY);

// ============================================================================
// STATIC DEMO PRESETS
// ============================================================================

const SNAPSHOT_PRESETS = {
  'dad-birthday': [
    {
      id: 'demo-dad-001',
      title: 'Premium Leather Wallet - Classic Black',
      url: '/product/premium-leather-wallet',
      image: '/images/wallet-black.jpg',
      price: 149900, // ₹1499
      badge: 'Best Seller'
    },
    {
      id: 'demo-dad-002',
      title: 'Wireless Bluetooth Headphones',
      url: '/product/bluetooth-headphones',
      image: '/images/headphones.jpg',
      price: 249900, // ₹2499
      badge: 'Trending'
    },
    {
      id: 'demo-dad-003',
      title: 'Stainless Steel Water Bottle',
      url: '/product/steel-water-bottle',
      image: '/images/water-bottle.jpg',
      price: 79900, // ₹799
    },
    {
      id: 'demo-dad-004',
      title: 'Grooming Kit - Professional Set',
      url: '/product/grooming-kit',
      image: '/images/grooming-kit.jpg',
      price: 199900, // ₹1999
      badge: 'Premium'
    },
    {
      id: 'demo-dad-005',
      title: 'Smart Watch - Fitness Tracker',
      url: '/product/smart-watch',
      image: '/images/smart-watch.jpg',
      price: 349900, // ₹3499
      badge: 'New Arrival'
    },
    {
      id: 'demo-dad-006',
      title: 'Coffee Maker - Automatic',
      url: '/product/coffee-maker',
      image: '/images/coffee-maker.jpg',
      price: 299900, // ₹2999
    },
    {
      id: 'demo-dad-007',
      title: 'Tool Set - 52 Pieces',
      url: '/product/tool-set',
      image: '/images/tool-set.jpg',
      price: 179900, // ₹1799
    },
    {
      id: 'demo-dad-008',
      title: 'Personalized Photo Frame',
      url: '/product/photo-frame',
      image: '/images/photo-frame.jpg',
      price: 59900, // ₹599
    }
  ],

  'mom-anniversary': [
    {
      id: 'demo-mom-001',
      title: 'Elegant Pearl Necklace',
      url: '/product/pearl-necklace',
      image: '/images/pearl-necklace.jpg',
      price: 299900, // ₹2999
      badge: 'Premium'
    },
    {
      id: 'demo-mom-002',
      title: 'Luxury Spa Gift Set',
      url: '/product/spa-gift-set',
      image: '/images/spa-set.jpg',
      price: 199900, // ₹1999
      badge: 'Best Seller'
    },
    {
      id: 'demo-mom-003',
      title: 'Aromatherapy Diffuser',
      url: '/product/aromatherapy-diffuser',
      image: '/images/diffuser.jpg',
      price: 149900, // ₹1499
    },
    {
      id: 'demo-mom-004',
      title: 'Silk Scarf - Designer Collection',
      url: '/product/silk-scarf',
      image: '/images/silk-scarf.jpg',
      price: 179900, // ₹1799
    },
    {
      id: 'demo-mom-005',
      title: 'Premium Tea Gift Box',
      url: '/product/tea-gift-box',
      image: '/images/tea-box.jpg',
      price: 129900, // ₹1299
      badge: 'Curated'
    },
    {
      id: 'demo-mom-006',
      title: 'Handcrafted Jewelry Box',
      url: '/product/jewelry-box',
      image: '/images/jewelry-box.jpg',
      price: 249900, // ₹2499
    },
    {
      id: 'demo-mom-007',
      title: 'Rose Gold Bracelet',
      url: '/product/rose-gold-bracelet',
      image: '/images/bracelet.jpg',
      price: 349900, // ₹3499
      badge: 'Exclusive'
    },
    {
      id: 'demo-mom-008',
      title: 'Organic Skincare Set',
      url: '/product/skincare-set',
      image: '/images/skincare.jpg',
      price: 219900, // ₹2199
    }
  ],

  'tech-lover': [
    {
      id: 'demo-tech-001',
      title: 'Wireless Charging Pad',
      url: '/product/wireless-charger',
      image: '/images/wireless-charger.jpg',
      price: 149900, // ₹1499
    },
    {
      id: 'demo-tech-002',
      title: 'Portable Power Bank 20000mAh',
      url: '/product/power-bank',
      image: '/images/power-bank.jpg',
      price: 179900, // ₹1799
      badge: 'Fast Charging'
    },
    {
      id: 'demo-tech-003',
      title: 'Bluetooth Speaker - Waterproof',
      url: '/product/bluetooth-speaker',
      image: '/images/speaker.jpg',
      price: 249900, // ₹2499
      badge: 'Best Seller'
    },
    {
      id: 'demo-tech-004',
      title: 'USB-C Hub - 7-in-1',
      url: '/product/usb-hub',
      image: '/images/usb-hub.jpg',
      price: 129900, // ₹1299
    },
    {
      id: 'demo-tech-005',
      title: 'Gaming Mouse - RGB',
      url: '/product/gaming-mouse',
      image: '/images/gaming-mouse.jpg',
      price: 199900, // ₹1999
      badge: 'Gaming'
    },
    {
      id: 'demo-tech-006',
      title: 'Mechanical Keyboard',
      url: '/product/mechanical-keyboard',
      image: '/images/keyboard.jpg',
      price: 349900, // ₹3499
    },
    {
      id: 'demo-tech-007',
      title: 'Webcam HD 1080p',
      url: '/product/webcam',
      image: '/images/webcam.jpg',
      price: 279900, // ₹2799
    },
    {
      id: 'demo-tech-008',
      title: 'Smart LED Bulb - WiFi',
      url: '/product/smart-bulb',
      image: '/images/smart-bulb.jpg',
      price: 99900, // ₹999
      badge: 'Smart Home'
    }
  ]
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Normalize and validate a raw item to SnapshotItem format
 * @param {any} raw - Raw item from Algolia or static preset
 * @returns {SnapshotItem|null} - Normalized item or null if invalid
 */
function normalizeItem(raw) {
  try {
    // Extract fields (handle both Algolia and static formats)
    const id = raw.id || raw.objectID || raw.sku || '';
    const title = raw.title || raw.name || '';
    const url = raw.url || raw.permalink || '';
    const image = raw.image || raw.images?.[0]?.src || raw.image_url || '';
    const priceRaw = raw.price || raw.regular_price || 0;
    const currency = raw.currency || 'INR';
    const badge = raw.badge || (raw.featured ? 'Featured' : '');

    // Validate required fields
    if (!id || !title || !url || !image) {
      return null;
    }

    // Convert price to paise (integer)
    let pricePaise = 0;
    if (typeof priceRaw === 'number') {
      // If already a large number (>10000), assume it's paise
      pricePaise = priceRaw > 10000 ? Math.round(priceRaw) : Math.round(priceRaw * 100);
    } else if (typeof priceRaw === 'string') {
      // Parse string price
      const parsed = parseFloat(priceRaw.replace(/[^0-9.]/g, ''));
      if (!isNaN(parsed)) {
        pricePaise = parsed > 10000 ? Math.round(parsed) : Math.round(parsed * 100);
      }
    }

    // Ensure price is positive
    if (pricePaise <= 0) {
      return null;
    }

    // Ensure absolute URLs
    const absoluteUrl = url.startsWith('http') ? url : `${BASE_URL}${url.startsWith('/') ? url : '/' + url}`;
    const absoluteImage = image.startsWith('http') ? image : `${CDN_URL}${image.startsWith('/') ? image : '/' + image}`;

    return {
      id: String(id),
      title: String(title).slice(0, 100), // Cap title length
      url: absoluteUrl,
      image: absoluteImage,
      price: pricePaise,
      currency: currency,
      ...(badge && { badge: String(badge) })
    };
  } catch (error) {
    console.error('[Snapshots] normalizeItem error:', error);
    return null;
  }
}

/**
 * Fetch items from Algolia
 * @param {string} key - Snapshot key
 * @param {number} limit - Max items to return
 * @returns {Promise<SnapshotItem[]>}
 */
async function fetchFromAlgolia(key, limit = 24) {
  try {
    // Try index-per-key first: {prefix}_{key}
    const indexName = `${ALGOLIA_INDEX_PREFIX}_${key.replace(/[^a-z0-9_-]/gi, '_')}`;

    const url = `https://${ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/${indexName}/query`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-Algolia-API-Key': ALGOLIA_API_KEY,
        'X-Algolia-Application-Id': ALGOLIA_APP_ID,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: '',
        hitsPerPage: limit,
        attributesToRetrieve: ['objectID', 'name', 'title', 'sku', 'permalink', 'url', 'images', 'image', 'price', 'regular_price', 'currency', 'featured', 'badge']
      })
    });

    if (!response.ok) {
      // If index doesn't exist, try fallback with filters
      return await fetchFromAlgoliaWithFilters(key, limit);
    }

    const data = await response.json();
    const hits = data.hits || [];

    return hits.map(normalizeItem).filter(Boolean).slice(0, limit);
  } catch (error) {
    console.error('[Snapshots] Algolia fetch error:', error);
    return [];
  }
}

/**
 * Fetch items from Algolia with filters (fallback)
 * @param {string} key - Snapshot key
 * @param {number} limit - Max items to return
 * @returns {Promise<SnapshotItem[]>}
 */
async function fetchFromAlgoliaWithFilters(key, limit = 24) {
  try {
    // Parse key (e.g., "dad-birthday" → filters for "dad" and "birthday")
    const parts = key.split('-').filter(Boolean);
    const filters = parts.map(p => `tags:${p} OR category:${p}`).join(' OR ');

    const indexName = `${ALGOLIA_INDEX_PREFIX}_products`;
    const url = `https://${ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/${indexName}/query`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-Algolia-API-Key': ALGOLIA_API_KEY,
        'X-Algolia-Application-Id': ALGOLIA_APP_ID,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: '',
        filters: filters || undefined,
        hitsPerPage: limit,
        attributesToRetrieve: ['objectID', 'name', 'title', 'sku', 'permalink', 'url', 'images', 'image', 'price', 'regular_price', 'currency', 'featured', 'badge']
      })
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const hits = data.hits || [];

    return hits.map(normalizeItem).filter(Boolean).slice(0, limit);
  } catch (error) {
    console.error('[Snapshots] Algolia with filters error:', error);
    return [];
  }
}

/**
 * Get items for a snapshot key (Algolia or static)
 * @param {string} key - Snapshot key
 * @param {number} limit - Max items to return
 * @returns {Promise<SnapshotItem[]>}
 */
async function getItemsForKey(key, limit = 24) {
  // Mode A: Algolia (if configured)
  if (HAS_ALGOLIA) {
    const items = await fetchFromAlgolia(key, limit);
    if (items.length > 0) {
      return items;
    }
    // Fall through to static if Algolia returns empty
  }

  // Mode B: Static presets
  const preset = SNAPSHOT_PRESETS[key] || [];
  return preset.map(normalizeItem).filter(Boolean).slice(0, limit);
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

/**
 * Main request handler
 */
export default async function handler(req, res) {
  try {
    // CORS headers
    res.setHeader('access-control-allow-origin', '*');
    res.setHeader('access-control-allow-methods', 'GET, OPTIONS');
    res.setHeader('access-control-allow-headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }

    // Only accept GET
    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    // Extract snapshot key from path
    const key = req.query.key || '';

    // Parse limit from query string (optional)
    const limitParam = req.query.limit ? parseInt(req.query.limit, 10) : 24;
    const limit = Math.min(24, Math.max(1, limitParam));

    // Fetch items (never throw, return [] on error)
    const items = await getItemsForKey(key, limit);

    // Dedupe by id
    const seen = new Set();
    const dedupedItems = items.filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });

    // Set cache headers
    res.setHeader('content-type', 'application/json');
    res.setHeader('cache-control', 'public, s-maxage=3600, stale-while-revalidate=86400');

    // Always 200, even for unknown keys (return [])
    res.status(200).json(dedupedItems);

  } catch (error) {
    // Never fail - return empty array
    console.error('[Snapshots] Handler error:', error);

    res.setHeader('content-type', 'application/json');
    res.setHeader('cache-control', 'public, s-maxage=60, stale-while-revalidate=600');
    res.setHeader('access-control-allow-origin', '*');

    res.status(200).json([]);
  }
}
