# Search & Faceting

This document describes the facet-aware search implementation for Gifts Guru AI, including Algolia index configuration, canonical fields, and filter behavior.

## Canonical Facet Fields

All product records in the Algolia index should include these standardized facet fields:

### Core Facets

- **`relationship`** (array, normalized lowercase): Target recipients
  - Values: `["dad", "mom", "sister", "brother", "wife", "husband", "girlfriend", "boyfriend"]`
  - Example: `["dad", "husband"]`

- **`occasion`** (array, normalized lowercase): Gift-giving occasions
  - Values: `["birthday", "anniversary", "diwali", "christmas", "valentine", "wedding", "engagement"]`
  - Example: `["birthday", "anniversary"]`

- **`price_bucket`** (string): Standardized price ranges in INR
  - Values: `"under-499"`, `"500-999"`, `"1000-1999"`, `"2000-4999"`, `"5000-plus"`
  - Generated from numeric `price` field

- **`categories`** (optional hierarchical facets): Product taxonomy
  - Format: `categories.lvl0`, `categories.lvl1`, `categories.lvl2`
  - Example: `"Gifts > For Him > Tech"`

### Supporting Fields

- **`price`** (number): Numeric price in INR for range filtering
- **`tags`** (array): Additional searchable attributes

## Algolia Index Settings

Configure your Algolia index with these settings for optimal faceting:

```json
{
  "attributesForFaceting": [
    "searchable(relationship)",
    "searchable(occasion)",
    "categories",
    "price_bucket"
  ],
  "facetingAfterDistinct": true,
  "maxValuesPerFacet": 25,
  "ignorePlurals": true,
  "removeStopWords": ["en"]
}
```

### Key Settings Explained

- **`searchable(relationship/occasion)`**: Makes facet values searchable in the main query
- **`facetingAfterDistinct`**: Applies faceting after deduplication for accurate counts
- **`maxValuesPerFacet: 25`**: Limits facet values returned to prevent large payloads
- **`ignorePlurals`**: Treats singular/plural forms as equivalent
- **`removeStopWords`**: Filters out common words in English

## Filter Types

### Strict Filtering (Default)
Uses Algolia `facetFilters` and `numericFilters` for precise matching:
- Only products matching ALL filter criteria are returned
- Zero results trigger automatic soft fallback (see below)

### Soft Filtering
Uses Algolia `optionalFilters` with scoring weights:
- Products matching filters are boosted in ranking
- All products remain eligible, with filtered ones ranked higher
- Weights: `relationship=3`, `occasion=2`, `price_bucket=1`

## Price Bucketing Logic

Price buckets are generated server-side from numeric `price` values:

```typescript
function getPriceBucket(price: number): string {
  if (price < 500) return "under-499";
  if (price < 1000) return "500-999";
  if (price < 2000) return "1000-1999";
  if (price < 5000) return "2000-4999";
  return "5000-plus";
}
```

## Normalization Rules

### Relationships
- Convert to lowercase: `"Dad"` → `"dad"`
- Map variants: `"father"` → `"dad"`, `"mother"` → `"mom"`

### Occasions
- Convert to lowercase: `"Birthday"` → `"birthday"`
- Handle variants: `"xmas"` → `"christmas"`

### Categories
- Use hierarchical format: `"Tech > Gadgets > Smart Watch"`
- Maintain consistent taxonomy structure

## Zero-Hit Fallback

When strict filtering produces zero results:

1. Automatically retry with `soft: true`
2. Set `meta.broadened = true` in response
3. Client shows banner: *"We broadened your search to show close matches"*
4. Provide "Revert to strict" option

## Migration Notes

For existing indexes:
1. Add new facet fields to product records
2. Update index settings via Algolia dashboard
3. Rebuild index to apply faceting configuration
4. Test facet queries return expected counts

## API Integration

See [API Documentation](./api.md) for request/response schemas including:
- `ChatRequestBody.filters`: Filter specification
- `ChatResponseBody.facets`: Live facet counts
- `ChatResponseBody.appliedFilters`: Echo of applied filters