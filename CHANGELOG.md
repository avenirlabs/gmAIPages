# Changelog

All notable changes to the Gifts Guru AI search system will be documented in this file.

## [v1.7.0] - 2025-10-22 - WordPress Plugin API Endpoints

### ✨ New Features: Snapshots & Metrics Endpoints

**Version**: 20251022113500

#### Endpoints Added

**1. Snapshots Endpoint** - Server-Rendered Product Cards
- **Route**: `GET /api/snapshots/:key.json`
- **Purpose**: Provides curated product snapshots for WordPress plugin SSR
- **Features**:
  - Dual mode: Algolia (live) + Static presets (demo/fallback)
  - 3 demo snapshots: dad-birthday, mom-anniversary, tech-lover
  - Price in PAISE format (₹1,499 = 149900)
  - Never 404 - returns empty array for unknown keys
  - CDN-friendly cache headers (1hr fresh, 24hr stale-while-revalidate)
  - CORS wildcard for cross-origin access

**2. Metrics Endpoint** - Widget Analytics Intake
- **Route**: `POST /api/metrics/gm-widget`
- **Purpose**: Fire-and-forget analytics collection for widget events
- **Features**:
  - Event whitelist: snapshot_view, chip_click, chat_open, auto_open, widget_loaded, widget_error
  - Always returns 204 No Content (never blocks UX)
  - In-memory rate limiting: 100 events/60s per IP
  - Field sanitization and validation
  - Optional webhook forwarding via `METRICS_WEBHOOK_URL`
  - Zero dependencies

#### Implementation Details
- **Architecture**: Integrated into main API handler (`api/index.js`)
- **Routing**: Dynamic route extraction for `/snapshots/:key.json`
- **WordPress Compatible**: Matches all plugin expectations exactly

#### Files Changed
- `api/snapshots/[key].js`: Snapshots endpoint (465 lines)
- `api/metrics/gm-widget.js`: Metrics endpoint (152 lines)
- `api/index.js`: Added route handlers and dynamic routing
- `SNAPSHOTS-ENDPOINT-GUIDE.md`: Complete snapshots documentation
- `METRICS-ENDPOINT-GUIDE.md`: Complete metrics documentation
- `DEPLOYMENT-SUCCESS.md`: Deployment verification report

#### Test Results
- ✅ Snapshots: Returns 8 products for dad-birthday
- ✅ Snapshots: Returns 8 products for mom-anniversary
- ✅ Snapshots: Returns empty array for unknown keys
- ✅ Metrics: Returns 204 for valid events
- ✅ Metrics: Returns 400 for invalid events
- ✅ CORS: Preflight working correctly

#### Environment Variables
- `ALGOLIA_APP_ID`: For live product data (optional)
- `ALGOLIA_API_KEY`: For live product data (optional)
- `ALGOLIA_INDEX_PREFIX`: Index name prefix (default: "giftsmate")
- `METRICS_WEBHOOK_URL`: Forward events to external service (optional)

#### WordPress Plugin Integration
```php
// Snapshots - Server-rendered cards
$snapshot_url = "https://gm-ai-pages.vercel.app/api/snapshots/dad-birthday.json";

// Metrics - Analytics beacons
navigator.sendBeacon(
  'https://gm-ai-pages.vercel.app/api/metrics/gm-widget',
  JSON.stringify({ event: 'snapshot_view', page_path: '/gifts-for-dad' })
);
```

#### Deployment
- **Branch**: `main`
- **Commits**: `3d2d9d4`, `68be3ee`, `2d5320e`
- **Status**: ✅ Deployed and verified
- **Production URL**: `https://gm-ai-pages.vercel.app`

---

## [v1.6.1] - 2025-10-14 - Starter Prompts Fix & Performance Optimization

### 🐛 Bug Fix: Custom Starter Prompts
**Version**: 20251014162154

#### Issue Fixed
- **Problem**: Widget was showing taxonomy refinement chips ("Personalized Gifts", "Under 999") instead of custom starter prompts configured via `starter-prompts` attribute
- **Root Cause**: Refinement chips were overriding starter prompts in empty state
- **Impact**: Users couldn't customize initial suggestions on homepage/landing pages

#### Solution
- Modified `ChatInterface.tsx` to prioritize custom starter prompts in empty state
- If `starter-prompts` provided → Show custom prompts ✅
- If no `starter-prompts` → Fall back to refinement chips
- After first search → Show context-aware refinement chips

