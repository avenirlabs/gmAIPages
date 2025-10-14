// Minimal, runtime-safe parser used by API to detect and strip #tags
export type ParsedQuery = {
  plainQuery: string;      // user query with tags removed
  tags: string[];          // normalized tags e.g. ["cooking","kitchen","chef"]
};

export function parseQueryTags(input: string): ParsedQuery {
  if (!input || typeof input !== "string") {
    return { plainQuery: "", tags: [] };
  }
  // match #tag_or_multiword (we already normalize spaces to underscores on client)
  const tagRe = /(^|\s)#([a-z0-9_]{2,40})\b/gi;
  const tags: string[] = [];
  let stripped = input;

  stripped = stripped.replace(tagRe, (_m, _pre, t) => {
    const norm = t.toLowerCase().replace(/_+/g, "_");
    if (!tags.includes(norm)) tags.push(norm);
    return ""; // remove from plain query
  });

  // Collapse whitespace & trim
  const plainQuery = stripped.replace(/\s{2,}/g, " ").trim();
  return { plainQuery, tags };
}

// Simple score helper for boosting any text field against tags
export function tagScore(text: string, tags: string[]): number {
  if (!text || !tags?.length) return 0;
  const hay = text.toLowerCase();
  let score = 0;
  for (const t of tags) {
    // score for exact tag token and for hyphen/space variants
    const asWord = t.replace(/_/g, " ");
    if (hay.includes(t)) score += 2;
    if (asWord !== t && hay.includes(asWord)) score += 2;
  }
  return score;
}
