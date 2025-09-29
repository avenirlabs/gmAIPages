// api/admin/analytics/[report].ts
// Consolidated analytics handler - combines all analytics endpoints into one function
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { A, parseRange, sendJSON, supaOr503 } from '../../_services/analytics.js';

// Individual handler functions
async function kpisHandler(req: VercelRequest, res: VercelResponse) {
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

async function qualityHandler(req: VercelRequest, res: VercelResponse) {
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

async function geoHandler(req: VercelRequest, res: VercelResponse) {
  const supa = supaOr503(res); if (!supa) return;
  const { from, to, siteId } = parseRange(req);

  try {
    const q = supa.from(A.EVENTS)
      .select(`${A.COUNTRY_COL}, ${A.CITY_COL}`)
      .gte(A.TS_COL, from).lte(A.TS_COL, to);
    if (siteId) q.eq(A.SITE_COL, siteId);
    const { data, error } = await q;
    if (error) throw error;

    const map: Record<string, number> = {};
    for (const r of data) {
      const key = [r[A.COUNTRY_COL], r[A.CITY_COL]].filter(Boolean).join(', ');
      if (!key) continue;
      map[key] = (map[key] || 0) + 1;
    }
    const rows = Object.entries(map).map(([place, count]) => ({ place, count }));
    return sendJSON(res, 200, { ok: true, rows });
  } catch (e:any) {
    console.error('[analytics:geo]', e?.message || e);
    return sendJSON(res, 500, { ok: false, rows: [] });
  }
}

async function productsTopHandler(req: VercelRequest, res: VercelResponse) {
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

async function queriesTopHandler(req: VercelRequest, res: VercelResponse) {
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

async function sessionsDepthHandler(req: VercelRequest, res: VercelResponse) {
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

async function chipsHandler(req: VercelRequest, res: VercelResponse) {
  const supa = supaOr503(res); if (!supa) return;
  const { from, to, siteId } = parseRange(req);

  try {
    const q = supa.from(A.EVENTS)
      .select(A.CHIP_COL)
      .not(A.CHIP_COL, 'is', null)
      .gte(A.TS_COL, from)
      .lte(A.TS_COL, to);
    if (siteId) q.eq(A.SITE_COL, siteId);
    const { data, error } = await q;
    if (error) throw error;

    const tally: Record<string, number> = {};
    for (const r of data) tally[(r as any)[A.CHIP_COL]] = (tally[(r as any)[A.CHIP_COL]] || 0) + 1;
    const rows = Object.entries(tally).sort((a,b)=>b[1]-a[1]).map(([chip, count]) => ({ chip, count }));
    return sendJSON(res, 200, { ok: true, rows });
  } catch (e:any) {
    console.error('[analytics:chips]', e?.message || e);
    return sendJSON(res, 500, { ok: false, rows: [] });
  }
}

async function filtersHandler(req: VercelRequest, res: VercelResponse) {
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

async function pagesTopHandler(req: VercelRequest, res: VercelResponse) {
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

// Main handler with routing
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return sendJSON(res, 405, { ok: false, error: 'Method not allowed' });
  }

  const { report } = req.query;
  const reportType = Array.isArray(report) ? report[0] : report;

  // Handle complex routing based on URL path
  const url = req.url || '';

  if (url.includes('/analytics/kpis')) {
    return kpisHandler(req, res);
  }
  if (url.includes('/analytics/quality')) {
    return qualityHandler(req, res);
  }
  if (url.includes('/analytics/geo')) {
    return geoHandler(req, res);
  }
  if (url.includes('/analytics/products/top')) {
    return productsTopHandler(req, res);
  }
  if (url.includes('/analytics/queries/top')) {
    return queriesTopHandler(req, res);
  }
  if (url.includes('/analytics/sessions/depth')) {
    return sessionsDepthHandler(req, res);
  }
  if (url.includes('/analytics/pages/top')) {
    return pagesTopHandler(req, res);
  }
  if (url.includes('/analytics/chips')) {
    return chipsHandler(req, res);
  }
  if (url.includes('/analytics/filters')) {
    return filtersHandler(req, res);
  }

  return sendJSON(res, 404, { ok: false, error: `Unknown analytics endpoint: ${url}` });
}