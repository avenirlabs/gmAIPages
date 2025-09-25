import OpenAI from "openai";

export interface ParsedNLPResult {
  searchQuery: string;
  refineChips: string[];
  filters: string[];
  replyBlurb: string;
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

function heuristicParse(
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

  const base = ((historyText ? historyText + " " : "") + lower).trim();
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
