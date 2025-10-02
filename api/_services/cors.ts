// Strict CORS helper for widget -> API calls.
// Echoes allowed origins, sets Vary: Origin, and handles OPTIONS preflight.

const ALLOWED = new Set<string>([
  'https://giftsmate.net',
  'https://www.giftsmate.net',
  'https://theyayacafe.com',
  'https://www.theyayacafe.com',
]);

type Req = {
  method: string;
  headers: Record<string, string> | { get?(k: string): string | null };
};

type Res = {
  setHeader(name: string, value: string): void;
  status(code: number): Res;
  end(body?: any): void;
};

// Normalize getting "origin" header from different runtimes
function getOrigin(req: Req): string | undefined {
  // Node/Express style
  const maybeNode = (req.headers as Record<string, string>)?.origin;
  if (maybeNode) return maybeNode;

  // Web/Next Edge style
  const getter = (req.headers as any)?.get;
  if (typeof getter === 'function') {
    return getter.call(req.headers, 'origin') ?? undefined;
  }
  return undefined;
}

export function applyCORS(req: Req, res: Res) {
  const origin = getOrigin(req);

  // Always vary on Origin to avoid cache poisoning
  res.setHeader('Vary', 'Origin');

  if (origin && ALLOWED.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    // Only enable credentials if you intentionally use cookies/auth
    // res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With'
  );
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
}

export function handlePreflight(req: Req, res: Res): boolean {
  if (req.method === 'OPTIONS') {
    applyCORS(req, res);
    res.status(204).end();
    return true;
  }
  return false;
}
