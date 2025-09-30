# Public Menu API Documentation

This document describes the public menu API endpoint that serves hierarchical navigation data from the `navigation_items` table with intelligent caching and webhook-based invalidation.

## Table of Contents

1. [API Endpoints](#api-endpoints)
2. [Header Adapter](#header-adapter)
3. [Response Format](#response-format)
4. [Caching Strategy](#caching-strategy)
5. [Webhook Setup](#webhook-setup)
6. [Testing](#testing)
7. [Security Considerations](#security-considerations)
8. [Troubleshooting](#troubleshooting)

---

## API Endpoints

### GET /api/menu

**Description**: Retrieves the complete hierarchical navigation menu structure.

**Method**: `GET`

**Authentication**: None (public endpoint)

**Query Parameters**: None

**Response Format**: JSON

**Response Headers**:
```
Content-Type: application/json; charset=utf-8
Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400
Access-Control-Allow-Origin: *
```

**Status Codes**:
- `200 OK` - Success
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - Supabase not configured

---

### GET /api/menus/[slug]

**Description**: Header adapter endpoint returning NavItem[] shape for SiteHeader component.

**Method**: `GET`

**Authentication**: None (public endpoint)

**URL Parameters**:
- `slug` - Menu identifier (default: "main")

**Response Format**: JSON

**Response Headers**:
```
Content-Type: application/json; charset=utf-8
Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400
Access-Control-Allow-Origin: *
```

**Status Codes**:
- `200 OK` - Success
- `405 Method Not Allowed` - Non-GET request
- `500 Internal Server Error` - Server error

---

### POST /api/admin/webhooks/menu-revalidate

**Description**: Webhook endpoint for cache invalidation when navigation items change.

**Method**: `POST`

**Authentication**: Required via `X-Webhook-Secret` header

**Headers**:
```
X-Webhook-Secret: <your-secret-token>
Content-Type: application/json
```

**Response Format**: JSON

**Status Codes**:
- `200 OK` - Cache cleared successfully
- `401 Unauthorized` - Invalid or missing secret
- `405 Method Not Allowed` - Non-POST request
- `503 Service Unavailable` - Webhook not configured

---

## Header Adapter

The navigation system provides two different API endpoints serving different purposes:

### GET /api/menu (Tree Structure)

**Purpose**: General-purpose hierarchical menu data

**Format**: Nested tree structure with recursive children

**Use Cases**:
- Admin interfaces that need full hierarchy
- Sitemap generation
- SEO/metadata purposes
- Custom navigation components

**Structure**:
```typescript
{
  items: [
    {
      type: "column",
      label: "Products",
      children: [
        {
          type: "group",
          label: "Electronics",
          children: [
            {
              type: "link",
              label: "Smartphones",
              href: "/products/smartphones"
            }
          ]
        }
      ]
    }
  ],
  generated_at: "2025-09-30T12:00:00.000Z"
}
```

---

### GET /api/menus/[slug] (Header Adapter)

**Purpose**: Adapter for SiteHeader component compatibility

**Format**: Flat NavItem[] array with specific link/mega types

**Use Cases**:
- SiteHeader component integration
- Frontend navigation rendering
- Legacy compatibility with existing header code

**Structure**:
```typescript
{
  items: [
    {
      type: "link",
      label: "Home",
      to: "/"
    },
    {
      type: "mega",
      label: "Shop",
      columns: [
        {
          heading: "Electronics",
          links: [
            { label: "Smartphones", to: "/products/smartphones", badge: "New" }
          ]
        }
      ]
    }
  ],
  generated_at: "2025-09-30T12:00:00.000Z"
}
```

**Transformation Logic**:

1. **Root Links**: Items with `type=link` and `parent_id=null` become `{ type: "link", label, to }`
2. **Mega Menu**: All columns with their nested groups/links are flattened into a single `{ type: "mega", label, columns }` item
3. **Column Ordering**: Columns are sorted by `order` field, preserving hierarchy
4. **Group Flattening**: Groups become `heading` properties in mega columns, with their links merged into a flat array

**Key Differences**:

| Feature | /api/menu | /api/menus/[slug] |
|---------|-----------|-------------------|
| Structure | Nested tree (recursive) | Flat array (NavItem[]) |
| Types | column, group, link | link, mega |
| Hierarchy | Fully preserved | Flattened for header |
| Groups | Explicit nodes | Become column headings |
| Use Case | General purpose | SiteHeader only |
| Admin Fields | Stripped | Stripped |

**Migration Note**: The `/api/menus/[slug]` endpoint replaces legacy queries to the old `menus`, `menu_items`, `menu_columns`, and `menu_links` tables. It now queries the unified `navigation_items` table and transforms the data to match the expected SiteHeader format.

---

## Response Format

### Success Response (200 OK)

```json
{
  "items": [
    {
      "type": "column",
      "label": "Products",
      "children": [
        {
          "type": "group",
          "label": "Electronics",
          "children": [
            {
              "type": "link",
              "label": "Smartphones",
              "href": "/products/smartphones",
              "icon": "smartphone",
              "badge_text": "New",
              "external": false,
              "open_new_tab": false
            },
            {
              "type": "link",
              "label": "Laptops",
              "href": "/products/laptops",
              "icon": "laptop"
            }
          ]
        },
        {
          "type": "group",
          "label": "Home & Garden",
          "children": [
            {
              "type": "link",
              "label": "Kitchen Appliances",
              "href": "/products/kitchen"
            }
          ]
        }
      ]
    },
    {
      "type": "column",
      "label": "Support",
      "children": [
        {
          "type": "link",
          "label": "Help Center",
          "href": "https://help.example.com",
          "external": true,
          "open_new_tab": true
        }
      ]
    }
  ],
  "generated_at": "2025-09-30T12:00:00.000Z"
}
```

### Menu Item Types

#### Column (Top-Level)
```typescript
{
  type: "column",
  label: string,
  children?: MenuItem[]  // groups or links
}
```

#### Group (Second Level)
```typescript
{
  type: "group",
  label: string,
  children?: MenuItem[]  // links only
}
```

#### Link (Leaf Node)
```typescript
{
  type: "link",
  label: string,
  href?: string,           // URL (required for links)
  icon?: string,           // Icon identifier
  badge_text?: string,     // Badge/notification text
  external?: boolean,      // Is external link
  open_new_tab?: boolean,  // Open in new tab
  hidden_on?: string[]     // ["mobile", "desktop"]
}
```

### Field Descriptions

| Field | Type | Description | Present On |
|-------|------|-------------|-----------|
| `type` | string | Item type: 'column', 'group', or 'link' | All |
| `label` | string | Display text | All |
| `href` | string | Navigation URL | Links only |
| `icon` | string | Icon identifier (e.g., 'smartphone') | Links only |
| `badge_text` | string | Badge label (e.g., 'New', '5') | Links only |
| `external` | boolean | External link flag | Links only |
| `open_new_tab` | boolean | Open in new tab flag | Links only |
| `hidden_on` | string[] | Platforms to hide on: ['mobile', 'desktop'] | All (optional) |
| `children` | MenuItem[] | Nested child items | Columns, Groups |
| `generated_at` | string | ISO8601 timestamp | Root only |

### Public Fields vs Admin Fields

**Public Fields** (exposed in API):
- `type`, `label`, `href`, `icon`, `badge_text`
- `external`, `open_new_tab`, `hidden_on`
- `children` (recursive)

**Admin Fields** (excluded from API):
- `id`, `parent_id`, `order`
- `is_active`, `tracking_tag`
- `updated_by`, `updated_at`

---

## Caching Strategy

The menu API uses a three-tier caching architecture for optimal performance:

### 1. Application Cache (Node.js In-Memory)

**Duration**: 1 hour (3600 seconds)

**Implementation**:
```typescript
let cachedMenu: MenuResponse | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 3600 * 1000; // 1 hour
```

**Benefits**:
- Zero database queries during cache lifetime
- Sub-millisecond response time for cached data
- Reduces Supabase load significantly

**Invalidation**:
- Webhook calls `clearMenuCache()` on navigation changes
- Automatic expiry after 1 hour

### 2. CDN Edge Cache (Vercel Edge Network)

**Duration**: 1 hour (3600 seconds)

**Header**: `Cache-Control: public, s-maxage=3600`

**Benefits**:
- Global distribution across edge locations
- Sub-10ms response time worldwide
- Automatic scaling for high traffic

**Behavior**:
- First request fetches from origin (Node.js)
- Subsequent requests served from edge cache
- Expires after 1 hour, refetches from origin

### 3. Stale-While-Revalidate

**Duration**: 24 hours (86400 seconds)

**Header**: `Cache-Control: stale-while-revalidate=86400`

**Benefits**:
- Serves stale content immediately while fetching fresh data in background
- Zero user-facing latency during cache updates
- Graceful degradation if origin is temporarily unavailable

**Behavior**:
- After edge cache expires, serves stale content
- Simultaneously fetches fresh data from origin
- Next request gets updated data

### Cache Invalidation Flow

```
1. Admin updates navigation_items in Supabase
   ↓
2. Supabase webhook triggers POST /api/admin/webhooks/menu-revalidate
   ↓
3. Webhook validates X-Webhook-Secret header
   ↓
4. clearMenuCache() purges in-memory Node.js cache
   ↓
5. Next API request rebuilds cache from Supabase
   ↓
6. CDN edge cache gradually updates as s-maxage expires
   ↓
7. Users receive fresh menu data (max 1 hour delay at edge)
```

### Cache Performance Metrics

| Scenario | Response Time | Database Queries |
|----------|---------------|------------------|
| Application Cache Hit | < 1ms | 0 |
| CDN Edge Cache Hit | < 10ms | 0 |
| Cache Miss (Fresh Build) | 50-200ms | 1 |
| Stale-While-Revalidate | < 10ms | 0 (async refresh) |

---

## Webhook Setup

### Prerequisites

1. **Supabase Project**: Admin access to database webhooks
2. **Vercel Deployment**: Public URL for API endpoint
3. **Environment Variable**: `MENU_WEBHOOK_SECRET` set in Vercel

### Step 1: Generate Webhook Secret

```bash
# Generate a secure random secret
openssl rand -hex 32

# Example output:
# 3f9a8b7c6d5e4f3a2b1c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a
```

### Step 2: Configure Vercel Environment Variable

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add new variable:
   - **Name**: `MENU_WEBHOOK_SECRET`
   - **Value**: `<your-generated-secret>`
   - **Environments**: Production, Preview, Development
3. Redeploy your application to apply changes

### Step 3: Create Supabase Webhook

1. **Navigate to Supabase Dashboard**:
   - Go to your project
   - Click **Database** → **Webhooks**

2. **Create New Webhook**:
   - Click **Create a new hook**

3. **Configure Webhook Settings**:

   **Name**: `Navigation Items Cache Invalidation`

   **Table**: `navigation_items`

   **Events**: Select all:
   - ☑ Insert
   - ☑ Update
   - ☑ Delete

   **Type**: `HTTP Request`

   **Method**: `POST`

   **URL**:
   ```
   https://your-domain.vercel.app/api/admin/webhooks/menu-revalidate
   ```

   **HTTP Headers**:
   ```json
   {
     "Content-Type": "application/json",
     "X-Webhook-Secret": "your-generated-secret-here"
   }
   ```

   **Timeout**: `5000` (5 seconds)

4. **Test Webhook**:
   - Click **Send Test Request**
   - Verify response: `{ "ok": true, "message": "Cache invalidated" }`

5. **Enable Webhook**:
   - Toggle webhook to **Enabled**
   - Save configuration

### Step 4: Verify Webhook Functionality

```bash
# Test webhook manually
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: your-secret-here" \
  https://your-domain.vercel.app/api/admin/webhooks/menu-revalidate

# Expected response:
# {
#   "ok": true,
#   "message": "Cache invalidated",
#   "timestamp": "2025-09-30T12:00:00.000Z"
# }
```

### Webhook Payload Format (from Supabase)

```json
{
  "type": "INSERT",
  "table": "navigation_items",
  "record": {
    "id": "uuid-here",
    "type": "link",
    "label": "New Item",
    "is_active": true,
    ...
  },
  "schema": "public",
  "old_record": null
}
```

### Troubleshooting Webhooks

**Webhook Not Triggering**:
- Verify webhook is enabled in Supabase
- Check Events selection (INSERT, UPDATE, DELETE)
- Confirm URL is publicly accessible

**401 Unauthorized**:
- Verify `X-Webhook-Secret` header matches env var
- Check case sensitivity (header and value)
- Ensure env var is deployed (redeploy after adding)

**500 Internal Server Error**:
- Check Vercel function logs for errors
- Verify Supabase connection is configured
- Ensure `api/menu.ts` exports `clearMenuCache`

---

## Testing

### Test GET /api/menu

```bash
# Basic request
curl https://your-domain.vercel.app/api/menu

# Verify cache headers
curl -I https://your-domain.vercel.app/api/menu

# Pretty-print JSON response
curl -s https://your-domain.vercel.app/api/menu | jq .

# Measure response time
curl -w "Time: %{time_total}s\n" -o /dev/null -s https://your-domain.vercel.app/api/menu
```

### Test Cache Invalidation

```bash
# 1. Fetch menu (cache miss - slow)
time curl https://your-domain.vercel.app/api/menu

# 2. Fetch again (cache hit - fast)
time curl https://your-domain.vercel.app/api/menu

# 3. Invalidate cache via webhook
curl -X POST \
  -H "X-Webhook-Secret: your-secret" \
  https://your-domain.vercel.app/api/admin/webhooks/menu-revalidate

# 4. Fetch again (cache miss - slow, rebuilds cache)
time curl https://your-domain.vercel.app/api/menu
```

### Test Webhook Security

```bash
# Test without secret (should fail with 401)
curl -X POST https://your-domain.vercel.app/api/admin/webhooks/menu-revalidate

# Test with wrong secret (should fail with 401)
curl -X POST \
  -H "X-Webhook-Secret: wrong-secret" \
  https://your-domain.vercel.app/api/admin/webhooks/menu-revalidate

# Test with correct secret (should succeed with 200)
curl -X POST \
  -H "X-Webhook-Secret: your-correct-secret" \
  https://your-domain.vercel.app/api/admin/webhooks/menu-revalidate
```

### Integration Testing

```typescript
// TypeScript test example
import { describe, it, expect } from 'vitest';

describe('Menu API', () => {
  const API_URL = 'https://your-domain.vercel.app/api/menu';

  it('should return valid menu structure', async () => {
    const response = await fetch(API_URL);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('items');
    expect(data).toHaveProperty('generated_at');
    expect(Array.isArray(data.items)).toBe(true);
  });

  it('should have correct cache headers', async () => {
    const response = await fetch(API_URL);

    expect(response.headers.get('cache-control')).toContain('public');
    expect(response.headers.get('cache-control')).toContain('s-maxage=3600');
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
  });

  it('should return nested structure', async () => {
    const response = await fetch(API_URL);
    const data = await response.json();

    const column = data.items.find((item: any) => item.type === 'column');
    expect(column).toBeDefined();
    expect(column.children).toBeDefined();
  });
});
```

---

## Security Considerations

### Public Endpoint Security

**CORS Policy**:
- Wide open (`Access-Control-Allow-Origin: *`)
- Safe for public menu data
- No sensitive information exposed

**Rate Limiting** (recommended):
```typescript
// Add to api/menu.ts
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100 // 100 requests per minute
});
```

**DDoS Protection**:
- CDN caching absorbs traffic spikes
- Vercel Edge Network provides built-in protection
- In-memory cache prevents database overload

### Webhook Security

**Authentication**:
- Secret-based validation via `X-Webhook-Secret` header
- Secret stored securely in environment variables
- No credentials in code or logs

**Validation**:
```typescript
if (providedSecret !== webhookSecret) {
  return res.status(401).json({ error: 'Unauthorized' });
}
```

**Best Practices**:
- Use long, random secrets (32+ characters)
- Rotate secrets periodically
- Never log secret values
- Use HTTPS only (enforced by Vercel)

### Data Privacy

**No PII Exposed**:
- Menu data is purely structural
- No user data or personal information
- Safe for public consumption

**Admin Metadata Stripped**:
- IDs, timestamps, and audit fields excluded
- Only public-facing fields returned
- Admin interface separate from public API

---

## Troubleshooting

### Menu Returns Empty Array

**Cause**: No active navigation items in database

**Solution**:
```sql
-- Check for navigation items
SELECT id, type, label, is_active
FROM public.navigation_items;

-- Ensure items are active
UPDATE public.navigation_items
SET is_active = true
WHERE is_active = false;
```

### Cache Not Clearing

**Symptoms**: Menu doesn't update after changes

**Debugging Steps**:
```bash
# 1. Check Supabase webhook logs
# Dashboard → Database → Webhooks → Click webhook → View logs

# 2. Check Vercel function logs
# Dashboard → Deployment → Functions → View logs

# 3. Manually trigger webhook
curl -X POST -H "X-Webhook-Secret: your-secret" \
  https://your-domain.vercel.app/api/admin/webhooks/menu-revalidate

# 4. Verify response
# Should return: { "ok": true, "message": "Cache invalidated" }
```

**Common Issues**:
- Webhook secret mismatch
- Webhook not enabled
- Environment variable not deployed
- Function timeout (increase in vercel.json)

### 503 Service Unavailable

**Cause**: Supabase not configured

**Solution**:
```bash
# Verify environment variables in Vercel
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Slow Response Times

**Expected Times**:
- Cache hit: < 10ms
- Cache miss: 50-200ms
- First request: 200-500ms (cold start)

**Optimization**:
- Ensure CDN caching is working (check headers)
- Verify webhook is clearing cache properly
- Check Supabase query performance
- Consider adding database indexes

### Menu Structure Issues

**Symptoms**: Missing children, incorrect nesting

**Debugging**:
```typescript
// Add logging to api/menu.ts
console.log('Raw items from DB:', items.length);
console.log('Tree structure:', JSON.stringify(menuTree, null, 2));
```

**Validation**:
```sql
-- Check parent-child relationships
SELECT
  n.id,
  n.type,
  n.label,
  p.type as parent_type,
  p.label as parent_label
FROM public.navigation_items n
LEFT JOIN public.navigation_items p ON n.parent_id = p.id
WHERE n.is_active = true;
```

---

## Related Documentation

- [Navigation System](../navigation.md) - Hierarchical menu structure
- [Admin Menu Schema](./menu_schema.md) - Database schema reference
- [API Reference](../api.md) - Complete API documentation
- [Architecture](../architecture.md) - System design overview

---

## Changelog

**2025-09-30**: Initial implementation
- Created GET /api/menu endpoint
- Added webhook revalidation endpoint
- Implemented three-tier caching strategy
- Comprehensive documentation