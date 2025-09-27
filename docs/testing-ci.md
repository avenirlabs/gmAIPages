# Testing & CI

Commands
- Unit tests: `pnpm test`
- Typecheck (local): `pnpm run typecheck`
- Typecheck (CI): `pnpm run typecheck:ci` (tsconfig.ci.json with skipLibCheck=false)

Suggested tests (Vitest)
- openai.heuristicParse: signal extraction, chip generation
- services/algolia.searchProducts: builds query with facetFilters; mock Algolia client
- routes/woocommerce: parameter validation (zod), ETag/TTL behavior
- ChatInterface: renders initial assistant turn; sends payload; renders ProductCard list

ESLint/Prettier (TODO)
- Add eslint (typescript-eslint, import, react-hooks) and prettier, enforce on PR.

CI (TODO)
- GitHub Actions / Netlify CI: run lint, typecheck:ci, test on PRs.
