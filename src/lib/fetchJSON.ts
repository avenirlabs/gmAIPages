export type FetchOpts = {
  method?: 'GET'|'POST'|'PUT'|'PATCH'|'DELETE'
  headers?: Record<string, string>
  body?: any
  timeoutMs?: number
}

export async function fetchJSON<T=unknown>(url: string, opts: FetchOpts = {}): Promise<T> {
  const controller = new AbortController()
  const id = opts.timeoutMs ? setTimeout(() => controller.abort(), opts.timeoutMs) : null

  try {
    const res = await fetch(url, {
      method: opts.method || (opts.body ? 'POST' : 'GET'),
      headers: {
        'content-type': 'application/json',
        ...(opts.headers || {})
      },
      body: opts.body != null ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal
    })

    if (!res.ok) {
      const text = await res.text().catch(()=>'')
      throw new Error(`HTTP ${res.status} ${res.statusText} – ${text.slice(0,200)}`)
    }
    // handle empty
    const ct = res.headers.get('content-type') || ''
    if (!ct.includes('application/json')) {
      const text = await res.text().catch(()=>'')
      return text as unknown as T
    }
    return await res.json() as T
  } finally {
    if (id) clearTimeout(id)
  }
}
