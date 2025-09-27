export async function fetchStaticFirst<T>(
  staticUrl: string | null,
  apiUrl: string,
  signal?: AbortSignal
): Promise<T | null> {
  // 1) Try static JSON from CDN
  if (staticUrl) {
    try {
      const s = await fetch(staticUrl, { signal, cache: "force-cache" });
      if (s.ok) return (await s.json()) as T;
    } catch {}
  }
  // 2) Fallback to API
  try {
    const r = await fetch(apiUrl, { signal });
    if (r.ok) return (await r.json()) as T;
  } catch {}
  return null;
}