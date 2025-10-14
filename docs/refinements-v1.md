# Refinements v1 — Technical Documentation

**Status**: Steps 1–5 complete
**Last updated**: 2025-10-03
**Repository**: https://github.com/avenirlabs/gmAIPages

---

## Table of Contents

1. [Concepts & Glossary](#concepts--glossary)
2. [Data Sources](#data-sources)
3. [Client-Side Utilities](#client-side-utilities)
4. [Client Behavior](#client-behavior)
5. [Server Behavior](#server-behavior)
6. [CSP & CORS Notes](#csp--cors-notes)
7. [WordPress Embed Instructions](#wordpress-embed-instructions)
8. [Performance Notes](#performance-notes)

---

## Concepts & Glossary

### Core Concepts

**Relations**
Predefined gift recipient categories (e.g., "dad", "mom", "sister"). Each relation has aliases for fuzzy matching and a list of associated personas.

**Personas**
Specific interest profiles within a relation (e.g., "Loves cooking", "Whisky lover" for dad). Each persona has:
- `id`: Unique identifier (e.g., `dad_cooking`)
- `label`: Display text (e.g., "Loves cooking")
- `tags`: Array of semantic tags (e.g., `["cooking", "kitchen", "chef"]`)

**Fallback Personas**
Generic personas shown when no relation is detected (e.g., "Personalized gifts", "Under ₹999", "Last-minute").

**Chips**
Clickable UI buttons representing personas. Clicking a chip appends its tags to the user's query as hashtags.

**Hashtags**
Semantic tokens prefixed with `#` (e.g., `#cooking #kitchen #chef`) added to queries for server-side re-ranking.

**Active Refinements**
The set of hashtags currently applied to the query. Tracked in:
- Client state (`activeTags`)
- Server response (`meta.appliedRefinements`)

**Refined by Badges**
UI badges showing active refinements with individual × buttons for removal.

**Drawer**
Bottom-sheet modal for multi-selecting personas. Opens via "Refine more" button.

---

## Data Sources

### `data/taxonomy.json`

Structured JSON defining relations, aliases, personas, and fallback options.

```json
{
  "relations": {
    "dad": {
      "aliases": ["father", "papa", "dad-in-law", "father-in-law"],
      "personas": [
        {"id": "dad_cooking", "label": "Loves cooking", "tags": ["cooking", "kitchen", "chef"]},
        {"id": "dad_whisky", "label": "Whisky lover", "tags": ["whisky", "barware", "whiskey"]},
        ...
      ]
    },
    "mom": { ... },
    "sister": { ... }
  },
  "fallback": [
    {"id": "gen_personalized", "label": "Personalized gifts", "tags": ["personalized"]},
    {"id": "gen_budget", "label": "Under ₹999", "tags": ["budget_999"]},
    {"id": "gen_last_min", "label": "Last-minute", "tags": ["fast_shipping"]}
  ]
}
```

**How it's used**:
- Imported as static JSON in `client/utils/refinements.ts`
- Parsed at runtime by `getRefinementChips()` to match relation/aliases
- No server-side dependency (pure client logic)

---

## Client-Side Utilities

### `client/types/taxonomy.ts`

TypeScript interfaces for type safety:

```typescript
export type PersonaTag = string;

export interface Persona {
  id: string;
  label: string;
  tags: PersonaTag[];
}

export interface Relation {
  aliases: string[];
  personas: Persona[];
}

export interface Taxonomy {
  relations: Record<string, Relation>;
  fallback: Persona[];
}
```

### `client/utils/refinements.ts`

**Core Functions**:

#### 1. Relation Detection
```typescript
detectRelationKey(query: string, hint?: string): string | null
```
- Matches query against relation keys and aliases (case-insensitive)
- Example: `"gifts for dad"` → `"dad"`
- Returns `null` if no match

#### 2. Chip Resolution
```typescript
getRefinementChips(ctx: RefinementContext): Persona[]
```
- Resolves personas for detected relation or returns fallback
- `RefinementContext`: `{ query, relationHint?, limit? }`
- Deduplicates by `id`

#### 3. Tag Extraction
```typescript
extractTagsFromQuery(q: string): string[]
```
- Regex: `/(^|\s)#([a-z0-9_]{2,40})\b/gi`
- Returns normalized tags: `["cooking", "kitchen", "chef"]`

#### 4. Tag Removal
```typescript
removeTagFromQuery(q: string, tag: string): string
```
- Removes specific hashtag from query
- Example: `"gifts for dad #cooking #kitchen"` + `"cooking"` → `"gifts for dad #kitchen"`

#### 5. Strip All Tags
```typescript
stripAllTags(q: string): string
```
- Removes all hashtags, collapses whitespace
- Example: `"gifts for dad #cooking #kitchen"` → `"gifts for dad"`

#### 6. Add Tags (Deduped)
```typescript
addTagsToQuery(q: string, newTags: string[]): string
```
- Preserves existing tags, adds new ones (no duplicates)
- Example: `"gifts for dad #cooking"` + `["kitchen", "cooking"]` → `"gifts for dad #cooking #kitchen"`

#### 7. Replace All Tags
```typescript
replaceAllTags(q: string, tags: string[]): string
```
- Strips existing tags, adds new set
- Example: `"gifts for dad #cooking"` + `["whisky", "barware"]` → `"gifts for dad #whisky #barware"`

---

## Client Behavior

### `client/components/gifts/ChatInterface.tsx`

#### State Management

```typescript
// Persisted tags (synced with input)
const [activeTags, setActiveTags] = useState<string[]>([]);

// Server-confirmed refinements
const [lastMeta, setLastMeta] = useState<{ appliedRefinements?: string[] } | null>(null);

// Drawer state
const [drawerOpen, setDrawerOpen] = useState(false);
const [drawerSelected, setDrawerSelected] = useState<string[]>([]);
```

#### Chip Generation

```typescript
// Inline chips (limit: 8)
const chips = useMemo(() => {
  const q = currentQuery || "gifts";
  return getRefinementChips({ query: q, relationHint, limit: 8 });
}, [currentQuery]);

// Drawer chips (limit: 24)
const drawerChips = useMemo(() => {
  const q = currentQuery || "gifts";
  return getRefinementChips({ query: q, relationHint, limit: 24 });
}, [currentQuery]);
```

#### Tag Persistence

```typescript
// Sync activeTags with input (source of truth)
useEffect(() => {
  setActiveTags(extractTagsFromQuery(input || ""));
}, [input]);
```

#### User Interactions

**Apply Chip (Inline)**:
```typescript
function applyRefinement(persona: Persona) {
  const base = currentQuery || "gifts";
  const tagSuffix = persona.tags.map(t => `#${t.replace(/\s+/g, "_")}`).join(" ");
  const refined = `${base} ${tagSuffix}`.trim();
  setInput(refined);
  handleSend(refined);
}
```

**Remove Single Refinement**:
```typescript
function handleRemoveRefinement(tag: string) {
  const next = removeTagFromQuery(input || currentQuery || "", tag);
  setInput(next);
  setTimeout(() => handleSend(next), 0);
}
```

**Clear All Refinements**:
```typescript
function handleClearRefinements() {
  const next = stripAllTags(input || currentQuery || "");
  setInput(next);
  setTimeout(() => handleSend(next), 0);
}
```

**Drawer Multi-Select**:
```typescript
function toggleDrawerTag(tagList: string[]) {
  const norm = tagList.map(t => t.toLowerCase().replace(/_+/g, "_"));
  const allPresent = norm.every(t => drawerSelected.includes(t));
  if (allPresent) {
    // Deselect all
    setDrawerSelected(prev => prev.filter(t => !norm.includes(t)));
  } else {
    // Add missing
    setDrawerSelected(prev => [...new Set([...prev, ...norm])]);
  }
}

function applyDrawerSelection() {
  if (drawerSelected.length === 0) {
    closeDrawer();
    return;
  }
  const next = addTagsToQuery(input || "", drawerSelected);
  setInput(next);
  handleSend(next);
  setDrawerSelected([]);
  closeDrawer();
}
```

#### Server Response Handling

```typescript
onSuccess: (data, variables) => {
  setLastMeta(data?.meta ?? null); // Capture server-confirmed refinements
  // ... existing turn updates
}
```

#### UI Rendering

**Refined by Badges** (`client/components/gifts/ChatInterface.tsx:511-529`):
```tsx
{(lastMeta?.appliedRefinements?.length ?? 0) > 0 && (
  <div className="gm-refinedby-wrap">
    <div className="gm-refinedby-head">
      <span>Refined by:</span>
      <button onClick={handleClearRefinements}>Clear</button>
    </div>
    <div className="gm-refinedby-badges">
      {lastMeta!.appliedRefinements!.map((t) => (
        <span key={t} className="gm-badge">
          #{t}
          <button onClick={() => handleRemoveRefinement(t)}>×</button>
        </span>
      ))}
    </div>
  </div>
)}
```

**Empty State Suggestions** (`client/components/gifts/ChatInterface.tsx:591-602`):
```tsx
{noConversationYet && inputIsEmpty && (
  <div className="gm-emptystate">
    <div className="gm-emptystate-title">Try one of these:</div>
    <div className="gm-chips">
      {chips.slice(0, 8).map((p) => (
        <button onClick={() => applyRefinement(p)}>{p.label}</button>
      ))}
    </div>
  </div>
)}
```

**Refine More Button** (`client/components/gifts/ChatInterface.tsx:625-631`):
```tsx
{chips && chips.length > 0 && (
  <div className="gm-refine-more-wrap">
    <button onClick={toggleDrawer}>Refine more</button>
  </div>
)}
```

**Drawer** (`client/components/gifts/ChatInterface.tsx:654-688`):
```tsx
{drawerOpen && (
  <div className="gm-drawer-overlay" onClick={closeDrawer}>
    <div className="gm-drawer" onClick={(e) => e.stopPropagation()}>
      <div className="gm-drawer-head">
        <div>Refine your search</div>
        <button onClick={closeDrawer}>×</button>
      </div>
      <div className="gm-drawer-chips">
        {drawerChips.map((p) => {
          const allIn = p.tags.every(t => drawerSelected.includes(t));
          return (
            <button
              className={`gm-chip ${allIn ? "gm-chip--active" : ""}`}
              onClick={() => toggleDrawerTag(p.tags)}
            >
              {p.label}
            </button>
          );
        })}
      </div>
      <div className="gm-drawer-actions">
        <button onClick={clearDrawerSelection}>Clear selection</button>
        <button onClick={applyDrawerSelection}>Apply refinements</button>
      </div>
    </div>
  </div>
)}
```

---

## Server Behavior

### `api/_services/refinements.ts`

**Tag Parsing**:
```typescript
export function parseQueryTags(input: string): ParsedQuery {
  const tagRe = /(^|\s)#([a-z0-9_]{2,40})\b/gi;
  const tags: string[] = [];
  let stripped = input;

  stripped = stripped.replace(tagRe, (_m, _pre, t) => {
    const norm = t.toLowerCase().replace(/_+/g, "_");
    if (!tags.includes(norm)) tags.push(norm);
    return ""; // Remove from query
  });

  const plainQuery = stripped.replace(/\s{2,}/g, " ").trim();
  return { plainQuery, tags };
}
```

**Tag Scoring**:
```typescript
export function tagScore(text: string, tags: string[]): number {
  if (!text || !tags?.length) return 0;
  const hay = text.toLowerCase();
  let score = 0;
  for (const t of tags) {
    const asWord = t.replace(/_/g, " ");
    if (hay.includes(t)) score += 2;
    if (asWord !== t && hay.includes(asWord)) score += 2;
  }
  return score;
}
```

### `api/index.js` — POST `/api/gifts/chat`

**Parse Tags from Query** (`api/index.js:289-295`):
```javascript
const rawQuery = (query || message || "").toString();
const { plainQuery, tags } = parseQueryTags(rawQuery);
const searchQuery = plainQuery || rawQuery || "";
```

**Re-Rank Results** (`api/index.js:381-398`):
```javascript
function boostScoreForProduct(p, tags) {
  let s = 0;
  s += tagScore(p?.title || "", tags) * 3;           // Title: 3x weight
  s += tagScore((p?.tags || []).join(" "), tags) * 2; // Tags: 2x weight
  s += tagScore(p?.description || "", tags) * 1;     // Description: 1x weight
  return s;
}

if (tags.length > 0) {
  products = products.map(p => ({
    ...p,
    _gmScore: boostScoreForProduct(p, tags),
  }))
  .sort((a, b) => (b._gmScore ?? 0) - (a._gmScore ?? 0));
}
```

**Response Meta** (`api/index.js:457-459`):
```javascript
meta: {
  ...existingMeta,
  appliedRefinements: tags,      // ["cooking", "kitchen", "chef"]
  effectiveQuery: searchQuery,   // "gifts for dad"
  originalQuery: rawQuery        // "gifts for dad #cooking #kitchen #chef"
}
```

---

## CSP & CORS Notes

### Content Security Policy (CSP)

**Why CSP-Safe**:
- **No `eval()` or `new Function()`**: Vite build configured with `minify: "esbuild"` (no Terser)
- **No inline scripts**: All JS bundled in single IIFE
- **No sourcemaps**: `sourcemap: false` prevents inline data URLs
- **No dynamic imports**: `inlineDynamicImports: true` bundles all chunks

**Build Config** (`vite.widget.config.ts`):
```typescript
build: {
  lib: {
    entry: "widget/src/widget.tsx",
    formats: ["iife"],
    fileName: () => "giftsmate-chat.js",
  },
  sourcemap: false,
  minify: "esbuild",
  cssCodeSplit: false,
  rollupOptions: {
    output: {
      inlineDynamicImports: true,
    },
  },
}
```

**Verification**:
```bash
# Check for eval usage
grep -n 'eval\|new Function' dist/spa/giftsmate-chat.js

# Check for sourcemaps
grep -n 'sourceMappingURL=' dist/spa/giftsmate-chat.js
```

### Cross-Origin Resource Sharing (CORS)

**Strict Allowlist** (`api/_services/cors.ts`):
```typescript
const ALLOWED = new Set<string>([
  'https://giftsmate.net',
  'https://www.giftsmate.net',
  'https://theyayacafe.com',
  'https://www.theyayacafe.com',
]);

export function applyCORS(req, res) {
  const origin = getOrigin(req);
  res.setHeader('Vary', 'Origin');
  if (origin && ALLOWED.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
}
```

**How It Works**:
1. Client sends `Origin: https://www.giftsmate.net` header
2. Server checks allowlist
3. If allowed, returns `Access-Control-Allow-Origin: https://www.giftsmate.net`
4. Browser permits cross-origin request

**Testing CORS**:
```bash
# OPTIONS preflight
curl -X OPTIONS https://your-api.vercel.app/api/gifts/chat \
  -H 'Origin: https://www.giftsmate.net' \
  -H 'Access-Control-Request-Method: POST' -v

# POST with origin
curl -X POST https://your-api.vercel.app/api/gifts/chat \
  -H 'Origin: https://www.giftsmate.net' \
  -H 'Content-Type: application/json' \
  -d '{"query":"test"}' -v
```

---

## WordPress Embed Instructions

### Recommended Setup

**Step 1: Upload Widget**
Upload `dist/spa/giftsmate-chat.js` to WordPress Media Library or CDN.

**Step 2: Add Script via Code Snippets Plugin**

Install: [Code Snippets](https://wordpress.org/plugins/code-snippets/)

**Snippet Type**: Run everywhere
**Code**:
```php
<?php
// Inject Giftsmate widget script on /ai page only
function gm_inject_widget_script() {
    if (is_page('ai')) {
        $version = '20251003143900'; // Update on each deploy
        $script_url = get_site_url() . '/wp-content/uploads/giftsmate-chat.js?v=' . $version;
        ?>
        <script src="<?php echo esc_url($script_url); ?>" defer></script>
        <?php
    }
}
add_action('wp_footer', 'gm_inject_widget_script');
?>
```

**Step 3: Add Widget Element to Page**

Edit `/ai` page in WordPress block editor, add HTML block:
```html
<giftsmate-chat
  api-base="https://your-api.vercel.app"
  starter-prompts="Gifts for sister|Diwali gifts|Birthday return gifts">
</giftsmate-chat>
```

**Attributes**:
- `api-base`: API endpoint (defaults to same origin)
- `starter-prompts`: Pipe-separated list of starter prompts

**Cache Busting**:
- Update `$version` timestamp after each widget build
- Format: `YYYYMMDDHHmmss`
- Prevents browsers from serving stale cached widget

---

## Performance Notes

### Why Shadow DOM with Inlined CSS

**Problem**: External CSS won't style Shadow DOM content.

**Solution**: Import CSS as string with Vite's `?inline` suffix:
```typescript
import globalStyles from "@/global.css?inline";
import styles from "./styles.css?inline";

// Inject into Shadow DOM
const styleTag = document.createElement("style");
styleTag.textContent = globalStyles + styles;
shadow.appendChild(styleTag);
```

**Benefits**:
- **Isolation**: Styles scoped to widget, won't leak to WordPress
- **Single file**: No external CSS requests
- **CSP-safe**: No inline style attributes

### Why Single-File IIFE

**IIFE (Immediately Invoked Function Expression)**:
```javascript
(function() {
  // Widget code here
})();
```

**Benefits**:
- **No globals**: Self-contained namespace
- **No dependencies**: Doesn't rely on AMD/CommonJS/UMD loaders
- **Fast parse**: Browser executes immediately
- **Predictable**: Works in any environment (WordPress, plain HTML, etc.)

**Alternative Rejected**: ESM (`<script type="module">`) requires CORS headers on script files, problematic for WordPress uploads.

### Recommended Hosting

**CDN Setup**:
```nginx
# Vercel headers (vercel.json)
{
  "headers": [
    {
      "source": "/giftsmate-chat.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

**Versioning Strategy**:
1. **Immutable files**: Use hash-based filenames (`giftsmate-chat.abc123.js`)
2. **Query params**: Cache-bust with `?v=timestamp`
3. **CDN purge**: Invalidate on deploy

**Bundle Size Targets**:
- Raw: < 300 KB
- Gzipped: < 90 KB
- First paint: < 2s on 3G

**Current Stats** (as of Step 5):
- Raw: 297.52 KB
- Gzipped: 84.74 KB

---

## Testing & Verification

See companion docs:
- **Test Plan**: `docs/refinements-test-plan.md`
- **QA Checklist**: `docs/refinements-qa-checklist.md`

---

## Changelog

### Step 1–2: Taxonomy + Chip UI
- Created `data/taxonomy.json` with dad/mom/sister relations
- Implemented `getRefinementChips()` with relation detection
- Added inline chips UI in `ChatInterface.tsx`

### Step 3: Server-Side Tag Parsing
- Created `api/_services/refinements.ts` with `parseQueryTags()`, `tagScore()`
- Modified `api/index.js` to strip tags, re-rank products, return meta

### Step 4: Visible Refinement State
- Added "Refined by" badges with × and Clear actions
- Captured server meta in client state
- Implemented empty-state suggestions

### Step 5: Persistence + Drawer
- Added `activeTags` state synced with input
- Implemented "Refine more" drawer with multi-select
- Created `addTagsToQuery()`, `replaceAllTags()` utilities
- Styled drawer with overlay, actions, active chip state

---

## Known Limitations

1. **No Escape Key**: Drawer requires clicking overlay or × to close
2. **No Keyboard Nav**: Chips/drawer not accessible via Tab/Enter
3. **No Animations**: Drawer appears/disappears instantly
4. **No Undo**: Removing tags requires re-selecting chips
5. **Static Taxonomy**: Relations/personas hardcoded in JSON
6. **English Only**: No i18n support

---

## Next Steps (Future)

- **Step 6**: Analytics (track chip clicks, drawer usage, tag combinations)
- **Step 7**: Dynamic taxonomy (fetch from CMS/API)
- **Step 8**: A/B test drawer vs. inline-only chips
- **Step 9**: Keyboard navigation + ARIA improvements
- **Step 10**: Mobile drawer gestures (swipe to close)

---

**End of Refinements v1 Documentation**
