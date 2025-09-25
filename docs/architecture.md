# Architecture

```mermaid
flowchart LR
  subgraph Client [Vite + React]
    UI[Pages & Components]
    Query[TanStack Query]
  end

  subgraph Serverless[Netlify Functions (Express)]
    API[/Express Router/]
    Gifts[POST /api/gifts/chat]
    Pages[GET /api/pages/*]
    Nav[GET /api/nav/links]
    Woo[GET /api/woocommerce/*]
  end

  subgraph External
    SUP[Supabase]
    ALG[Algolia]
    WOO[WooCommerce]
    OAI[OpenAI]
  end

  UI -->|fetch| API
  API --> SUP
  API --> ALG
  API --> WOO
  Gifts --> OAI
```

## Chat Flow with Pagination

The gift recommendation system now supports pagination for better performance and user experience:

1. **First Request**: User submits query → OpenAI parses intent → Algolia search (page 1) → Returns products + intentToken
2. **Load More**: User clicks "Load More" → Reuses intentToken (no OpenAI call) → Algolia search (page N) → Appends products
3. **Empty State**: Zero results → Shows smart suggestions and "Try broader search" options
4. **Intent Reuse**: intentToken valid for 1 hour, enables fast pagination without re-processing

**Performance Optimizations:**
- Intent tokens cache parsed OpenAI results for subsequent pages
- Stable ordering via Algolia's built-in ranking + tie-breaking
- Configurable page size (CHAT_PAGE_SIZE, default: 12)
- Comprehensive telemetry for pagination analytics

## Build & Runtime
- Vite builds SPA to dist/spa with content-hashed assets.
- Server build (vite.config.server.ts) outputs dist/server/node-build.mjs for local/node usage; on Netlify the Express app is wrapped via serverless-http in netlify/functions/api.ts.

## Key Paths
- client/: React app (App.tsx, pages, components)
- client/hooks/usePagedChatResults.ts: Pagination state management
- client/components/gifts/EmptyState.tsx: Zero-hit UI with suggestions
- server/: Express routes and services
- server/services/algolia.ts: Paginated search with searchProductsPaginated()
- server/services/openai.ts: Intent token system for pagination optimization
- shared/: Types shared across client/server (PageInfo, ChatRequestBody, ChatResponseBody)
- netlify/functions/api.ts: serverless entry
- netlify.toml: build, redirects, headers (CSP)
