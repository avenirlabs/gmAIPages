import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const { method, url } = req;

  // GET /api/ping
  if (method === 'GET' && url === '/api/ping') {
    return res.status(200).json({ pong: true });
  }

  // 404 for all other routes
  return res.status(404).json({ error: 'Not found' });
}