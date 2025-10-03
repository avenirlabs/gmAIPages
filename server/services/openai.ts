import OpenAI from "openai";

export interface ParsedNLPResult {
  searchQuery: string;
  refineChips: string[];
  filters: string[];
  replyBlurb: string;
  intentToken?: string;
}

const BASE_CHIPS = [
  "Birthday",
  "Anniversary",
  "Under ₹500",
  "Under ₹1000",
  "Cooking",
  "Gym",
  "Makeup",
  "Tech",
];

const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

import type { ChatTurn } from "@shared/api";

// Intent token helpers for pagination without re-processing
export function createIntentToken(result: ParsedNLPResult): string {
  const tokenData = {
    searchQuery: result.searchQuery,
    refineChips: result.refineChips,
    filters: result.filters,
    replyBlurb: result.replyBlurb,
    timestamp: Date.now()
  };
  return Buffer.from(JSON.stringify(tokenData)).toString('base64');
}

export function decodeIntentToken(token: string): ParsedNLPResult | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    // Validate token is not too old (1 hour max)
    if (Date.now() - decoded.timestamp > 3600000) {
      return null;
    }
    return {
      searchQuery: decoded.searchQuery,
      refineChips: decoded.refineChips || [],
      filters: decoded.filters || [],
      replyBlurb: decoded.replyBlurb,
      intentToken: token
    };
  } catch {
    return null;
  }
}

export async function parseUserQueryWithIntentToken(
  message: string,
  selectedRefinements: string[] = [],
  history: ChatTurn[] = [],
  intentToken?: string,
): Promise<ParsedNLPResult> {
  // If intent token provided and valid, reuse it
  if (intentToken) {
    const decoded = decodeIntentToken(intentToken);
    if (decoded) {
      return {
        ...decoded,
        // Update filters with current selectedRefinements if provided
        filters: selectedRefinements.length > 0 ? selectedRefinements : decoded.filters
      };
    }
  }

  // Otherwise, perform fresh OpenAI parsing
  const result = await parseUserQueryWithOpenAI(message, selectedRefinements, history);
  result.intentToken = createIntentToken(result);
  return result;
}

export async function parseUserQueryWithOpenAI(
  message: string,
  selectedRefinements: string[] = [],
  history: ChatTurn[] = [],
): Promise<ParsedNLPResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return heuristicParse(message, selectedRefinements, history);
  }

  const openai = new OpenAI({ apiKey });

  const system = `You are a gift-finding assistant. Analyze the user's message and return STRICT JSON with fields: \n
  - searchQuery: concise keywords to search a product index (max 8 words)\n
  - refineChips: a list of up to 8 short facet suggestions to further narrow the gift (e.g. occasion, recipient traits, interests, budget like 'under $50')\n
  - filters: optional list of facet-like strings derived from the user's message and selectedRefinements\n
  - replyBlurb: a friendly, short sentence acknowledging and summarizing what you'll search for.\n
  Keep JSON minimal. Do not include backticks. Examples of refine chips: ['Birthday', 'Anniversary', 'Cooking', 'Gym', 'Makeup', 'Tech', 'Under ₹500', 'Eco-friendly'].`;

  const contextText = history
    .filter((t) => t.role === "user")
    .map((t) => t.content)
    .slice(-3)
    .join(" \n ");
  const user = JSON.stringify({
    message,
    selectedRefinements,
    context: contextText,
  });

  try {
    const { withTimeout } = await import("../utils/async.js");
    const resp = await withTimeout(
      openai.responses.create({
        model: OPENAI_MODEL,
        input: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.4,
        max_output_tokens: 400,
        response_format: { type: "json_object" },
      } as any),
      3500,
      async () => ({ output_text: "{}" }) as any,
    );

    const text = (resp as any).output_text || "{}";
    const parsed = JSON.parse(text);
    const chips = new Set<string>(
      Array.isArray(parsed.refineChips) ? parsed.refineChips : [],
    );
    for (const c of BASE_CHIPS) chips.add(c);

    return {
      searchQuery: String(parsed.searchQuery || message).slice(0, 120),
      refineChips: Array.from(chips).slice(0, 8),
      // Only apply explicit user-selected refinements as filters to avoid over-filtering
      filters: Array.isArray(parsed.filters)
        ? (parsed.filters as string[])
            .filter((f) => selectedRefinements.includes(f))
            .slice(0, 10)
        : selectedRefinements.slice(0, 10),
      replyBlurb: String(parsed.replyBlurb || "Here's what I found for you."),
    };
  } catch (e) {
    return heuristicParse(message, selectedRefinements, history);
  }
}

export function heuristicParse(
  message: string,
  selectedRefinements: string[],
  history: ChatTurn[] = [],
): ParsedNLPResult {
  const lower = message.toLowerCase();
  const historyText = history
    .filter((t) => t.role === "user")
    .map((t) => t.content.toLowerCase())
    .join(" ");
  const chips = new Set<string>(BASE_CHIPS);
  if (/(sister|mom|mother|wife|girlfriend)/.test(lower + " " + historyText))
    chips.add("For her");
  if (/(brother|dad|father|husband|boyfriend)/.test(lower + " " + historyText))
    chips.add("For him");
  if (/(gym|fitness)/.test(lower)) chips.add("Gym");
  if (/(cook|kitchen|chef)/.test(lower)) chips.add("Cooking");
  if (/(makeup|beauty|skincare)/.test(lower)) chips.add("Makeup");
  if (/(tech|gadget)/.test(lower)) chips.add("Tech");
  if (/(eco|sustainable)/.test(lower)) chips.add("Eco-friendly");
  if (/(under|below).*\$?50|500/.test(lower)) chips.add("Under ₹500");
  if (/(under|below).*\$?100|1000/.test(lower)) chips.add("Under ₹1000");

  // Use ONLY the current message for the search query, not history
  // History is used above for chip detection context, but should not append to the query
  const base = lower.trim();
  const keywords = base
    .replace(/for\s+(my|a|the)\s+/g, " ")
    .replace(/gift[s]?\s+for\s+/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 10)
    .join(" ");

  return {
    searchQuery: keywords.length ? keywords : message,
    refineChips: Array.from(chips).slice(0, 8),
    // Only user-selected chips become filters
    filters: selectedRefinements.slice(0, 10),
    replyBlurb: "Let me look for some great options.",
  };
}
