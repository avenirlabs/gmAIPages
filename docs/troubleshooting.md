# Troubleshooting

Blank page on Netlify
- Check CSP in netlify.toml allows script-src/style-src and connect-src domains.
- Ensure index.html includes the built script tag (Vite does).

Chat shows "Sorry, I had trouble..."
- Verify env: OPENAI_API_KEY (optional), ALGOLIA_* present, ALGOLIA_INDEX has data.
- Confirm /api/gifts/chat reachable (200) and not 404; try `/.netlify/functions/api/gifts/chat`.
- Cold starts: client timeout increased to 20s.

Woo "Could not load products"
- Ensure WOOCOMMERCE_* envs valid; curl /api/woocommerce/products.
- Check 304/ETag behavior; bypass with curl -H 'Cache-Control: no-cache'.

CORS errors
- Set ALLOWED_ORIGINS to your site origin(s). Avoid '*'.

Install fails in CI (pnpm frozen lockfile)
- Use `pnpm install --no-frozen-lockfile` when lockfile is behind package.json.

Logs & debugging
- Add console logs in server routes (Netlify function logs). Use standardized { error, code } outputs.
