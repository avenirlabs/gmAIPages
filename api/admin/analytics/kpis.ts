// api/admin/analytics/kpis.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { A, parseRange, sendJSON, supaOr503 } from '../../_services/analytics.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return sendJSON(res, 405, { ok: false, error: 'Method not allowed' });
  const supa = supaOr503(res); if (!supa) return;
  const { from, to, siteId } = parseRange(req);

  try {
    const b = supa
      .from(A.EVENTS)
      .select('id,' + A.QUALITY_COL)
      .gte(A.TS_COL, from)
      .lte(A.TS_COL, to);
    if (siteId) b.eq(A.SITE_COL, siteId);
    const { data, error } = await b;
    if (error) throw error;

    const totalEvents = data.length;
    const withQuality = data.filter(r => Number.isFinite(r[A.QUALITY_COL]));
    const avgQuality =
      withQuality.length ? (withQuality.reduce((s, r) => s + (r[A.QUALITY_COL] || 0), 0) / withQuality.length) : 0;

    return sendJSON(res, 200, {
      ok: true,
      rows: [{ metric: 'events', value: totalEvents }, { metric: 'avg_quality', value: Math.round(avgQuality * 100) / 100 }]
    });
  } catch (e:any) {
    console.error('[analytics:kpis]', e?.message || e);
    return sendJSON(res, 500, { ok: false, rows: [] });
  }
}