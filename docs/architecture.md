# Architecture

```mermaid
flowchart LR
  subgraph Client [Vite + React]
    UI[Pages & Components]
    Query[TanStack Query]
    Filters[Filter State Management]
    FacetUI[Faceted Search UI]
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
  Filters <-->|facet state| FacetUI
  FacetUI -->|filters| Gifts
  ALG -->|facet counts| Gifts
```

## Faceted Search & Ranking Pipeline

The gift recommendation system combines AI intent parsing with faceted search for precise, interactive discovery:

### 1. **Intent Processing & Filter Translation**
- User submits query → OpenAI parses intent → Extracts structured filters
- Maps human language to canonical facets (relationships, occasions, categories, price buckets)
- Creates intentToken for performance optimization on subsequent pages

### 2. **Search Execution**
- **Strict Mode**: Uses Algolia `facetFilters` for precise matching (AND across groups, OR within)
- **Soft Mode**: Uses `optionalFilters` with weighted scoring (relationship=3, occasion=2, price_bucket=1)
- **Zero-Hit Fallback**: Automatically retries with soft mode when strict filters return no results

### 3. **Interactive Faceting**
- Returns live facet counts for all available filter values
- Client shows interactive chips with counts (e.g., "Dad (132)")
- Disables unavailable options, maintains filter state across pagination
- Active filters bar with individual removal and "Clear all" functionality

### 4. **Result Enhancement**
- Weighted scoring combines Algolia relevance with gift-specific signals
- Pagination maintains filter context and stable ordering
- Broadening banner informs users when results were softened with revert option

**Performance Optimizations:**
- Intent tokens cache parsed OpenAI results for subsequent pages
- Filter state managed client-side to avoid re-processing
- Facet counts computed server-side with efficient Algolia queries
- Comprehensive telemetry for search analytics and filter usage

## Build & Runtime
- Vite builds SPA to dist/spa with content-hashed assets.
- Server build (vite.config.server.ts) outputs dist/server/node-build.mjs for local/node usage; on Netlify the Express app is wrapped via serverless-http in netlify/functions/api.ts.

## Key Paths
- **client/**: React app (App.tsx, pages, components)
- **client/hooks/usePagedChatResults.ts**: Pagination state management
- **client/hooks/useGiftFilters.ts**: Filter state management with toggle/clear functionality
- **client/utils/chipMapping.ts**: Chip-to-filter mapping and normalization utilities
- **client/components/gifts/ChatInterface.tsx**: Main chat UI with filter integration
- **client/components/gifts/FacetChips.tsx**: Interactive chips with live counts and disabled states
- **client/components/gifts/BroadeningBanner.tsx**: Zero-hit fallback notification with revert option
- **client/components/gifts/EmptyState.tsx**: Zero-hit UI with suggestions
- **server/**: Express routes and services
- **server/services/algolia.ts**: Faceted search with `buildAlgoliaParams()` and `searchProductsPaginated()`
- **server/services/openai.ts**: Intent token system with filter extraction
- **server/services/telemetry.ts**: Analytics with filter usage and broadening tracking
- **shared/**: Types shared across client/server (GiftFilters, FacetCounts, PageInfo, ChatRequestBody, ChatResponseBody)
- **docs/search.md**: Comprehensive faceting guide with Algolia configuration
- **netlify/functions/api.ts**: serverless entry
- **netlify.toml**: build, redirects, headers (CSP)

## UI Layout Conventions

### Responsive Container Pattern

The application uses a responsive container pattern for optimal readability and visual hierarchy:

#### Chat Interface Layout
- **Full-width sections**: Chat interface spans the entire page width for immersive experience
- **Readable message column**: Text content constrained to `max-w-[78ch]` (approximately 78 characters) for optimal reading
- **Wide product grids**: Product results utilize full available width with responsive breakpoints:
  - Mobile: 2 columns (`grid-cols-2`)
  - Small: 3 columns (`sm:grid-cols-3`)
  - Medium: 4 columns (`md:grid-cols-4`)
  - Large: 5 columns (`lg:grid-cols-5`)
  - Extra Large: 6 columns (`xl:grid-cols-6`)

#### Container Guidelines
- **Text content**: Use `max-w-[78ch]` for optimal readability (45-75 characters per line)
- **Interactive elements**: Constrain to `max-w-4xl` for comfortable interaction zones
- **Media content**: Allow full-width expansion with appropriate padding (`px-4` minimum)
- **Navigation**: Full-width with centered content containers

This pattern ensures content remains readable while maximizing screen real estate for visual elements like product grids and media.
