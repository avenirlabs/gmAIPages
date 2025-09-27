# Deployment

## Netlify (recommended)
- netlify.toml config:
  - build.command: `pnpm run build:client`
  - publish: `dist/spa`
  - functions: `netlify/functions`
  - Redirects: `/api/* -> /.netlify/functions/api/:splat` and SPA fallback
  - Headers: CSP and security headers
- Functions entry: netlify/functions/api.ts wraps Express server via serverless-http.
- Env vars: set all from docs/env.md in Netlify UI.
- Trigger deploy: via Netlify MCP or git push (CI build).

## Vercel
- Option 1: Convert Express to Vercel Node/Edge functions (api/ files). Map routes to /api/*.
- Option 2: Run the Express app via vercel-serverless (adapter) (TODO evaluate).
- Static assets: output dist/spa; configure vercel.json rewrites to functions for /api/* and serve SPA fallback.
- Env vars: configure per-environment.

## Post-deploy checklist
- [ ] All env vars present
- [ ] CORS ALLOWED_ORIGINS set to production origin(s)
- [ ] Chat POST works and returns products
- [ ] Woo endpoints return 200 and cache with ETag
- [ ] CSP allows required connect-src (Supabase, Algolia, OpenAI)
