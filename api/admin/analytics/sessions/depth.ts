// api/admin/analytics/sessions/depth.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { A, parseRange, sendJSON, supaOr503 } from '../../../_services/analytics.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return sendJSON(res, 405, { ok: false, error: 'Method not allowed' });
  const supa = supaOr503(res); if (!supa) return;
  const { from, to, siteId } = parseRange(req);

  try {
    const q = supa.from(A.EVENTS)
      .select(`${A.SITE_COL}, session_id, ${A.DEPTH_COL}`)
      .not('session_id', 'is', null)
      .gte(A.TS_COL, from).lte(A.TS_COL, to);
    if (siteId) q.eq(A.SITE_COL, siteId);
    const { data, error } = await q;
    if (error) throw error;

    // group by session and take max depth per session
    const depthBySession: Record<string, number> = {};
    for (const r of data) {
      const sid = (r as any).session_id;
      const d = Number((r as any)[A.DEPTH_COL] || 0);
      depthBySession[sid] = Math.max(depthBySession[sid] || 0, d);
    }
    const buckets: Record<string, number> = {};
    for (const d of Object.values(depthBySession)) {
      const key = String(Math.min(10, Math.max(0, Math.round(d))));
      buckets[key] = (buckets[key] || 0) + 1;
    }
    const rows = Object.entries(buckets).map(([depth, count]) => ({ depth: Number(depth), count }));
    return sendJSON(res, 200, { ok: true, rows });
  } catch (e:any) {
    console.error('[analytics:sessions/depth]', e?.message || e);
    return sendJSON(res, 500, { ok: false, rows: [] });
  }
}