# Service Setup Guide

This guide walks you through setting up all the required external services for Gifts Guru AI.

## Prerequisites

The application requires the following services to be fully functional:

- **Supabase** (Database & Auth) - Required
- **Algolia** (Product Search) - Required
- **WooCommerce** (E-commerce API) - Required
- **OpenAI** (AI Processing) - Optional (has fallback)

## 1. Supabase Setup

### Create a Supabase Project

1. Visit [Supabase](https://supabase.com) and create an account
2. Create a new project
3. Go to **Settings → API** in your project dashboard
4. Copy the following values to your `.env` file:
   - **Project URL** → `VITE_SUPABASE_URL` and `SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`
   - **service_role secret key** → `SUPABASE_SERVICE_ROLE`

### Create Database Tables

Run the following SQL in your Supabase SQL Editor:

```sql
-- Create pages table
CREATE TABLE pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT,
  page_description TEXT,
  long_description TEXT,
  chips TEXT[],
  content JSONB,
  published BOOLEAN DEFAULT false,
  is_home BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create nav_links table
CREATE TABLE nav_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL,
  href TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create conversations table
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create messages table
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  user_text TEXT,
  ai_reply TEXT,
  algolia_query TEXT,
  chips TEXT[],
  filters TEXT[],
  products_count INTEGER,
  product_ids TEXT[],
  latency_ms INTEGER,
  user_id TEXT,
  ip TEXT,
  ua TEXT,
  country TEXT,
  city TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies (Row Level Security)
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE nav_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Allow public read access to published pages and nav links
CREATE POLICY "Public pages access" ON pages FOR SELECT USING (published = true);
CREATE POLICY "Public nav access" ON nav_links FOR SELECT USING (visible = true);

-- Service role can do everything
CREATE POLICY "Service role full access" ON pages FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON nav_links FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON conversations FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON messages FOR ALL USING (auth.role() = 'service_role');
```

### Add Sample Data

```sql
-- Insert home page
INSERT INTO pages (slug, title, page_description, long_description, chips, content, published, is_home) VALUES
(
  'home',
  'Find the Perfect Gift with AI',
  'Discover personalized gift recommendations through natural conversation. Just tell us what you''re looking for!',
  '<h2>How It Works</h2><p>Our AI-powered gift finder makes discovering the perfect present effortless. Simply describe who you''re shopping for and what occasion you''re celebrating, and we''ll provide personalized recommendations from our curated collection.</p>',
  ARRAY['Birthday gifts', 'Anniversary gifts', 'Under $50', 'Under $100', 'For her', 'For him', 'Tech lovers', 'Home & garden'],
  '{"productGrid": {"enabled": true, "source": "featured", "limit": 12}}'::jsonb,
  true,
  true
);

-- Insert sample navigation
INSERT INTO nav_links (label, href, position, visible) VALUES
('Home', '/', 1, true),
('About', '/about', 2, true),
('Contact', '/contact', 3, true);
```

## 2. Algolia Setup

### Create an Algolia Account

1. Visit [Algolia](https://www.algolia.com) and create an account
2. Create a new application
3. Go to **API Keys** in your dashboard
4. Copy the following to your `.env` file:
   - **Application ID** → `ALGOLIA_APP_ID`
   - **Search-Only API Key** → `ALGOLIA_API_KEY`
   - **Index Name** (create one, e.g., "products") → `ALGOLIA_INDEX_NAME`

### Upload Product Data

You'll need to upload your product data to Algolia. The expected format:

```json
{
  "objectID": "product-123",
  "title": "Wireless Headphones",
  "description": "High-quality wireless headphones",
  "price": 99.99,
  "currency": "USD",
  "image": "https://example.com/headphones.jpg",
  "url": "https://store.com/headphones",
  "tags": ["electronics", "audio", "wireless"],
  "vendor": "TechBrand",
  "categories": ["Electronics", "Audio"]
}
```

## 3. WooCommerce Setup

### Configure WooCommerce REST API

1. In your WordPress admin, go to **WooCommerce → Settings → Advanced → REST API**
2. Click **Add Key**
3. Set permissions to **Read**
4. Copy the following to your `.env` file:
   - **Store URL** → `WOOCOMMERCE_BASE_URL`
   - **Consumer Key** → `WOOCOMMERCE_CONSUMER_KEY`
   - **Consumer Secret** → `WOOCOMMERCE_CONSUMER_SECRET`

## 4. OpenAI Setup (Optional)

### Get OpenAI API Key

1. Visit [OpenAI Platform](https://platform.openai.com)
2. Create an account and set up billing
3. Go to **API Keys** and create a new key
4. Add to your `.env` file:
   - **API Key** → `OPENAI_API_KEY`
   - **Model** → `OPENAI_MODEL` (default: gpt-4o-mini)

**Note:** If OpenAI is not configured, the app will use heuristic parsing as a fallback.

## 5. Environment Variables

After setting up all services, your `.env` file should look like this:

```env
# Copy from .env.example and fill in real values
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE=eyJ...

ALGOLIA_APP_ID=YourAppID
ALGOLIA_API_KEY=your-search-key
ALGOLIA_INDEX_NAME=products

WOOCOMMERCE_BASE_URL=https://yourstore.com
WOOCOMMERCE_CONSUMER_KEY=ck_...
WOOCOMMERCE_CONSUMER_SECRET=cs_...

OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

## 6. Test Your Setup

After configuring all services:

1. Restart your development server: `pnpm run dev`
2. Test the endpoints:
   ```bash
   curl http://localhost:8080/api/ping
   curl http://localhost:8080/api/pages/home
   curl http://localhost:8080/api/nav/links
   curl http://localhost:8080/api/woocommerce/products?source=featured
   ```

## Troubleshooting

### Common Issues

- **"No Supabase config"**: Check your Supabase environment variables
- **Empty product results**: Verify your Algolia index has data
- **CORS errors**: Make sure `ALLOWED_ORIGINS` includes your domain
- **WooCommerce errors**: Verify your store URL and API credentials

### Getting Help

- Check the [troubleshooting guide](./troubleshooting.md)
- Review the [API documentation](./api.md)
- Examine server logs for detailed error messages

## Production Deployment

For production:

1. Set all environment variables in your hosting provider
2. Enable RLS policies in Supabase
3. Use production API keys (not development/test keys)
4. Set `ALLOWED_ORIGINS` to your production domain(s)
5. Consider enabling `DISABLE_PII_LOGGING=true` for privacy