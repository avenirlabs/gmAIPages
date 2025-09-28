export async function fetchStaticFirst(staticUrl: string, apiUrl: string) {
  try {
    const r = await fetch(staticUrl, { cache: "force-cache" });
    if (r.ok) return await r.json();
  } catch {}
  const r2 = await fetch(apiUrl, { cache: "no-store" });
  if (!r2.ok) throw new Error(`HTTP ${r2.status}`);
  return await r2.json();
}

// Legacy typed version for backwards compatibility
export async function fetchStaticFirstTyped<T>(
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