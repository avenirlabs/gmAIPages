// api/admin/analytics/pages/top.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { A, parseRange, sendJSON, supaOr503 } from '../../../_services/analytics.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return sendJSON(res, 405, { ok: false, error: 'Method not allowed' });
  const supa = supaOr503(res); if (!supa) return;
  const { from, to, siteId } = parseRange(req);

  try {
    const q = supa.from(A.EVENTS)
      .select('page')
      .eq(A.KIND_COL, 'page_view')
      .not('page', 'is', null)
      .gte(A.TS_COL, from)
      .lte(A.TS_COL, to);
    if (siteId) q.eq(A.SITE_COL, siteId);
    const { data, error } = await q;
    if (error) throw error;

    const tally: Record<string, number> = {};
    for (const r of data) tally[(r as any).page] = (tally[(r as any).page] || 0) + 1;
    const rows = Object.entries(tally).sort((a,b)=>b[1]-a[1]).slice(0, 50).map(([page, count]) => ({ page, count }));
    return sendJSON(res, 200, { ok: true, rows });
  } catch (e:any) {
    console.error('[analytics:pages/top]', e?.message || e);
    return sendJSON(res, 500, { ok: false, rows: [] });
  }
}