# Roadmap

Near-term
- [ ] Add ESLint + Prettier and GitHub Actions CI (lint, typecheck:ci, test)
- [ ] Add unit/component/API tests (see testing-ci.md)
- [ ] Add OG/Twitter meta generation and sitemap.xml
- [ ] Add small server-side cache for Algolia (15–30s) if needed
- [ ] Extract heuristic signal lists to config or Supabase table
- [ ] Add useChatSession hook to encapsulate history/session
- [ ] Improve code splitting for heavy components

Security & privacy
- [ ] Document Supabase RLS policies; provide migrations
- [ ] Add retention policy/cleanup job for PII (messages)

Performance
- [ ] Image dimensions on ProductCard for better CLS
- [ ] Evaluate CDN image optimization

Developer experience
- [ ] Create swagger-like API docs generation (OpenAPI) (optional)
- [ ] Add dev data seeding scripts for pages/nav_links
