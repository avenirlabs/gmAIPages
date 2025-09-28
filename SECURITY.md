# Security Notice

## Environment Variable Exposure

**⚠️ IMPORTANT SECURITY NOTICE ⚠️**

This repository previously committed `.env` files containing sensitive credentials to version control. As of commit `[current]`, we have:

1. ✅ Added `.env` to `.gitignore`
2. ✅ Removed `.env` from git tracking
3. ✅ Created `.env.example` template

## Required Actions

**All exposed credentials must be rotated immediately:**

### Supabase
- Regenerate Service Role Key at: https://app.supabase.com/project/YOUR_PROJECT/settings/api
- Regenerate Anon Key (if needed)

### Algolia
- Rotate API Key at: https://dashboard.algolia.com/account/api-keys

### OpenAI
- Rotate API Key at: https://platform.openai.com/api-keys

### WooCommerce
- Regenerate Consumer Key/Secret at: WooCommerce → Settings → Advanced → REST API

## Best Practices

1. **Never commit secrets** - Always use `.env.example` templates
2. **Use environment variables** in production (Vercel, Netlify, etc.)
3. **Rotate credentials** regularly
4. **Review git history** before making repositories public

## Environment Setup

1. Copy `.env.example` to `.env`
2. Fill in your actual credentials
3. Never commit `.env` to version control

## Contact

If you believe credentials may have been compromised, contact the repository maintainers immediately.