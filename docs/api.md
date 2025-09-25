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

**Request Body:**
```typescript
{
  message: string;                    // User's search query
  selectedRefinements?: string[];     // Legacy chip selection (deprecated)
  history?: ChatTurn[];              // Conversation context
  cursor?: string;                   // Pagination cursor
  page?: number;                     // Page number (alternative to cursor)
  perPage?: number;                  // Results per page
  intentToken?: string;              // Cached intent for performance
  filters?: GiftFilters;             // Structured facet filters (NEW)
}
```

**Response:**
```typescript
{
  reply: string;                     // AI assistant response
  products: ProductItem[];           // Search results
  refineChips: string[];            // Suggested refinement chips
  pageInfo: PageInfo;               // Pagination metadata
  facets?: FacetCounts;             // Live facet counts (NEW)
  appliedFilters?: GiftFilters;     // Echo of applied filters (NEW)
  meta?: {
    queryLatencyMs: number;         // Search latency
    source: 'algolia';
    intentToken?: string;           // Token for subsequent pages
    broadened?: boolean;            // True if results were broadened (NEW)
  };
}
```

- Fallback endpoints also accepted: /.netlify/functions/api/gifts/chat or /gifts/chat

**Pagination Support:**
- `cursor`: Opaque pagination cursor (format: "page:N")
- `page`: 1-based page number (alternative to cursor)
- `perPage`: Results per page (default: 12, configurable via CHAT_PAGE_SIZE)
- `intentToken`: Reuse parsed intent for subsequent pages (performance optimization)

**Filter Types (New):**
```typescript
interface GiftFilters {
  relationships?: string[];   // ["dad", "mom", "sister", ...]
  occasions?: string[];       // ["birthday", "anniversary", ...]
  categories?: string[];      // ["tech", "cooking", "gym", ...]
  priceBuckets?: string[];    // ["under-499", "500-999", ...]
  priceRange?: {              // Alternative to price buckets
    min?: number;
    max?: number;
  };
  soft?: boolean;             // Use soft filtering (boost vs strict)
}

interface FacetCounts {
  relationship?: Record<string, number>;  // "dad": 123
  occasion?: Record<string, number>;      // "birthday": 456
  price_bucket?: Record<string, number>;  // "under-499": 789
  categories?: Record<string, number>;    // "tech": 321
}
```

**Pagination Structure:**
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

With facet filters (strict):
```bash
curl -sS -X POST \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "birthday gifts",
    "filters": {
      "relationships": ["sister"],
      "occasions": ["birthday"],
      "priceBuckets": ["under-499", "500-999"],
      "soft": false
    }
  }' \
  https://<your-site>/api/gifts/chat
```

With soft filters (broadening):
```bash
curl -sS -X POST \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "tech gifts",
    "filters": {
      "categories": ["tech", "gadget"],
      "soft": true
    }
  }' \
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
