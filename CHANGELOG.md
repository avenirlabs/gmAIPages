# Changelog

All notable changes to the Gifts Guru AI search system will be documented in this file.

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