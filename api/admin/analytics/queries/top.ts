// api/admin/analytics/queries/top.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { A, parseRange, sendJSON, supaOr503 } from '../../../_services/analytics.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return sendJSON(res, 405, { ok: false, error: 'Method not allowed' });
  const supa = supaOr503(res); if (!supa) return;
  const { from, to, siteId } = parseRange(req);

  try {
    const q = supa.from(A.EVENTS)
      .select(A.QUERY_COL)
      .not(A.QUERY_COL, 'is', null)
      .gte(A.TS_COL, from)
      .lte(A.TS_COL, to);
    if (siteId) q.eq(A.SITE_COL, siteId);
    const { data, error } = await q;
    if (error) throw error;

    const tally: Record<string, number> = {};
    for (const r of data) {
      const q = String((r as any)[A.QUERY_COL]).trim().toLowerCase();
      if (!q) continue;
      tally[q] = (tally[q] || 0) + 1;
    }
    const rows = Object.entries(tally).sort((a,b)=>b[1]-a[1]).slice(0, 50).map(([query, count]) => ({ query, count }));
    return sendJSON(res, 200, { ok: true, rows });
  } catch (e:any) {
    console.error('[analytics:queries/top]', e?.message || e);
    return sendJSON(res, 500, { ok: false, rows: [] });
  }
}