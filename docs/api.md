# API Reference
Base URL (Netlify): /

Auth: none (rate-limited). CORS allowlist via ALLOWED_ORIGINS.

## Health
GET /api/ping
- 200 { "message": "ping" }

## Demo
GET /api/demo
- 200 demo payload (example route)

## Pages
GET /api/pages/home
- 200 JSON: { title, page_description, long_description, chips, content }

GET /api/pages/:slug
- 200 JSON page or null

POST /api/admin/cache/refresh
- 200 { ok, warmed }

## Navigation
GET /api/nav/links
- 200 { links: [{ label, href, position }] }

## Chat (AI Gifts)
POST /api/gifts/chat
- Body: { message: string, selectedRefinements?: string[], history?: ChatTurn[], cursor?: string, page?: number, perPage?: number, intentToken?: string }
- 200 { reply, products: ProductItem[], refineChips: string[], pageInfo: PageInfo, meta?: { queryLatencyMs: number, source: 'algolia', intentToken?: string } }
- Fallback endpoints also accepted: /.netlify/functions/api/gifts/chat or /gifts/chat

**Pagination Support:**
- `cursor`: Opaque pagination cursor (format: "page:N")
- `page`: 1-based page number (alternative to cursor)
- `perPage`: Results per page (default: 12, configurable via CHAT_PAGE_SIZE)
- `intentToken`: Reuse parsed intent for subsequent pages (performance optimization)

**Response Structure:**
```typescript
interface PageInfo {
  total: number;           // Total number of results available
  pageSize: number;        // Number of results per page
  nextCursor?: string;     // Present if more results available
  prevCursor?: string;     // Present if previous page exists
  page?: number;           // Current page number
  totalPages?: number;     // Total pages available
}
```

**Examples:**

First page:
```bash
curl -sS -X POST \
  -H 'Content-Type: application/json' \
  -d '{"message":"gifts for sister who loves cooking under $50"}' \
  https://<your-site>/api/gifts/chat
```

Load more (using cursor):
```bash
curl -sS -X POST \
  -H 'Content-Type: application/json' \
  -d '{"message":"gifts for sister who loves cooking under $50","cursor":"page:2","intentToken":"eyJ..."}' \
  https://<your-site>/api/gifts/chat
```

## WooCommerce Products
GET /api/woocommerce/products?source=featured&per_page=20
- Query:
  - source: featured | best_sellers | category
  - per_page: 1..50
  - category_slug: when source=category
- 200 { products: [{ id, name, link, image, price, regular_price, sale_price }] }
- 304 with ETag/If-None-Match

GET /api/woocommerce/featured
- Alias for source=featured
