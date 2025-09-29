// api/admin/analytics/products/top.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

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

  // Return empty array - matches expected TopImpRow[] type
  return sendJSON(res, 200, []);
}