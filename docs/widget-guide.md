# Giftsmate Chat — No-Iframe Embed Widget (VS Code Guide)

**A production-ready, CSP-compliant Shadow DOM widget for WordPress with strict CORS allowlist.**

This guide walks you through building, deploying, and troubleshooting a single-file JavaScript widget that embeds a chat interface on WordPress without iframes, CSP violations, or CORS issues.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Repo Layout & Key Files](#repo-layout--key-files)
3. [VS Code Setup](#vs-code-setup)
4. [Local Development](#local-development)
5. [Building the Widget](#building-the-widget)
6. [CSP-Safe Build Verification](#csp-safe-build-verification)
7. [CORS Allowlist Configuration](#cors-allowlist-configuration)
8. [WordPress Integration](#wordpress-integration)
9. [Production Verification Checklist](#production-verification-checklist)
10. [Troubleshooting](#troubleshooting)
11. [Change Log & Versioning Strategy](#change-log--versioning-strategy)
12. [Appendix](#appendix)

---

## Prerequisites

- **Node.js** 18+ and **pnpm** (or npm)
- **VS Code** 1.80+
- **WordPress** site with admin access (or Code Snippets plugin)
- **Basic knowledge** of TypeScript, React, Vite, and WordPress
- **Access to uploads directory** on WordPress (via Media Library or FTP)

---

## Repo Layout & Key Files

```
gmAIPages/
├── client/
│   ├── components/gifts/
│   │   ├── ChatInterface.tsx    # Main chat UI (uses apiBase prop)
│   │   └── ChatEmbed.tsx        # Adapter for widget attributes
│   └── global.css               # Tailwind CSS (inlined into widget)
├── widget/
│   ├── src/
│   │   ├── widget.tsx           # Custom element definition
│   │   └── styles.css           # Widget-specific CSS (inlined)
│   └── ...
├── api/
│   ├── _services/
│   │   └── cors.ts              # Strict CORS helper
│   └── index.js                 # Consolidated API handler
├── dist/
│   └── spa/
│       └── giftsmate-chat.js    # ← Production widget file
├── vite.widget.config.ts        # Widget build config (CSP-safe)
├── vite.config.ts               # SPA build config
├── package.json
└── README.md
```

**Key Facts:**
- **Widget output:** `dist/spa/giftsmate-chat.js` (~289 KB raw, ~82 KB gzipped)
- **Custom element:** `<giftsmate-chat>`
- **API base:** `https://gm-ai-pages.vercel.app`
- **CORS allowlist:** 4 WordPress domains (giftsmate.net, www.giftsmate.net, theyayacafe.com, www.theyayacafe.com)

---

## VS Code Setup

### Recommended Extensions

Install these for optimal DX:

```
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension usernamehw.errorlens
code --install-extension bradlc.vscode-tailwindcss
code --install-extension ms-vscode.vscode-typescript-next
```

Or search in Extensions (`Cmd/Ctrl+Shift+X`):
- **ESLint** (dbaeumer.vscode-eslint)
- **Prettier** (esbenp.prettier-vscode)
- **Error Lens** (usernamehw.errorlens) — inline error messages
- **Tailwind CSS IntelliSense** (bradlc.vscode-tailwindcss)

### Useful Settings

Add to `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "files.exclude": {
    "**/.git": true,
    "**/node_modules": true,
    "**/dist": false
  }
}
```

### Multi-Root Workspace (Optional)

If your SPA, API, and widget are in separate repos:

```json
{
  "folders": [
    { "path": "spa" },
    { "path": "api" },
    { "path": "widget" }
  ],
  "settings": {
    "editor.formatOnSave": true
  }
}
```

---

## Local Development

### Install Dependencies

```bash
cd gmAIPages
pnpm install
```

### Available Scripts

From `package.json`:

```bash
# Build SPA + widget (production)
pnpm build

# Build only widget (fast iteration)
pnpm vite build -c vite.widget.config.ts

# Dev server (SPA only, no widget)
pnpm dev

# Type check
pnpm typecheck
```

### Fast Widget-Only Build Script

Add to `package.json` for quick iterations:

```json
"scripts": {
  "build": "vite build && vite build -c vite.widget.config.ts",
  "build:widget": "vite build -c vite.widget.config.ts",
  "watch:widget": "vite build -c vite.widget.config.ts --watch"
}
```

Run:
```bash
pnpm build:widget
```

### Local Testing Setup

1. **Build the widget:**
   ```bash
   pnpm build:widget
   ```

2. **Create a test page** at `public/test-widget.html`:
   ```html
   <!DOCTYPE html>
   <html lang="en">
   <head>
     <meta charset="UTF-8">
     <title>Widget Test</title>
   </head>
   <body>
     <h1>Giftsmate Chat Widget Test</h1>

     <giftsmate-chat
       api-base="https://gm-ai-pages.vercel.app"
       starter-prompts="Gifts for sister|Diwali gifts|Birthday return gifts">
     </giftsmate-chat>

     <script src="/giftsmate-chat.js" defer></script>
   </body>
   </html>
   ```

3. **Serve locally:**
   ```bash
   npx http-server public -p 8080 --cors
   ```

4. **Open:** http://localhost:8080/test-widget.html

5. **Check console:**
   ```javascript
   customElements.get('giftsmate-chat')  // Should be defined
   ```

---

## Building the Widget

### Vite Widget Config (`vite.widget.config.ts`)

**CSP-Safe Configuration:**

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, "widget/src/widget.tsx"),
      name: "GiftsmateChatWidget",
      formats: ["iife"],
      fileName: () => "giftsmate-chat.js",
    },
    outDir: "dist/spa",
    emptyOutDir: false,
    sourcemap: false,              // No inline data: URLs
    minify: "esbuild",             // or "terser" for more aggressive
    target: "es2020",
    cssCodeSplit: false,           // Inline all CSS
    rollupOptions: {
      output: {
        entryFileNames: "giftsmate-chat.js",
        inlineDynamicImports: true, // Single file
        hoistTransitiveImports: false,
      },
    },
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
    global: "window",
  },
  esbuild: {
    legalComments: "none",
    supported: { "dynamic-import": true },
  },
  css: {
    postcss: "./postcss.config.js",
  },
});
```

**Key Points:**
- **IIFE format:** Direct `<script>` usage, no module loader
- **sourcemap: false:** Avoids CSP issues with inline data: URIs
- **inlineDynamicImports:** No runtime code splitting
- **CSS inlined:** Tailwind + widget styles embedded in Shadow DOM

### Widget Source (`widget/src/widget.tsx`)

**Inline CSS into Shadow DOM:**

```typescript
import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import globalStyles from "@/global.css?inline";
import styles from "./styles.css?inline";
import Chat from "@/components/gifts/ChatEmbed";

class GiftsmateChat extends HTMLElement {
  private root?: ReturnType<typeof createRoot>;
  private shadow?: ShadowRoot;

  connectedCallback() {
    if (!this.shadow) {
      this.shadow = this.attachShadow({ mode: "open" });

      // Inject Tailwind/global styles
      const globalStyleTag = document.createElement("style");
      globalStyleTag.textContent = globalStyles;
      this.shadow.appendChild(globalStyleTag);

      // Inject widget-specific styles
      const styleTag = document.createElement("style");
      styleTag.textContent = styles;
      this.shadow.appendChild(styleTag);

      // Create mount point
      const mount = document.createElement("div");
      mount.id = "gm-root";
      this.shadow.appendChild(mount);

      this.root = createRoot(mount);
    }
    this.render();
  }

  private render() {
    const apiBase = this.getAttribute("api-base") || window.location.origin;
    const starterPrompts = this.getAttribute("starter-prompts")
      ?.split("|").map(s => s.trim()).filter(Boolean);

    this.root?.render(
      <React.StrictMode>
        <QueryClientProvider client={queryClient}>
          <Chat starterPrompts={starterPrompts} apiBase={apiBase} />
        </QueryClientProvider>
      </React.StrictMode>
    );
  }
}

if (!customElements.get("giftsmate-chat")) {
  customElements.define("giftsmate-chat", GiftsmateChat);
}
```

**Why Shadow DOM + Inline CSS?**
- **Isolation:** No style leakage from/to WordPress theme
- **CSP-safe:** No external stylesheet = no CSP `style-src` issues
- **Self-contained:** One file to upload

### Build Command

```bash
pnpm vite build -c vite.widget.config.ts
```

**Output:**
```
dist/spa/giftsmate-chat.js  289.07 kB │ gzip: 82.27 kB
```

---

## CSP-Safe Build Verification

### Check for `eval` and `new Function`

```bash
grep -nE 'eval\s*\(|new Function\s*\(' dist/spa/giftsmate-chat.js
```

**Expected:** No matches (exit code 1).

### Check for Inline Sourcemaps

```bash
grep -n 'sourceMappingURL=' dist/spa/giftsmate-chat.js
```

**Expected:** No matches.

### Automated Verification Script

Add to `package.json`:

```json
"scripts": {
  "verify:widget": "bash -c 'grep -q eval dist/spa/giftsmate-chat.js && echo ❌ eval found && exit 1 || echo ✅ No eval'"
}
```

Run:
```bash
pnpm verify:widget
```

### Why This Matters

**Content Security Policy (CSP)** blocks `eval()` and `new Function()` with `script-src 'self'` (no `'unsafe-eval'`). Many WordPress security plugins enforce strict CSP. Our build avoids:
- React dev mode (uses `eval` for hot reload)
- Inline sourcemaps (data: URIs = CSP violation)
- Dynamic `import()` polyfills (often use `Function()`)

---

## CORS Allowlist Configuration

### API CORS Helper (`api/_services/cors.ts`)

```typescript
const ALLOWED = new Set<string>([
  'https://giftsmate.net',
  'https://www.giftsmate.net',
  'https://theyayacafe.com',
  'https://www.theyayacafe.com',
]);

export function applyCORS(req, res) {
  const origin = req.headers.origin || req.headers.get?.('origin');

  res.setHeader('Vary', 'Origin');  // Prevent cache poisoning

  if (origin && ALLOWED.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export function handlePreflight(req, res): boolean {
  if (req.method === 'OPTIONS') {
    applyCORS(req, res);
    res.status(204).end();
    return true;
  }
  return false;
}
```

### API Handler (`api/index.js`)

```javascript
import { applyCORS, handlePreflight } from './_services/cors.js';

export default async function handler(req, res) {
  if (handlePreflight(req, res)) return;
  applyCORS(req, res);

  // ... your API logic
}
```

### Widget Fetch Settings (`ChatInterface.tsx`)

```typescript
const res = await fetch(url("/api/gifts/chat"), {
  method: "POST",
  mode: "cors",
  credentials: "omit",  // No cookies
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});
```

**Key Points:**
- **`mode: "cors"`** — Explicit cross-origin request
- **`credentials: "omit"`** — No cookies/auth (CORS allowlist doesn't need `Access-Control-Allow-Credentials`)
- **`Vary: Origin`** — Prevents CDN from caching wrong origin

### CORS Testing with curl

**1. OPTIONS Preflight:**
```bash
curl -i -X OPTIONS https://gm-ai-pages.vercel.app/api/gifts/chat \
  -H "Origin: https://www.giftsmate.net" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type"
```

**Expected:**
```
HTTP/2 204
access-control-allow-origin: https://www.giftsmate.net
access-control-allow-methods: GET,POST,OPTIONS
access-control-allow-headers: Content-Type, Authorization
vary: Origin
```

**2. POST Request:**
```bash
curl -i -X POST https://gm-ai-pages.vercel.app/api/gifts/chat \
  -H "Origin: https://www.giftsmate.net" \
  -H "Content-Type: application/json" \
  -d '{"message":"gifts for sister"}'
```

**Expected:**
```
HTTP/2 200
access-control-allow-origin: https://www.giftsmate.net
vary: Origin
content-type: application/json

{"reply":"Found...","products":[...]}
```

**3. Blocked Origin (should NOT echo origin):**
```bash
curl -i -X OPTIONS https://gm-ai-pages.vercel.app/api/gifts/chat \
  -H "Origin: https://malicious-site.com"
```

**Expected:** No `access-control-allow-origin` header echoing malicious-site.com.

---

## WordPress Integration

### Path 1: Page-Scoped Injection (Recommended)

**Use Case:** Load widget only on `/ai` page for performance.

**Steps:**

1. **Upload widget file** to WordPress:
   - Go to **Media Library → Upload** or use FTP
   - Upload: `dist/spa/giftsmate-chat.js`
   - Example path: `/wp-content/uploads/2025/10/giftsmate-chat.js`

2. **Install Code Snippets plugin:**
   ```
   Plugins → Add New → Search "Code Snippets" → Install & Activate
   ```

3. **Create new snippet:**
   - Go to **Snippets → Add New**
   - Title: `Giftsmate Chat Widget (AI page)`
   - Code:

   ```php
   <?php
   /**
    * Injects giftsmate-chat.js on /ai page only.
    * Cache-busting via ?v= query param.
    */
   add_action('wp_head', function () {
     if (is_page() && function_exists('get_queried_object') && ($p = get_queried_object())) {
       if (!empty($p->post_name) && $p->post_name === 'ai') {
         $ver = '20251002083039';  // ← Update when re-uploading
         $src = 'https://www.giftsmate.net/wp-content/uploads/2025/10/giftsmate-chat.js?v=' . $ver;
         echo '<script src="' . esc_url($src) . '" defer crossorigin="anonymous"></script>' . "\n";
       }
     }
   }, 1);
   ```

4. **Scope:** Run snippet everywhere
5. **Save & Activate**

6. **Edit `/ai` page** (Gutenberg or Elementor):
   - Add **HTML block**
   - Paste:

   ```html
   <giftsmate-chat
     api-base="https://gm-ai-pages.vercel.app"
     starter-prompts="Gifts for sister|Diwali gifts|Birthday return gifts">
   </giftsmate-chat>
   ```

7. **Publish** and test.

**Performance Notes:**
- Script loads with `defer` — non-blocking
- Only loads on `/ai` page — no sitewide overhead
- `crossorigin="anonymous"` — CORS-compliant

### Path 2: Shortcode (For Editors)

**Use Case:** Non-technical editors can insert `[gm_chat]` anywhere.

**Code Snippets:**

```php
<?php
add_shortcode('gm_chat', function($atts) {
  $ver = '20251002083039';
  $src = 'https://www.giftsmate.net/wp-content/uploads/2025/10/giftsmate-chat.js?v=' . $ver;
  $api = 'https://gm-ai-pages.vercel.app';

  ob_start(); ?>
  <script src="<?php echo esc_url($src); ?>" defer crossorigin="anonymous"></script>
  <giftsmate-chat
    api-base="<?php echo esc_attr($api); ?>"
    starter-prompts="Gifts for sister|Diwali gifts|Birthday return gifts">
  </giftsmate-chat>
  <?php return ob_get_clean();
});
```

**Usage:**

In any page/post:
```
[gm_chat]
```

Or in Elementor HTML widget:
```
[gm_chat]
```

**Caveat:** Script tag will be injected inline (may load multiple times if shortcode used on multiple pages).

---

## Production Verification Checklist

After deploying to WordPress, open the page and run these checks:

### 1. Custom Element Registered

**Console:**
```javascript
!!customElements.get('giftsmate-chat')
```
**Expected:** `true`

**If `false`:**
- Check Network tab for 404 on `.js` file
- Verify script `src` URL is correct
- Check for JS errors in console

### 2. Shadow DOM Attached

**Console:**
```javascript
!!document.querySelector('giftsmate-chat')?.shadowRoot
```
**Expected:** `true`

**If `false`:**
- Element may not have `connectedCallback` executed
- Check if element exists: `document.querySelector('giftsmate-chat')`
- Verify no JS errors

### 3. Styles Inlined in Shadow DOM

**Console:**
```javascript
!!document.querySelector('giftsmate-chat')?.shadowRoot.querySelector('style')
```
**Expected:** `true`

**If `false`:**
- CSS was not inlined during build
- Rebuild with `pnpm build:widget`
- Check `vite.widget.config.ts` has `cssCodeSplit: false`

### 4. Network Calls

**DevTools → Network:**

| File | Status | Size | Headers |
|------|--------|------|---------|
| `giftsmate-chat.js?v=...` | 200 | ~280 KB | `content-type: text/javascript` |
| `/api/gifts/chat` (OPTIONS) | 204 | 0 B | `access-control-allow-origin: https://www.giftsmate.net` |
| `/api/gifts/chat` (POST) | 200 | ~9 KB | `access-control-allow-origin: https://www.giftsmate.net` |

**If 404:**
- File not uploaded or wrong path
- Check Media Library URL

**If OPTIONS fails:**
- CORS not configured on API
- Check `api/_services/cors.ts` deployed
- Verify origin in allowlist

**If POST blocked by CORS:**
- Check `Origin` request header matches allowlist
- Verify `Vary: Origin` in response
- Try curl test from [CORS section](#cors-allowlist-configuration)

### 5. Console Errors

**Expected:** None related to widget.

**Common errors:**
- `Failed to fetch` → CORS or network issue
- `customElements.define called twice` → Script loaded multiple times (check for duplicate `<script>` tags)
- `Cannot read property 'shadowRoot'` → Element not registered

---

## Troubleshooting

### CSP Violations

**Symptoms:**
- Console error: `Refused to execute inline script because it violates CSP`
- Security panel shows violations

**Diagnosis:**

1. **Check Security tab** (DevTools → Security → View CSP)
2. **Look for:** `script-src 'self'` without `'unsafe-eval'`

**Fixes:**

1. **Verify widget is eval-free:**
   ```bash
   grep -nE 'eval\(|new Function\(' dist/spa/giftsmate-chat.js
   ```
   Should return nothing.

2. **Check WordPress security plugin:**
   - **Wordfence:** Go to **Options → Firewall → CSP**
   - Look for auto-generated CSP rules
   - Ensure `script-src` allows `'self'` and your domain

3. **Disable problematic plugins temporarily:**
   - Deactivate Wordfence CSP
   - Reload page
   - If works, adjust CSP to allow static scripts from uploads

4. **Manual CSP fix** (in theme's `functions.php` or plugin):
   ```php
   header("Content-Security-Policy: script-src 'self' https://www.giftsmate.net; style-src 'self' 'unsafe-inline'; object-src 'none';");
   ```

   **Note:** `'unsafe-inline'` for `style-src` is okay because styles are in Shadow DOM, not global.

### ORB / Blocked Scripts

**Symptoms:**
- Console: `Cross-Origin Read Blocking (CORB/ORB) blocked...`
- Script loads as HTML instead of JS

**Cause:** File served with wrong MIME type or behind auth.

**Fixes:**

1. **Check response headers:**
   ```bash
   curl -I https://www.giftsmate.net/wp-content/uploads/2025/10/giftsmate-chat.js
   ```

   **Expected:**
   ```
   content-type: application/javascript
   ```

   **If `text/html`:**
   - File not found (404 page returned as HTML)
   - Check upload path

2. **Disable auth on uploads:**
   - Some security plugins protect `/wp-content/uploads`
   - Whitelist `.js` files in plugin settings

3. **Verify static serving:**
   - Uploads should be served directly by Nginx/Apache
   - Not proxied through PHP

### CORS 401/403/Blocked

**Symptoms:**
- Network tab shows POST to API with status 401, 403, or blocked by CORS
- Console: `CORS policy: No 'Access-Control-Allow-Origin' header`

**Diagnosis:**

1. **Check Origin header** (DevTools → Network → POST request → Headers):
   ```
   Origin: https://www.giftsmate.net
   ```

2. **Check Response headers:**
   ```
   Access-Control-Allow-Origin: https://www.giftsmate.net
   Vary: Origin
   ```

**Fixes:**

1. **Verify origin in allowlist:**
   - Check `api/_services/cors.ts` has your domain
   - Redeploy API if changed

2. **Test with curl:**
   ```bash
   curl -i -X POST https://gm-ai-pages.vercel.app/api/gifts/chat \
     -H "Origin: https://www.giftsmate.net" \
     -H "Content-Type: application/json" \
     -d '{"message":"test"}'
   ```

3. **Check credentials:**
   - Widget must use `credentials: "omit"`
   - If using cookies, update CORS to add `Access-Control-Allow-Credentials: true`

4. **Verify Vercel deployment:**
   - Check `vercel.json` does NOT have wildcard CORS
   - CORS must be handled by `api/index.js` only

### Nothing Renders (Blank)

**Symptoms:**
- Widget tag present in DOM
- No content visible
- No errors in console

**Checks:**

1. **Element registered?**
   ```javascript
   customElements.get('giftsmate-chat')
   ```
   **If undefined:** Script not loaded or failed.

2. **Shadow root?**
   ```javascript
   document.querySelector('giftsmate-chat')?.shadowRoot
   ```
   **If null:** `connectedCallback` not executed.

3. **Network size:**
   - Check widget file loaded: ~280–300 KB
   - If <10 KB → wrong file (404 page cached)

4. **Cache issue:**
   - Hard refresh: `Cmd/Ctrl + Shift + R`
   - Update `?v=` query param
   - Clear WordPress cache (WP Rocket, W3 Total Cache, etc.)
   - Purge CDN (Cloudflare, etc.)

5. **Version mismatch:**
   - Verify `$ver` in PHP snippet matches uploaded file
   - Check file upload date vs cache date

### No Styles

**Symptoms:**
- Widget renders but unstyled (raw HTML)
- Tailwind classes not working

**Diagnosis:**

```javascript
document.querySelector('giftsmate-chat')?.shadowRoot.querySelector('style')
```

**If null:**

1. **CSS not inlined during build:**
   ```bash
   grep -c "@tailwind" dist/spa/giftsmate-chat.js
   ```
   Should return 0 (CSS should be inlined, not as directive).

2. **Rebuild widget:**
   ```bash
   pnpm build:widget
   ```

3. **Verify config:**
   - `vite.widget.config.ts` has `cssCodeSplit: false`
   - Widget imports CSS with `?inline` suffix:
     ```typescript
     import globalStyles from "@/global.css?inline";
     ```

4. **Check Shadow DOM injection:**
   - Open `widget/src/widget.tsx`
   - Verify `styleTag.textContent = globalStyles;`

---

## Change Log & Versioning Strategy

### Semantic Versioning for `?v=` Query Param

**Format:** `YYYYMMDDHHmmss` (timestamp-based)

**Example:** `20251002083039` = Oct 2, 2025, 08:30:39

### When to Update Version

| Change | Update `?v=` | Notes |
|--------|-------------|-------|
| CSS tweaks | ✅ Yes | Forces client to refetch |
| Bug fix | ✅ Yes | Critical updates |
| New features | ✅ Yes | API contract changes |
| Docs update | ❌ No | No code change |
| API-only change | ❌ No | Widget unchanged |

### Rollback Strategy

**Keep last 2 versions in uploads:**

```
/wp-content/uploads/2025/10/
├── giftsmate-chat.js         (current: v20251002083039)
├── giftsmate-chat.v20251001.js  (backup)
└── giftsmate-chat.v20250930.js  (old, can delete)
```

**To rollback:**

1. Edit Code Snippet
2. Change `$ver` to previous version:
   ```php
   $ver = '20251001120000';  // Rollback to Oct 1
   ```
3. Save
4. Purge cache

### Changelog Template

Keep in `CHANGELOG.md`:

```markdown
# Changelog

## [20251002083039] - 2025-10-02
### Fixed
- CSP compliance: removed all eval/new Function
- CORS: strict allowlist for 4 domains
- Inline CSS in Shadow DOM

## [20251001120000] - 2025-10-01
### Added
- Initial widget release
- Tailwind CSS support
```

---

## Appendix

### A. Complete curl Test Suite

**Save as `test-cors.sh`:**

```bash
#!/bin/bash
API="https://gm-ai-pages.vercel.app/api/gifts/chat"
ORIGIN="https://www.giftsmate.net"

echo "=== OPTIONS Preflight ==="
curl -i -X OPTIONS "$API" \
  -H "Origin: $ORIGIN" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type"

echo -e "\n\n=== POST Request ==="
curl -i -X POST "$API" \
  -H "Origin: $ORIGIN" \
  -H "Content-Type: application/json" \
  -d '{"message":"gifts for sister"}'

echo -e "\n\n=== Blocked Origin (should not echo origin) ==="
curl -i -X OPTIONS "$API" \
  -H "Origin: https://malicious-site.com" \
  -H "Access-Control-Request-Method: POST"
```

Run:
```bash
chmod +x test-cors.sh
./test-cors.sh
```

### B. DevTools Snippets

**Save these in DevTools → Sources → Snippets:**

**1. Widget Health Check:**
```javascript
// widget-health.js
const el = document.querySelector('giftsmate-chat');
console.log('Element:', !!el);
console.log('Registered:', !!customElements.get('giftsmate-chat'));
console.log('Shadow DOM:', !!el?.shadowRoot);
console.log('Styles:', !!el?.shadowRoot?.querySelector('style'));
console.log('Mount:', !!el?.shadowRoot?.querySelector('#gm-root'));
```

**2. CORS Debug:**
```javascript
// cors-debug.js
fetch('https://gm-ai-pages.vercel.app/api/gifts/chat', {
  method: 'POST',
  mode: 'cors',
  credentials: 'omit',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'test' })
})
.then(r => {
  console.log('Status:', r.status);
  console.log('Headers:', Object.fromEntries(r.headers.entries()));
  return r.json();
})
.then(data => console.log('Response:', data))
.catch(err => console.error('Error:', err));
```

### C. WordPress Upload via WP-CLI

```bash
# Upload via SSH
scp dist/spa/giftsmate-chat.js user@yourserver:/var/www/html/wp-content/uploads/2025/10/

# Or via WP-CLI (if installed)
wp media import dist/spa/giftsmate-chat.js
```

### D. File Size Budget

| File | Budget | Actual | Notes |
|------|--------|--------|-------|
| Widget (raw) | <350 KB | 289 KB | ✅ Under budget |
| Widget (gzip) | <100 KB | 82 KB | ✅ Good compression |
| Widget (brotli) | <70 KB | ~65 KB | ✅ Best compression |

**To check gzip size:**
```bash
gzip -c dist/spa/giftsmate-chat.js | wc -c
```

**To enable brotli on server:**
```nginx
# nginx.conf
http {
  brotli on;
  brotli_types text/javascript application/javascript;
}
```

### E. Monitoring & Alerts

**CloudFlare Analytics:**
- Monitor `giftsmate-chat.js` request count
- Alert if 404 rate > 1%

**Sentry (optional):**
```typescript
// In widget.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://your-dsn@sentry.io/project",
  environment: "production",
});
```

**Google Analytics:**
```javascript
// Track widget loads
gtag('event', 'widget_loaded', {
  'event_category': 'engagement',
  'widget_version': '20251002083039'
});
```

---

## Summary

You now have a **production-ready, CSP-compliant, Shadow DOM widget** that:

✅ Loads as a single IIFE JavaScript file
✅ Has all CSS inlined in Shadow DOM
✅ Uses strict CORS allowlist (4 WordPress domains)
✅ Avoids `eval`/`new Function` (CSP-safe)
✅ Supports page-scoped injection or shortcode
✅ Includes cache-busting via `?v=` param
✅ Has comprehensive troubleshooting guide

**Next Steps:**
1. Build: `pnpm build:widget`
2. Upload to WordPress `/uploads/`
3. Add Code Snippet (page-scoped or shortcode)
4. Verify with [checklist](#production-verification-checklist)
5. Monitor and iterate

**Questions?** Check [Troubleshooting](#troubleshooting) or test with [curl suite](#a-complete-curl-test-suite).

---

**Document Version:** 1.0.0
**Last Updated:** October 2, 2025
**Widget Version:** `20251002083039`