#### Files Changed
- `client/components/gifts/ChatInterface.tsx`: Added starter prompts priority logic (lines 572-624)

#### WordPress Integration
```html
<giftsmate-chat
  api-base="https://gm-ai-pages.vercel.app"
  starter-prompts="Gifts for sister|Diwali gifts|Birthday return gifts">
</giftsmate-chat>
```

### ⚡ Performance: ESM Build Optimization
**Version**: 20251014153557

#### Optimizations Applied
- Switched from esbuild to terser with 2-pass aggressive minification
- Enabled unsafe optimizations for maximum compression
- Implemented lazy QueryClient instantiation
- Added Suspense wrapper with loading fallback
- Improved code splitting: ui-vendor, react-vendor, query-vendor
- Enabled explicit tree-shaking in esbuild config

#### Build Results
- `chat-app.js`: 117 KB → 24.17 KB gzipped (application logic)
- `react-vendor.js`: 221 KB → 54.12 KB gzipped (React + ReactDOM)
- `query-vendor.js`: 61 KB → 12.53 KB gzipped (TanStack Query)
- `ui-vendor.js`: 4 KB → 1.33 KB gzipped (Radix UI)
- **Total ESM**: 403 KB → 92.15 KB gzipped (4 chunks)

#### Performance Gains
- First load (WiFi): **36% faster** than IIFE (540ms vs 850ms)
- App updates: **72% faster** (240ms vs 850ms, React cached)
- Granular caching: Only 24 KB downloaded on app updates
- HTTP/2 parallel downloads: ~20% faster on 3G

#### Files Modified
- `vite.chat-esm.config.ts`: Aggressive terser config, improved chunking
- `src/chat/entry.tsx`: Lazy QueryClient, Suspense wrapper

#### Documentation
- `OPTIMIZATION-RESULTS.md`: Detailed performance analysis
- `PERFORMANCE-ANALYSIS.md`: Strategy and future improvements
- `WORDPRESS-DEPLOYMENT.md`: Complete WordPress integration guide

---

## [v1.6.0] - 2024-12-XX - Navigation, Full-Width Chat & Image Aspects

### Epic: Navigation nesting + full-width chat + square/portrait product images

#### 🧭 **Feature 1: Hierarchical Navigation System**
- **Nested navigation structure**: Parent-child relationships managed in Supabase
- **Desktop dropdowns**: Hover/click interactions with proper keyboard navigation
- **Mobile accordions**: Touch-friendly expand/collapse navigation
- **Backward compatibility**: Maintains support for existing flat navigation
- **Full accessibility**: ARIA attributes, focus management, screen reader support
- **Database schema**: Extended `nav_links` table with hierarchical fields

#### 📱 **Feature 2: Full-Width Chat Interface**
- **Immersive experience**: Edge-to-edge chat interface for maximum screen usage
- **Responsive containers**: Readable message column (78ch) with full-width product grids
- **Adaptive product layout**: 2-6 columns responsive grid based on screen size
- **Optimal readability**: Text content remains comfortable while maximizing visual space
- **Performance optimized**: CSS-only layout with no JavaScript calculations

#### 🖼️ **Feature 3: Configurable Product Image Aspects**
- **Square/Portrait modes**: Toggle between 1:1 and 4:5 aspect ratios
- **Environment configuration**: `VITE_CARD_IMAGE_ASPECT` for easy switching
- **Container cropping**: CSS `object-cover` with center-focused product display
- **Zero layout shift**: Consistent card heights prevent CLS issues
- **Universal application**: Affects both chat results and featured product grids

### Technical Implementation

#### Navigation System (`v1.6.0`)
- `server/routes/nav.ts`: Tree-building logic with parent-child relationships
- `client/components/layout/NavMenu.tsx`: New component with dropdowns/accordions
- `client/components/layout/SiteHeader.tsx`: Integration with backward compatibility
- `docs/navigation.md`: Complete setup and management documentation

#### Full-Width Chat (`v1.6.0`)
- `client/pages/Index.tsx`: Removed container constraints for full-width
- `client/components/gifts/ChatInterface.tsx`: Responsive container patterns
- `client/components/gifts/ChatMessage.tsx`: Separated message and product layouts
- `docs/architecture.md`: Updated with UI layout conventions

