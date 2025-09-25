# Environment Variables

| Key | Scope | Required | Description |
| --- | --- | --- | --- |
| VITE_SUPABASE_URL | client | yes | Supabase project URL (public) |
| VITE_SUPABASE_ANON_KEY | client | yes | Supabase anon key (public) |
| SUPABASE_URL | server | yes | Supabase URL for server SDK |
| SUPABASE_SERVICE_ROLE | server | yes | Service role key (server-only). RLS must remain ON. |
| OPENAI_API_KEY | server | optional | Enables LLM parsing; otherwise heuristic fallback used |
| OPENAI_MODEL | server | optional | Defaults to gpt-4o-mini |
| ALGOLIA_APP_ID | server | yes | Algolia App ID |
| ALGOLIA_API_KEY | server | yes | Algolia Search key (server) |
| ALGOLIA_INDEX_NAME | server | yes | Index name (e.g., gmProducts) |
| WOOCOMMERCE_BASE_URL | server | yes | Base URL to Woo store |
| WOOCOMMERCE_CONSUMER_KEY | server | yes | Woo API key |
| WOOCOMMERCE_CONSUMER_SECRET | server | yes | Woo API secret |
| ALLOWED_ORIGINS | server | recommended | Comma-separated origin allowlist for CORS (e.g., https://gifts-guru-ai.netlify.app) |
| PING_MESSAGE | server | optional | /api/ping response override |
| DISABLE_PII_LOGGING | server | optional | true to strip IP/UA/country/city logging |

Notes
- Client-side env vars must be prefixed with VITE_.
- Never expose SUPABASE_SERVICE_ROLE, Woo secrets, or OpenAI key to client.
