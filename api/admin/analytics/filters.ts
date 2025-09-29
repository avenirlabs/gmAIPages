// api/admin/analytics/filters.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { A, parseRange, sendJSON, supaOr503 } from '../../_services/analytics.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return sendJSON(res, 405, { ok: false, error: 'Method not allowed' });
  const supa = supaOr503(res); if (!supa) return;
  const { from, to, siteId } = parseRange(req);

  try {
    const q = supa.from(A.EVENTS)
      .select(`${A.FILTER_KEY_COL}, ${A.FILTER_VALUE_COL}`)
      .not(A.FILTER_KEY_COL, 'is', null)
      .not(A.FILTER_VALUE_COL, 'is', null)
      .gte(A.TS_COL, from)
      .lte(A.TS_COL, to);
    if (siteId) q.eq(A.SITE_COL, siteId);
    const { data, error } = await q;
    if (error) throw error;

    const map: Record<string, number> = {};
    for (const r of data) {
      const key = `${(r as any)[A.FILTER_KEY_COL]}:${(r as any)[A.FILTER_VALUE_COL]}`;
      map[key] = (map[key] || 0) + 1;
    }
    const rows = Object.entries(map).sort((a,b)=>b[1]-a[1]).map(([fv, count]) => {
      const [filter, value] = fv.split(':');
      return { filter, value, count };
    });
    return sendJSON(res, 200, { ok: true, rows });
  } catch (e:any) {
    console.error('[analytics:filters]', e?.message || e);
    return sendJSON(res, 500, { ok: false, rows: [] });
  }
}