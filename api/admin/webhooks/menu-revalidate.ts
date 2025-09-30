// api/admin/webhooks/menu-revalidate.ts
// Webhook endpoint for cache invalidation when navigation_items change
// Called by Supabase database webhooks on INSERT/UPDATE/DELETE
import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Webhook handler for menu cache revalidation
 *
 * Security: Requires X-Webhook-Secret header matching MENU_WEBHOOK_SECRET env var
 *
 * To configure in Supabase:
 * 1. Go to Database → Webhooks
 * 2. Create webhook on navigation_items table
 * 3. Events: INSERT, UPDATE, DELETE
 * 4. HTTP Request:
 *    - Method: POST
 *    - URL: https://your-domain.vercel.app/api/admin/webhooks/menu-revalidate
 *    - Headers: X-Webhook-Secret: <your-secret-value>
 * 5. Set MENU_WEBHOOK_SECRET in Vercel environment variables
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify webhook secret
    const webhookSecret = process.env.MENU_WEBHOOK_SECRET;
    const providedSecret = req.headers['x-webhook-secret'];

    if (!webhookSecret) {
      console.error('[menu-revalidate] MENU_WEBHOOK_SECRET not configured');
      return res.status(503).json({
        ok: false,
        error: 'Webhook not configured',
      });
    }

    if (providedSecret !== webhookSecret) {
      console.warn('[menu-revalidate] Invalid webhook secret');
      return res.status(401).json({
        ok: false,
        error: 'Unauthorized',
      });
    }

    // Import and call the cache clearing function
    // Dynamic import to avoid circular dependencies
    const menuModule = await import('../../menu.js');

    if (typeof menuModule.clearMenuCache === 'function') {
      menuModule.clearMenuCache();
      console.log('[menu-revalidate] Cache cleared successfully');
    } else {
      console.warn('[menu-revalidate] clearMenuCache function not found');
    }

    // Log webhook payload for debugging (optional)
    const payload = req.body;
    if (payload) {
      console.log('[menu-revalidate] Webhook triggered:', {
        type: payload.type,
        table: payload.table,
        record_id: payload.record?.id,
      });
    }

    return res.status(200).json({
      ok: true,
      message: 'Cache invalidated',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[menu-revalidate] Handler error:', error);
    return res.status(500).json({
      ok: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
}