#### Image Aspect System (`v1.6.0`)
- `tailwind.config.ts`: Added `@tailwindcss/aspect-ratio` plugin
- `client/config/ui.ts`: Configuration system with aspect ratio utilities
- `client/components/gifts/ProductCard.tsx`: Configurable aspect container
- `client/components/woocommerce/FeaturedGrid.tsx`: Consistent aspect ratios
- `docs/ui.md`: Comprehensive UI configuration guide

### Performance & Accessibility Enhancements

#### Navigation Performance
- **Tree caching**: Server-side navigation tree building with 5-minute TTL
- **Keyboard navigation**: Arrow keys, Tab, Escape for dropdown interaction
- **Focus management**: Proper focus trapping and restoration in dropdowns

#### Layout Performance
- **CSS-only solutions**: No JavaScript layout calculations or runtime overhead
- **Container queries**: Responsive breakpoints without JavaScript media queries
- **Image optimization**: `object-cover` with center cropping for consistent display

#### Accessibility Improvements
- **ARIA compliance**: `aria-expanded`, `aria-haspopup`, `role="menu"` attributes
- **Screen readers**: Live announcements for navigation state changes
- **Keyboard support**: Full keyboard navigation for all interactive elements
- **Focus indicators**: Visible focus states for all navigation elements

### Database Schema Updates

#### Navigation Table Extensions
```sql
-- New hierarchical navigation fields
ALTER TABLE nav_links ADD COLUMN parent_id UUID REFERENCES nav_links(id) ON DELETE SET NULL;
ALTER TABLE nav_links ADD COLUMN sort_order INTEGER DEFAULT 0;
ALTER TABLE nav_links ADD COLUMN is_visible BOOLEAN DEFAULT true;
ALTER TABLE nav_links ADD COLUMN is_mega BOOLEAN DEFAULT false;

-- Performance indexes
CREATE INDEX idx_nav_links_parent_id ON nav_links(parent_id);
CREATE INDEX idx_nav_links_sort_order ON nav_links(sort_order);
```

### API Enhancements

#### Navigation API Response Format
```typescript
interface NavResponse {
  items: NavLink[];        // New nested format
  links: LegacyNavLink[];  // Backward compatibility
}

interface NavLink {
  id: string;
  label: string;
  href?: string;
  children?: NavLink[];
  isMega?: boolean;
}
```

### Configuration Options

#### Image Aspect Ratio Configuration
```bash
# Environment variable options
VITE_CARD_IMAGE_ASPECT=square     # Default: 1:1 aspect ratio
VITE_CARD_IMAGE_ASPECT=portrait45 # 4:5 aspect ratio for marketplace style
```

#### Supported Aspect Ratios
- **Square (`aspect-square`)**: 1:1 ratio for balanced product display
- **Portrait (`aspect-[4/5]`)**: 4:5 ratio following e-commerce conventions

### Migration Guide

#### Navigation Migration
1. Run database migration to add hierarchical fields
2. Update navigation data in Supabase admin panel
3. Test dropdown functionality on desktop and mobile
4. Verify accessibility with screen readers

#### Image Aspect Migration
1. Set `VITE_CARD_IMAGE_ASPECT` environment variable
2. Test product display across different screen sizes
3. Verify no layout shift issues during image loading
4. Review product image quality with new aspect ratios

### Breaking Changes
- None - all features maintain backward compatibility

### Deprecations
- `selectedRefinements` parameter (legacy chip selection) - use `filters` instead

---

## [v1.5.0] - 2024-12-XX - Faceted Search & Filter System

### Major Features Added

#### 🔍 **Intelligent Faceted Search with Algolia**
- **Dual-mode filtering**: Strict mode (precise facetFilters) and soft mode (weighted optionalFilters)
- **Smart fallback system**: Automatic retry with soft filters on zero hits
- **Weighted scoring**: Relationship=3, Occasion=2, Price Bucket=1 for relevance optimization
- **Live facet counts**: Real-time availability indicators for all filter options

#### 🎛️ **Interactive Filter Management**
- **Refine chips integration**: Direct mapping from AI suggestions to structured filters
- **Active filters bar**: Visual pills with individual removal and "Clear all" functionality
- **Toggle-based interaction**: Click chips to add/remove filters instead of text input
- **State persistence**: Maintains filter context across pagination and queries

