// api/admin/analytics/products/top.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { A, parseRange, sendJSON, supaOr503 } from '../../../_services/analytics.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return sendJSON(res, 405, { ok: false, error: 'Method not allowed' });
  const supa = supaOr503(res); if (!supa) return;
  const { from, to, siteId } = parseRange(req);

  try {
    const q = supa.from(A.EVENTS)
      .select(`${A.PRODUCT_ID_COL}`)
      .not(A.PRODUCT_ID_COL, 'is', null)
      .gte(A.TS_COL, from).lte(A.TS_COL, to);
    if (siteId) q.eq(A.SITE_COL, siteId);
    const { data, error } = await q;
    if (error) throw error;

    const tally: Record<string, number> = {};
    for (const r of data) tally[(r as any)[A.PRODUCT_ID_COL]] = (tally[(r as any)[A.PRODUCT_ID_COL]] || 0) + 1;

    // hydrate top N
    const ids = Object.entries(tally).sort((a,b)=>b[1]-a[1]).slice(0,20).map(([id])=>id);
    let meta: Record<string, { title: string; url: string }> = {};
    if (ids.length) {
      const { data: p } = await supa.from(A.PRODUCTS).select('id, title, url').in('id', ids);
      meta = Object.fromEntries((p || []).map(row => [String(row.id), { title: row.title, url: row.url }]));
    }
    const rows = ids.map(id => ({ id, count: tally[id], ...(meta[id] || {}) }));
    return sendJSON(res, 200, { ok: true, rows });
  } catch (e:any) {
    console.error('[analytics:products/top]', e?.message || e);
    return sendJSON(res, 500, { ok: false, rows: [] });
  }
}