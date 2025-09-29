// api/admin/analytics/quality.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { A, parseRange, sendJSON, supaOr503 } from '../../_services/analytics.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return sendJSON(res, 405, { ok: false, error: 'Method not allowed' });
  const supa = supaOr503(res); if (!supa) return;
  const { from, to, siteId } = parseRange(req);

  try {
    const q = supa.from(A.EVENTS)
      .select(A.QUALITY_COL)
      .not(A.QUALITY_COL, 'is', null)
      .gte(A.TS_COL, from)
      .lte(A.TS_COL, to);
    if (siteId) q.eq(A.SITE_COL, siteId);
    const { data, error } = await q;
    if (error) throw error;

    const buckets: Record<string, number> = {};
    for (const r of data) {
      const v = Math.max(0, Math.min(5, Math.round((r as any)[A.QUALITY_COL])));
      buckets[v] = (buckets[v] || 0) + 1;
    }
    const rows = Object.entries(buckets).map(([score, count]) => ({ score: Number(score), count }));
    return sendJSON(res, 200, { ok: true, rows });
  } catch (e:any) {
    console.error('[analytics:quality]', e?.message || e);
    return sendJSON(res, 500, { ok: false, rows: [] });
  }
}