-- Add page tracking support for conversations
-- This allows tracking which pages drive the most chat sessions

-- Add page_slug column to conversations table
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS page_slug TEXT;

-- Create view for top pages driving chat sessions in last 30 days
CREATE OR REPLACE VIEW public.v_chat_top_pages_30d AS
SELECT
  COALESCE(NULLIF(page_slug,''), '(unknown)') AS page_slug,
  COUNT(DISTINCT id) AS sessions
FROM public.conversations
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY 1
ORDER BY sessions DESC
LIMIT 20;