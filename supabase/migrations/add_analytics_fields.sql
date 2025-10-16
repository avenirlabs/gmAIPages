-- Migration: Add Analytics Fields to Messages Table
-- Date: 2025-10-15
-- Purpose: Add pagination, facets, and performance tracking fields for better analytics

-- Add new analytics fields to messages table
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS page INTEGER,
ADD COLUMN IF NOT EXISTS page_size INTEGER,
ADD COLUMN IF NOT EXISTS total_results INTEGER,
ADD COLUMN IF NOT EXISTS next_cursor_exists BOOLEAN,
ADD COLUMN IF NOT EXISTS returned_count INTEGER,
ADD COLUMN IF NOT EXISTS zero_hits BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS fallback_suggestions TEXT[],
ADD COLUMN IF NOT EXISTS intent_token_used BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS applied_filters JSONB,
ADD COLUMN IF NOT EXISTS broadened BOOLEAN DEFAULT false;

-- Add index for zero-hit queries (for analytics/monitoring)
CREATE INDEX IF NOT EXISTS idx_messages_zero_hits ON messages(zero_hits) WHERE zero_hits = true;

-- Add index for created_at DESC (for recent searches query)
CREATE INDEX IF NOT EXISTS idx_messages_created_desc ON messages(created_at DESC);

-- Add index for conversation_id (for session analysis)
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);

-- Add index for session_id on conversations (for faster lookups)
CREATE INDEX IF NOT EXISTS idx_conversations_session ON conversations(session_id);

-- Optional: Add comment for documentation
COMMENT ON COLUMN messages.page IS 'Current pagination page number (1-based)';
COMMENT ON COLUMN messages.page_size IS 'Number of results per page';
COMMENT ON COLUMN messages.total_results IS 'Total number of results available from Algolia';
COMMENT ON COLUMN messages.next_cursor_exists IS 'Whether more pages are available';
COMMENT ON COLUMN messages.returned_count IS 'Actual number of products returned';
COMMENT ON COLUMN messages.zero_hits IS 'True if no products were found';
COMMENT ON COLUMN messages.fallback_suggestions IS 'Suggested queries for zero-hit searches';
COMMENT ON COLUMN messages.intent_token_used IS 'Whether cached intent token was reused';
COMMENT ON COLUMN messages.applied_filters IS 'Facet filters applied as JSON object';
COMMENT ON COLUMN messages.broadened IS 'Whether results were broadened from strict filters';
