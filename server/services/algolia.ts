import type { ProductItem } from "@shared/api";

let client: any = null;

// Weighted matching signals
const RELATION_WORDS = [
  "sister",
  "brother",
  "father",
  "dad",
  "mother",
  "mom",
  "wife",
  "husband",
  "girlfriend",
  "boyfriend",
  "for her",
  "for him",
  "women",
  "woman",
  "men",
  "man",
  "girls",
  "boys",
  "her",
  "him",
];
const OCCASION_WORDS = [
  "birthday",
  "anniversary",
  "diwali",
  "christmas",
  "valentine",
  "wedding",
  "engagement",
  "baby shower",
  "return gift",
  "return gifts",
];
const INTEREST_WORDS = [
  "cooking",
  "kitchen",
  "baking",
  "chef",
  "gym",
  "fitness",
  "yoga",
  "makeup",
  "beauty",
  "skincare",
  "tech",
  "gadget",
  "sports",
  "coffee",
  "tea",
  "music",
  "travel",
  "eco",
  "sustainable",
];

function extractSignals(base: string): {
  relations: string[];
  occasions: string[];
  interests: string[];
} {
  const lower = base.toLowerCase();
  const find = (arr: string[]) => arr.filter((w) => lower.includes(w));
  const relations = Array.from(new Set(find(RELATION_WORDS)));
  const occasions = Array.from(new Set(find(OCCASION_WORDS)));
  const interests = Array.from(new Set(find(INTEREST_WORDS)));
  return { relations, occasions, interests };
}

function weightedScore(
  hay: string,
  signals: { relations: string[]; occasions: string[]; interests: string[] },
): number {
  const lower = hay.toLowerCase();
  const hasAny = (list: string[]) => list.some((w) => lower.includes(w));
  const countMatches = (list: string[]) =>
    list.reduce((acc, w) => acc + (lower.includes(w) ? 1 : 0), 0);

  const relGiven = signals.relations.length > 0;
  const occGiven = signals.occasions.length > 0;
  const intGiven = signals.interests.length > 0;

  const relScore = relGiven ? (hasAny(signals.relations) ? 1 : 0) : 0;
  const occScore = occGiven ? (hasAny(signals.occasions) ? 1 : 0) : 0;
  const intScore = intGiven
    ? Math.min(
        1,
        countMatches(signals.interests) / Math.max(1, signals.interests.length),
      )
    : 0;

  return 0.5 * relScore + 0.3 * intScore + 0.2 * occScore;
}

async function getClient(): Promise<any> {
  const appId = process.env.ALGOLIA_APP_ID;
  const apiKey = process.env.ALGOLIA_API_KEY;
  if (!appId || !apiKey) return null;
  if (!client) {
    const mod: any = await import("algoliasearch");
    const ctor = mod.default ?? mod.algoliasearch;
    client = ctor(appId, apiKey);
  }
  return client;
}

export async function searchProducts(
  query: string,
  filters: string[] = [],
  limit = 12,
  context?: { chips?: string[] },
): Promise<ProductItem[]> {
  const c = await getClient();
  const indexName = process.env.ALGOLIA_INDEX_NAME;
  if (!c || !indexName) {
    return [];
  }

  const facetFilters = filters.filter((f) => /.+:.+/.test(f)).map((f) => [f]);
  const extraKeywords = filters.filter((f) => !/.+:.+/.test(f)).join(" ");
  const chipKeywords = (context?.chips ?? []).join(" ");
  const combinedQuery = [query, extraKeywords, chipKeywords]
    .filter(Boolean)
    .join(" ");
  const signals = extractSignals(combinedQuery);

  try {
    const { withTimeout } = await import("../utils/async.js");
    const res = await withTimeout(
      c.searchSingleIndex({
        indexName,
        searchParams: {
          query: combinedQuery,
          hitsPerPage: limit,
          attributesToRetrieve: [
            "objectID",
            "title",
            "name",
            "description",
            "price",
            "currency",
            "image",
            "url",
            "tags",
            "vendor",
          ],
          facetFilters: facetFilters.length ? (facetFilters as any) : undefined,
        },
      }),
      3500,
      async () => ({ hits: [] }) as any,
    );

    const hits = (res as any).hits ?? [];
    if (!hits.length) return [];

    return hits.map((h: any) => {
      const title = String(h.title ?? h.name ?? "");
      const desc = String(h.description ?? "");
      const tagsStr = Array.isArray(h.tags) ? (h.tags as any[]).join(" ") : "";
      const hay = `${title} ${desc} ${tagsStr}`;
      const wScore = weightedScore(hay, signals);

      return {
        id: String(h.objectID ?? h.id ?? h.url ?? Math.random()),
        title,
        description: h.description,
        price: typeof h.price === "number" ? h.price : undefined,
        currency: typeof h.currency === "string" ? h.currency : undefined,
        image: h.image,
        url: String(h.url ?? "#"),
        tags: Array.isArray(h.tags) ? (h.tags as string[]) : undefined,
        vendor: h.vendor,
        score: wScore,
      } as ProductItem;
    });
  } catch (e) {
    console.error("Algolia search failed", e);
    return [];
  }
}
