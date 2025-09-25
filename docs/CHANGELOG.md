# Changelog

## 2025-09-24
- Added TS strict mode (strict, strictNullChecks, noImplicitAny, noUncheckedIndexedAccess, noImplicitOverride) and CI tsconfig.
- Implemented CORS allowlist (ALLOWED_ORIGINS), body size limits, rate limiting, helmet/compression (optional), centralized error handler.
- Fixed chat API robustness (JSON parsing for string/Buffer, Node crypto import, endpoint fallbacks).
- Implemented WooCommerce TTL cache + ETag + zod param validation.
- Lazy Algolia import to avoid bundling issues.
- Added SEO utility to set title/description from Supabase page data.
- Wrote comprehensive docs suite under docs/ and updated README.md.
