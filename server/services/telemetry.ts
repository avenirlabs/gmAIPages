import { getSupabaseAdmin } from "./supabase";

interface LogChatParams {
  sessionId: string;
  userText: string;
  aiReply: string;
  algoliaQuery: string;
  chips: string[];
  filters: string[];
  productsCount: number;
  productIds: string[];
  latencyMs: number;
  userId?: string | null;
  ip?: string | null;
  ua?: string | null;
  country?: string | null;
  city?: string | null;
}

export async function logChatEvent(params: LogChatParams) {
  const sb = getSupabaseAdmin();
  if (!sb) return; // not configured
  try {
    const piiDisabled =
      String(process.env.DISABLE_PII_LOGGING || "false").toLowerCase() ===
      "true";

    // Ensure conversation exists (by sessionId)
    const { data: conv } = await sb
      .from("conversations")
      .upsert({ session_id: params.sessionId }, { onConflict: "session_id" })
      .select("id")
      .single();

    const conversation_id = conv?.id;

    await sb.from("messages").insert({
      conversation_id,
      role: "assistant",
      user_text: params.userText,
      ai_reply: params.aiReply,
      algolia_query: params.algoliaQuery,
      chips: params.chips,
      filters: params.filters,
      products_count: params.productsCount,
      product_ids: params.productIds,
      latency_ms: params.latencyMs,
      user_id: piiDisabled ? null : (params.userId ?? null),
      ip: piiDisabled ? null : (params.ip ?? null),
      ua: piiDisabled ? null : (params.ua ?? null),
      country: piiDisabled ? null : (params.country ?? null),
      city: piiDisabled ? null : (params.city ?? null),
    });
  } catch (e) {
    // best-effort only
    console.warn("Supabase logChatEvent failed", e);
  }
}
