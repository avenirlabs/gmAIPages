// api/_services/analytics.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getServiceSupabase } from './supabase.js';

export const A = {
  EVENTS: process.env.ANALYTICS_EVENTS_TBL || 'analytics_events',
  PRODUCTS: process.env.PRODUCTS_TBL || 'products',
  SITE_COL: process.env.SITE_ID_COL || 'site_id',
  TS_COL: process.env.TS_COL || 'ts',
  KIND_COL: process.env.KIND_COL || 'kind',
  QUERY_COL: process.env.QUERY_COL || 'query',
  PRODUCT_ID_COL: process.env.PRODUCT_ID_COL || 'product_id',
  COUNTRY_COL: process.env.COUNTRY_COL || 'country',
  CITY_COL: process.env.CITY_COL || 'city',
  CHIP_COL: process.env.CHIP_COL || 'chip',
  FILTER_KEY_COL: process.env.FILTER_KEY_COL || 'filter_key',
  FILTER_VALUE_COL: process.env.FILTER_VALUE_COL || 'filter_value',
  DEPTH_COL: process.env.DEPTH_COL || 'depth',
  QUALITY_COL: process.env.QUALITY_COL || 'quality',
};

export type DateRange = { from: string; to: string; siteId?: string | null };

export function sendJSON(res: VercelResponse, code: number, body: any) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.status(code).end(JSON.stringify(body));
}

// Accepts ?from=2025-09-01&to=2025-09-29&siteId=gm
export function parseRange(req: VercelRequest): DateRange {
  const to = (req.query.to as string) || new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const from =
    (req.query.from as string) ||
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const siteId = (req.query.siteId as string) || null;
  return { from, to, siteId };
}

export function supaOr503(res: VercelResponse) {
  const supa = getServiceSupabase();
  if (!supa) {
    sendJSON(res, 503, { ok: false, error: 'Supabase not configured' });
    return null;
  }
  return supa;
}