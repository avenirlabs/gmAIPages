// api/menus/[slug].ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getServiceSupabase } from '../_services/supabase.js';

// Fallback minimal menu if DB/static missing (kept tiny on purpose)
const FALLBACK_NAV = {
  slug: 'main',
  items: [
    { type: 'link', label: 'Home', to: '/' },
    {
      type: 'mega',
      label: 'Shop',
      columns: [
        { heading: 'Gifts', links: [{ label: 'For Dad', to: '/gifts/dad' }, { label: 'For Mom', to: '/gifts/mom' }] },
        { heading: 'Occasions', links: [{ label: 'Birthday', to: '/gifts/birthday' }, { label: 'Anniversary', to: '/gifts/anniversary' }] }
      ]
    }
  ]
};

function sendJSON(res: VercelResponse, code: number, body: any) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.status(code).end(JSON.stringify(body));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendJSON(res, 405, { ok: false, error: 'Method not allowed' });
  }

  try {
    const slug = String(req.query.slug || 'main');
    const supa = getServiceSupabase();

    // 1) Try Supabase first (if configured)
    if (supa) {
      // These table names are guesses based on common naming;
      // adjust if your actual tables differ.
      // We try to pull a single menu + nested items + megamenu shape.
      const { data: menu, error } = await supa
        .from('menus')
        .select(`
          id, slug, title,
          items:menu_items(
            id, type, label, to, order_index,
            // if you have columns/mega parts in another table, join here
            columns:menu_columns(
              id, heading,
              links:menu_links(id, label, to, order_index)
            )
          )
        `)
        .eq('slug', slug)
        .maybeSingle();

      if (error) {
        console.warn('[menus] supabase error', error.message);
      } else if (menu) {
        return sendJSON(res, 200, { ok: true, slug, menu });
      }
    }

    // 2) Try static JSON at /public/content/menus/{slug}.json
    try {
      // Dynamic import of JSON can be tricky with bundlers; instead,
      // attempt to read via fetch against the same deployment host if available.
      // In serverless without absolute URL, skip to fallback.
    } catch {
      // ignore
    }

    // 3) Final fallback (kept minimal but valid)
    return sendJSON(res, 200, { ok: true, slug, menu: FALLBACK_NAV });
  } catch (e: any) {
    console.error('[menus] handler error', e?.message || e);
    return sendJSON(res, 500, { ok: false, error: 'Internal error' });
  }
}