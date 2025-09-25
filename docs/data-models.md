# Data Models

Supabase tables (inferred; adjust to your project):

## pages
- id: uuid (pk)
- slug: text unique
- title: text
- page_description: text
- long_description: text (HTML)
- chips: text[]
- content: jsonb (e.g., { productGrid: { enabled, source, categorySlug, limit }})
- published: boolean
- is_home: boolean
- updated_at: timestamptz

## nav_links
- id: uuid (pk)
- label: text
- href: text
- position: int
- visible: boolean

## conversations
- id: uuid (pk)
- session_id: text unique
- created_at: timestamptz

## messages
- id: uuid (pk)
- conversation_id: uuid fk -> conversations.id
- role: text (assistant/user)
- user_text: text
- ai_reply: text
- algolia_query: text
- chips: text[]
- filters: text[]
- products_count: int
- product_ids: text[]
- latency_ms: int
- user_id: text null
- ip: text null
- ua: text null
- country: text null
- city: text null
- created_at: timestamptz

RLS (recommended)
- Enable RLS on all tables.
- Only allow service role to write conversations/messages. Read endpoints should be via server only.

TODO
- Provide SQL migrations or Supabase migration files for the above.
