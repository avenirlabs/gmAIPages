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

# Menu table mapping (server only)
| MENU_TBL | server | optional | Table name for menus (default: menus) |
| MENU_ITEMS_TBL | server | optional | Table name for menu items (default: menu_items) |
| MENU_COLS_TBL | server | optional | Table name for menu columns (default: menu_columns) |
| MENU_LINKS_TBL | server | optional | Table name for menu links (default: menu_links) |
| MENU_SITE_ID_COL | server | optional | Site ID column name (default: site_id) |
| MENU_ORDER_COL | server | optional | Order index column name (default: order_index) |

# Analytics table mapping (server only)
| ANALYTICS_EVENTS_TBL | server | optional | Analytics events table (default: analytics_events) |
| PRODUCTS_TBL | server | optional | Products table for metadata lookup (default: products) |
| TS_COL | server | optional | Timestamp column name (default: ts) |
| KIND_COL | server | optional | Event kind/type column (default: kind) |
| QUERY_COL | server | optional | Search query column (default: query) |
| PRODUCT_ID_COL | server | optional | Product ID column (default: product_id) |
| COUNTRY_COL | server | optional | Country column name (default: country) |
| CITY_COL | server | optional | City column name (default: city) |
| CHIP_COL | server | optional | Filter chip column (default: chip) |
| FILTER_KEY_COL | server | optional | Filter key column (default: filter_key) |
| FILTER_VALUE_COL | server | optional | Filter value column (default: filter_value) |
| DEPTH_COL | server | optional | Session depth column (default: depth) |
| QUALITY_COL | server | optional | Quality score column (default: quality) |

Notes
- Client-side env vars must be prefixed with VITE_.
- Never expose SUPABASE_SERVICE_ROLE, Woo secrets, or OpenAI key to client.