#### 🚀 **Zero-Hit Prevention System**
- **Broadening banner**: Informs users when results were expanded with revert option
- **Automatic soft retry**: Seamlessly falls back to broader search on zero results
- **Query preservation**: Maintains original intent while expanding result scope
- **User control**: Option to revert to strict search at any time

#### 📊 **Enhanced User Experience**
- **Dynamic chip states**: Active, inactive, and disabled states with proper visual feedback
- **Accessibility improvements**: ARIA labels, live announcements, screen reader support
- **Performance optimization**: Intent token caching for faster pagination
- **Comprehensive telemetry**: Filter usage analytics and broadening event tracking

### Technical Implementation

#### Backend Changes
- `server/services/algolia.ts`: New `buildAlgoliaParams()` function for filter translation
- `server/routes/gifts.ts`: Zero-hit fallback logic and broadening state management
- `shared/api.ts`: Extended with `GiftFilters` and `FacetCounts` type definitions

#### Frontend Changes
- `client/hooks/useGiftFilters.ts`: New hook for filter state management
- `client/utils/chipMapping.ts`: Comprehensive chip-to-filter mapping system
- `client/components/gifts/FacetChips.tsx`: New component with live counts and states
- `client/components/gifts/BroadeningBanner.tsx`: Zero-hit fallback notification
- `client/components/gifts/ChatInterface.tsx`: Major refactor for filter integration

#### Type Safety & Contracts
```typescript
interface GiftFilters {
  relationships?: string[];    // ["dad", "mom", "sister", ...]
  occasions?: string[];        // ["birthday", "anniversary", ...]
  categories?: string[];       // ["tech", "cooking", "gym", ...]
  priceBuckets?: string[];     // ["under-499", "500-999", ...]
  priceRange?: { min?: number; max?: number };
  soft?: boolean;             // Enable soft filtering mode
}

interface FacetCounts {
  relationship?: Record<string, number>;   // "dad": 123
  occasion?: Record<string, number>;       // "birthday": 456
  price_bucket?: Record<string, number>;   // "under-499": 789
  categories?: Record<string, number>;     // "tech": 321
}
```

### API Enhancements

#### New Request Fields
- `filters`: Structured facet filters (replaces selectedRefinements)
- `filters.soft`: Boolean flag for soft vs strict filtering

#### New Response Fields
- `facets`: Live facet counts for all available values
- `appliedFilters`: Echo of applied filter state
- `meta.broadened`: Flag indicating if results were expanded

#### Example Usage
```bash
# Strict faceted search
curl -X POST /api/gifts/chat \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "birthday gifts",
    "filters": {
      "relationships": ["sister"],
      "occasions": ["birthday"],
      "priceBuckets": ["under-499"],
      "soft": false
    }
  }'
```

### Performance Optimizations
- **Intent token system**: Cache parsed OpenAI results for pagination (~200ms saved per page)
- **Client-side filter state**: Avoid server re-processing on filter toggles
- **Efficient facet queries**: Single Algolia request with facet count aggregation
- **Opaque pagination cursors**: Maintain stable ordering across filter changes

### Backward Compatibility
- Maintains support for legacy `selectedRefinements` parameter
- Graceful fallback for clients not using new filter system
- Progressive enhancement approach - works with and without JavaScript

### Documentation Updates
- `docs/search.md`: Comprehensive Algolia configuration guide
- `docs/api.md`: Updated with filter schemas and examples
- `docs/architecture.md`: Enhanced with faceted search pipeline documentation

### Deployment & Testing
- All features implemented as separate Git branches with Vercel previews
- Comprehensive end-to-end testing across filter combinations
- Type safety verification with TypeScript strict mode
- Analytics integration for filter usage monitoring

---

## Previous Versions

### [v1.4.x] - AI Gift Recommendations
- OpenAI integration for intent parsing
- Paginated search results with cursor-based navigation
- Basic refinement chip suggestions

### [v1.3.x] - WooCommerce Integration
- Product data synchronization
- Price and availability management
- Category and relationship mapping

### [v1.2.x] - Core Search Infrastructure
- Algolia search integration
- Initial React UI implementation
- Basic chat interface functionality

### [v1.1.x] - Foundation
- Express.js API server setup
- Supabase integration for data management
- Vite + React frontend scaffolding

---

*For detailed technical specifications and migration guides, see the `/docs` directory.*