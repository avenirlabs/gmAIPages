# Performance

- Vite builds with content-hashed assets; long-term caching at CDN.
- WooCommerce proxy: in-memory cache with TTL (10m) + ETag (304) to reduce load.
- Algolia: short client-side debounce recommended (TODO) and optional server-side micro-cache (15–30s) if needed.
- Compression: enabled via compression middleware when running Node; Netlify handles gzip/brotli at edge.
- Code splitting: consider dynamic imports for large routes/components.
- Images: lazy loading already used; add width/height where possible to improve LCP.
- Supabase: cache warm route /api/admin/cache/refresh.
- TanStack Query: tune staleTime for low-churn endpoints.
