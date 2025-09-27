-- Create menus table for navigation editor system
-- This table stores the mega menu JSON configuration that can be edited via the admin interface

CREATE TABLE IF NOT EXISTS public.menus (
  slug TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_menus_slug ON public.menus(slug);
CREATE INDEX IF NOT EXISTS idx_menus_updated_at ON public.menus(updated_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to read menus
CREATE POLICY "Allow authenticated users to read menus" ON public.menus
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy for authenticated users to update menus
CREATE POLICY "Allow authenticated users to update menus" ON public.menus
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policy for anonymous users to read menus (for API access)
CREATE POLICY "Allow anonymous users to read menus" ON public.menus
  FOR SELECT
  TO anon
  USING (true);

-- Insert default navigation data
INSERT INTO public.menus (slug, data, created_at, updated_at)
VALUES (
  'main',
  '{
    "items": [
      {
        "type": "link",
        "label": "Home",
        "to": "/"
      },
      {
        "type": "mega",
        "label": "Shop",
        "columns": [
          {
            "heading": "By Relationship",
            "links": [
              { "label": "Gifts for Him", "to": "/gifts-him" },
              { "label": "Gifts for Her", "to": "/gifts-her" },
              { "label": "For Parents", "to": "/parents" },
              { "label": "For Kids", "to": "/kids" }
            ]
          },
          {
            "heading": "By Occasion",
            "links": [
              { "label": "Diwali Gifts", "to": "/diwali-gifts", "badge": "Trending" },
              { "label": "Birthday", "to": "/birthday" },
              { "label": "Anniversary", "to": "/anniversary" },
              { "label": "Housewarming", "to": "/housewarming" }
            ]
          },
          {
            "heading": "By Category",
            "links": [
              { "label": "Personalized", "to": "/personalized" },
              { "label": "Home & Decor", "to": "/home-decor" },
              { "label": "Office & Desk", "to": "/office-desk" },
              { "label": "Accessories", "to": "/accessories" }
            ]
          }
        ],
        "promo": {
          "title": "Corporate Gifting",
          "text": "Curated catalog, bulk pricing, brand-ready.",
          "to": "/corporate-gifts"
        }
      },
      {
        "type": "link",
        "label": "Corporate Gifts",
        "to": "/corporate-gifts"
      },
      {
        "type": "link",
        "label": "Diwali Gifts",
        "to": "/diwali-gifts"
      }
    ]
  }'::jsonb,
  NOW(),
  NOW()
)
ON CONFLICT (slug)
DO UPDATE SET
  data = EXCLUDED.data,
  updated_at = NOW();

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at on menu changes
DROP TRIGGER IF EXISTS update_menus_updated_at ON public.menus;
CREATE TRIGGER update_menus_updated_at
    BEFORE UPDATE ON public.menus
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.menus TO authenticated;
GRANT SELECT ON public.menus TO anon;

-- Add helpful comments
COMMENT ON TABLE public.menus IS 'Stores navigation menu configurations as JSON';
COMMENT ON COLUMN public.menus.slug IS 'Unique identifier for the menu (e.g., main, footer, mobile)';
COMMENT ON COLUMN public.menus.data IS 'JSON structure containing menu items, columns, and configuration';
COMMENT ON COLUMN public.menus.created_at IS 'Timestamp when the menu was first created';
COMMENT ON COLUMN public.menus.updated_at IS 'Timestamp when the menu was last modified (auto-updated)';