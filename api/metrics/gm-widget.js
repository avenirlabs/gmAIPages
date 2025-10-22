/**
 * Giftsmate Widget Analytics Endpoint
 *
 * Zero-dependency, production-safe metrics intake.
 * Fire-and-forget: always 204, never blocks UX.
 *
 * Events: snapshot_view, chip_click, chat_open, auto_open, widget_loaded, widget_error
 *
 * @endpoint POST /api/metrics/gm-widget
 */

// Event whitelist
const ALLOWED_EVENTS = new Set(['snapshot_view', 'chip_click', 'chat_open', 'auto_open', 'widget_loaded', 'widget_error']);

// Rate limiting: 100 events/min per IP
const rateLimiter = new Map();
const RATE_LIMIT_WINDOW = 60000;
const RATE_LIMIT_MAX = 100;

// Webhook forwarding (optional)
const METRICS_WEBHOOK_URL = process.env.METRICS_WEBHOOK_URL || '';

/**
 * Trim and cap string length
 */
function sanitizeString(str, max = 120) {
  return typeof str === 'string' ? str.trim().slice(0, max) : '';
}

/**
 * Sanitize payload
 */
function sanitizePayload(raw) {
  const s = { event: raw.event, ts: typeof raw.ts === 'number' ? raw.ts : Date.now() };
  if (raw.page_path) s.page_path = sanitizeString(raw.page_path);
  if (raw.snapshot_key) s.snapshot_key = sanitizeString(raw.snapshot_key);
  if (raw.relationship) s.relationship = sanitizeString(raw.relationship);
  if (raw.occasion) s.occasion = sanitizeString(raw.occasion);
  if (raw.chip) s.chip = sanitizeString(raw.chip);
  if (raw.lt) s.lt = sanitizeString(raw.lt, 20);
  if (raw.source) s.source = sanitizeString(raw.source, 20);
  if (raw.code) s.code = sanitizeString(raw.code, 50);
  if (typeof raw.first_prompt_present === 'boolean') s.first_prompt_present = raw.first_prompt_present;
  if (typeof raw.auto_open === 'boolean') s.auto_open = raw.auto_open;
  if (typeof raw.ua_mobile === 'boolean') s.ua_mobile = raw.ua_mobile;
  return s;
}

/**
 * Check rate limit
 */
function checkRateLimit(ip) {
  const now = Date.now();
  if (!rateLimiter.has(ip)) {
    rateLimiter.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  const limiter = rateLimiter.get(ip);
  if (now > limiter.resetAt) {
    rateLimiter.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (limiter.count >= RATE_LIMIT_MAX) return false;
  limiter.count++;
  return true;
}

/**
 * Cleanup old rate limiter entries
 */
function cleanup() {
  const now = Date.now();
  for (const [k, v] of rateLimiter.entries()) {
    if (now > v.resetAt) rateLimiter.delete(k);
  }
}
setInterval(cleanup, 300000);

/**
 * Forward to webhook (fire-and-forget)
 */
async function forwardToWebhook(payload) {
  if (!METRICS_WEBHOOK_URL) return;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    await fetch(METRICS_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeout);
  } catch (e) {
    // Silent fail
  }
}

/**
 * Main handler
 */
export default async function handler(req, res) {
  // CORS
  res.setHeader('access-control-allow-origin', '*');
  res.setHeader('access-control-allow-methods', 'POST, OPTIONS');
  res.setHeader('access-control-allow-headers', 'content-type');

  // Preflight
  if (req.method === 'OPTIONS') return res.status(204).end();

  // Only POST (but still 204 for others)
  if (req.method !== 'POST') return res.status(204).end();

  try {
    // Get IP
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() ||
               req.headers['x-real-ip'] ||
               req.socket?.remoteAddress ||
               'unknown';

    const payload = req.body;

    // Validate event (only 400 case)
    if (!payload || !payload.event || !ALLOWED_EVENTS.has(payload.event)) {
      console.warn(`[Metrics] Invalid event: ${payload?.event}`);
      return res.status(400).json({ error: 'Invalid event' });
    }

    // Rate limit - drop silently
    if (!checkRateLimit(ip)) {
      console.warn(`[Metrics] Rate limit: ${ip} - dropped`);
      return res.status(204).end();
    }

    // Sanitize and enrich
    const sanitized = sanitizePayload(payload);
    const enriched = { ...sanitized, server_ts: Date.now() };

    // Log (Vercel captures)
    console.log('[Metrics]', JSON.stringify(enriched));

    // Webhook (non-blocking)
    if (METRICS_WEBHOOK_URL) forwardToWebhook(enriched).catch(() => {});

    // Fast 204
    return res.status(204).end();

  } catch (error) {
    console.error('[Metrics] Error:', error);
    return res.status(204).end(); // Never fail
  }
}
