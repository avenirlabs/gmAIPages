# Security

- CORS: allowlist via ALLOWED_ORIGINS; credentials disabled by default.
- CSP: Netlify headers in netlify.toml enforce a strict policy; mirror via helmet when serving Node.
- Secrets: keep SUPABASE_SERVICE_ROLE, Woo keys, OpenAI key on server only.
- RLS: enable and restrict writes to service role for conversations/messages; read via server.
- Rate limiting: express-rate-limit on /api (60/min) and gifts chat (20/min).
- Body size: express.json({ limit: '1mb' }).
- Error handler: standardized { error, code } JSON.
- PII logging: controlled by DISABLE_PII_LOGGING=true (strips IP/UA/location).
- Dependencies: keep up-to-date; review CSP/connect-src for Supabase, Algolia, OpenAI, Woo.
- Secrets in CI: use provider secrets (Netlify/Vercel) and never commit.
