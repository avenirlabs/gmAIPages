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

Build & runtime
- Vite builds SPA to dist/spa with content-hashed assets.
- Server build (vite.config.server.ts) outputs dist/server/node-build.mjs for local/node usage; on Netlify the Express app is wrapped via serverless-http in netlify/functions/api.ts.

Key paths
- client/: React app (App.tsx, pages, components)
- server/: Express routes and services
- shared/: Types shared across client/server
- netlify/functions/api.ts: serverless entry
- netlify.toml: build, redirects, headers (CSP)
