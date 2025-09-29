# gmAIPages - Gift Search API

## Environment Variables

Required for Algolia v5 integration:
```bash
ALGOLIA_APP_ID=your_app_id
ALGOLIA_API_KEY=your_search_key
ALGOLIA_INDEX_NAME=your_index_name
ALGOLIA_ADMIN_KEY=your_admin_key  # Only for scripts/algolia-ensure-settings.ts
```

## Key Commands

```bash
# Development
npm run dev              # Start local dev server

# Algolia Health
npm run health:algolia:local     # Check Algolia connection

# Deployment
git push origin master           # Auto-deploy to Vercel

# Type Check
npm run typecheck               # Verify TypeScript
```

## Architecture Notes

- **Algolia v5**: Uses `import { algoliasearch }` and `client.searchSingleIndex()`
- **ESM imports**: Use `.js` extensions for NodeNext compatibility
- **API**: `/api/gifts/chat` - filterable search with pagination
- **Production**: REQUIRE_ALGOLIA=true prevents mock data

## Release Tags

- `v1.0.0` - First stable release with Algolia v5 + filterable search