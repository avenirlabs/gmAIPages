# Deployment Checklist

## Required Vercel Environment Variables

Configure these environment variables in Vercel Dashboard → Project → Settings → Environment Variables for both **Production** and **Preview** environments:

### Required for Algolia Integration
- `ALGOLIA_APP_ID` - Your Algolia Application ID
- `ALGOLIA_API_KEY` - Search-Only API Key (never use Admin key)
- `ALGOLIA_INDEX_NAME` - Name of your products index (e.g., `gmProducts`)

### Optional Enhancements
- `OPENAI_API_KEY` - For AI-enhanced responses (falls back to stub if missing)
- `SUPABASE_URL` - For CMS functionality
- `SUPABASE_ANON_KEY` - Public Supabase key

### Additional Configuration
- `ALLOWED_ORIGINS` - CORS origins (comma-separated)
- `DISABLE_PII_LOGGING` - Set to `true` for privacy compliance

## Pre-Deploy Verification

✅ Local environment works with `node test-api-with-env.mjs`
✅ Diagnostics show all required variables as `true`
✅ Chat returns `source: 'algolia'` with real products
✅ All code changes committed and pushed

## Post-Deploy Testing

1. Run diagnostics: `npm run smoke:diag:prod`
2. Test chat: `npm run smoke:chat:prod`
3. Check Vercel logs for `[chat] { source: 'algolia' }` entries
4. Verify no `[algolia]` errors in logs

## Rollback Plan

If deployment fails:
1. Check Vercel environment variables are set correctly
2. Verify API keys have proper permissions
3. Check Vercel Functions logs for errors
4. Revert to previous deployment if needed