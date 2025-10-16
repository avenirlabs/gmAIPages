/**
 * Async Telemetry Service for Vercel API (Consolidated Handler)
 *
 * Fire-and-forget logging that doesn't block API responses.
 * Logs all search interactions to Supabase for analytics.
 *
 * Performance: 0ms impact on user-facing response time
 * Compatible with: Existing Express TypeScript telemetry service
 */

/**
 * Log chat event asynchronously (fire-and-forget)
 *
 * IMPORTANT: This function intentionally does NOT return a promise.
 * Call it AFTER sending the response to the user.
 *
 * @param {object} params - Event parameters
 * @param {object} params.supabase - Supabase client instance
 * @param {string} params.sessionId - Unique session identifier (UUID)
 * @param {string} params.userText - User's search query
 * @param {string} params.aiReply - AI-generated response text
 * @param {string} params.algoliaQuery - Actual Algolia search query executed
 * @param {string[]} params.chips - Refinement chips shown to user
 * @param {string[]} params.tags - Applied hashtag filters
 * @param {number} params.productsCount - Number of products returned
 * @param {string[]} params.productIds - Array of product IDs shown
 * @param {number} params.latencyMs - Total request latency in milliseconds
 * @param {string|null} params.ip - User IP address (PII - respects DISABLE_PII_LOGGING)
 * @param {string|null} params.ua - User agent string (PII - respects DISABLE_PII_LOGGING)
 * @param {string|null} params.country - User country code (PII - respects DISABLE_PII_LOGGING)
 * @param {string|null} params.city - User city (PII - respects DISABLE_PII_LOGGING)
 * @param {number} params.page - Current page number (1-based)
 * @param {number} params.pageSize - Results per page
 * @param {number} params.totalResults - Total available results from Algolia
 * @param {boolean} params.nextCursorExists - Whether more pages are available
 * @param {number} params.returnedCount - Actual products returned (may differ from productsCount)
 * @param {boolean} params.zeroHits - True if no results found
 * @param {boolean} params.intentTokenUsed - Whether cached intent was reused
 * @param {object|null} params.appliedFilters - Facet filters applied (stored as JSONB)
 * @param {boolean} params.broadened - Whether results were broadened from strict filters
 */
export function logChatEventAsync(params) {
  // Fire-and-forget: execute async function without awaiting
  // This allows the API response to be sent immediately
  (async () => {
    const sb = params.supabase;
    if (!sb) {
      // Supabase not configured - skip logging silently
      return;
    }

    try {
      // Check privacy setting
      const piiDisabled = String(process.env.DISABLE_PII_LOGGING || 'false').toLowerCase() === 'true';

      // Step 1: Ensure conversation exists (upsert by session_id)
      // This matches the TypeScript implementation in server/services/telemetry.ts
      const { data: conv, error: convError } = await sb
        .from('conversations')
        .upsert(
          { session_id: params.sessionId },
          { onConflict: 'session_id', ignoreDuplicates: false }
        )
        .select('id')
        .single();

      if (convError) {
        console.warn('[Telemetry] Conversation upsert failed:', convError.message);
        return;
      }

      const conversation_id = conv?.id;

      if (!conversation_id) {
        console.warn('[Telemetry] No conversation ID returned from upsert');
        return;
      }

      // Step 2: Insert message record with all analytics fields
      const { error: msgError } = await sb.from('messages').insert({
        conversation_id,
        role: 'assistant',
        user_text: params.userText,
        ai_reply: params.aiReply,
        algolia_query: params.algoliaQuery,
        chips: params.chips || [],
        filters: params.tags || [],
        products_count: params.productsCount,
        product_ids: params.productIds || [],
        latency_ms: params.latencyMs,
        // PII fields (nulled if DISABLE_PII_LOGGING=true)
        user_id: null, // Not tracked in widget (no auth)
        ip: piiDisabled ? null : params.ip,
        ua: piiDisabled ? null : params.ua,
        country: piiDisabled ? null : params.country,
        city: piiDisabled ? null : params.city,
        // New analytics fields (added in migration)
        page: params.page || 1,
        page_size: params.pageSize || 12,
        total_results: params.totalResults || 0,
        next_cursor_exists: params.nextCursorExists || false,
        returned_count: params.returnedCount || 0,
        zero_hits: params.zeroHits || false,
        fallback_suggestions: params.fallbackSuggestions || null,
        intent_token_used: params.intentTokenUsed || false,
        applied_filters: params.appliedFilters ? JSON.stringify(params.appliedFilters) : null,
        broadened: params.broadened || false,
      });

      if (msgError) {
        console.warn('[Telemetry] Message insert failed:', msgError.message);
      }

    } catch (error) {
      // Best-effort logging: fail silently, don't break the API
      console.warn('[Telemetry] Async logging error:', error.message);
    }
  })();
}

/**
 * Extract telemetry data from request headers
 *
 * @param {object} req - Vercel request object
 * @returns {object} Telemetry metadata
 */
export function extractTelemetryMetadata(req) {
  // Extract IP address (Vercel-specific headers)
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? forwarded.split(',')[0].trim() : null;

  // User agent
  const ua = req.headers['user-agent'] || null;

  // Geolocation (Vercel edge headers)
  const country = req.headers['x-vercel-ip-country'] || null;
  const city = req.headers['x-vercel-ip-city'] || null;

  // Session ID (sent by client or generated)
  const sessionId = req.headers['x-session-id'] || null;

  return { ip, ua, country, city, sessionId };
}

/**
 * Privacy-focused telemetry helper
 *
 * Returns sanitized metadata based on DISABLE_PII_LOGGING setting
 */
export function getPrivacyCompliantMetadata(req) {
  const piiDisabled = String(process.env.DISABLE_PII_LOGGING || 'false').toLowerCase() === 'true';

  if (piiDisabled) {
    // No PII - return nulls
    return {
      ip: null,
      ua: null,
      country: null,
      city: null,
      sessionId: req.headers['x-session-id'] || null, // Session ID is okay
    };
  }

  // Full telemetry
  return extractTelemetryMetadata(req);
}
