import type { ProductItem, GiftFilters, FacetCounts } from "@shared/api";

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

function buildAlgoliaParams(
  filters: GiftFilters | undefined
): Pick<any, "facetFilters" | "numericFilters" | "optionalFilters" | "facets" | "sumOrFiltersScores"> {
  if (!filters) {
    return {
      facets: ["relationship", "occasion", "price_bucket"]
    };
  }

  const params: any = {
    facets: ["relationship", "occasion", "price_bucket"]
  };

  // Build facet/optional filters
  const facetFilters: string[][] = [];
  const optionalFilters: Array<{ facet: string; score: number }> = [];

  // Handle relationships
  if (filters.relationships?.length) {
    const relationshipFilters = filters.relationships.map(r => `relationship:${r.toLowerCase()}`);
    if (filters.soft) {
      relationshipFilters.forEach(filter => {
        optionalFilters.push({ facet: filter, score: 3 });
      });
    } else {
      facetFilters.push(relationshipFilters);
    }
  }

  // Handle occasions
  if (filters.occasions?.length) {
    const occasionFilters = filters.occasions.map(o => `occasion:${o.toLowerCase()}`);
    if (filters.soft) {
      occasionFilters.forEach(filter => {
        optionalFilters.push({ facet: filter, score: 2 });
      });
    } else {
      facetFilters.push(occasionFilters);
    }
  }

  // Handle categories
  if (filters.categories?.length) {
    const categoryFilters = filters.categories.map(c => `categories:${c}`);
    if (filters.soft) {
      categoryFilters.forEach(filter => {
        optionalFilters.push({ facet: filter, score: 1 });
      });
    } else {
      facetFilters.push(categoryFilters);
    }
  }

  // Handle price buckets
  if (filters.priceBuckets?.length) {
    const priceFilters = filters.priceBuckets.map(p => `price_bucket:${p}`);
    if (filters.soft) {
      priceFilters.forEach(filter => {
        optionalFilters.push({ facet: filter, score: 1 });
      });
    } else {
      facetFilters.push(priceFilters);
    }
  }

  // Handle price range (takes precedence over price buckets)
  if (filters.priceRange) {
    const numericFilters: string[] = [];
    if (filters.priceRange.min !== undefined) {
      numericFilters.push(`price >= ${filters.priceRange.min}`);
    }
    if (filters.priceRange.max !== undefined) {
      numericFilters.push(`price <= ${filters.priceRange.max}`);
    }
    if (numericFilters.length) {
      params.numericFilters = numericFilters;
    }
  }

  // Apply filters
  if (facetFilters.length) {
    params.facetFilters = facetFilters;
  }

  if (optionalFilters.length) {
    params.optionalFilters = optionalFilters;
    params.sumOrFiltersScores = true;
  }

  return params;
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

export interface AlgoliaSearchResult {
  products: ProductItem[];
  total: number;
  latencyMs: number;
  nextCursor?: string;
  prevCursor?: string;
  page: number;
  totalPages: number;
  facets?: FacetCounts;
}

export async function searchProductsPaginated(
  query: string,
  filters: string[] = [],
  limit = 12,
  context?: { chips?: string[]; page?: number; cursor?: string },
  giftFilters?: GiftFilters,
): Promise<AlgoliaSearchResult> {
  const c = await getClient();
  const indexName = process.env.ALGOLIA_INDEX_NAME;
  if (!c || !indexName) {
    return {
      products: [],
      total: 0,
      latencyMs: 0,
      page: 1,
      totalPages: 0
    };
  }

  // Parse pagination
  let currentPage = 1;
  if (context?.cursor) {
    const match = context.cursor.match(/^page:(\d+)$/);
    if (match) {
      currentPage = parseInt(match[1]);
    }
  } else if (context?.page && context.page > 0) {
    currentPage = context.page;
  }

  // Legacy filter support
  const legacyFacetFilters = filters.filter((f) => /.+:.+/.test(f)).map((f) => [f]);
  const extraKeywords = filters.filter((f) => !/.+:.+/.test(f)).join(" ");
  const chipKeywords = (context?.chips ?? []).join(" ");
  const combinedQuery = [query, extraKeywords, chipKeywords]
    .filter(Boolean)
    .join(" ");
  const signals = extractSignals(combinedQuery);

  // Build Algolia params from gift filters
  const algoliaParams = buildAlgoliaParams(giftFilters);

  try {
    const { withTimeout } = await import("../utils/async.js");
    const startTime = Date.now();
    const searchParams: any = {
      query: combinedQuery,
      hitsPerPage: limit,
      page: currentPage - 1, // Algolia uses 0-based pages
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
        "relationship", // Added for faceting
        "occasion", // Added for faceting
        "price_bucket", // Added for faceting
      ],
      ...algoliaParams,
    };

    // Combine with legacy facet filters if no gift filters are provided
    if (!giftFilters && legacyFacetFilters.length) {
      searchParams.facetFilters = legacyFacetFilters;
    }

    const res = await withTimeout(
      c.searchSingleIndex({
        indexName,
        searchParams,
      }),
      3500,
      async () => ({ hits: [], nbHits: 0, processingTimeMS: 0 }) as any,
    );

    const hits = (res as any).hits ?? [];
    const total = (res as any).nbHits ?? 0;
    const searchLatency = (res as any).processingTimeMS ?? 0;
    const totalLatencyMs = Date.now() - startTime;

    // Extract facet counts
    const facets: FacetCounts = {};
    if ((res as any).facets) {
      const algoliaFacets = (res as any).facets;
      if (algoliaFacets.relationship) {
        facets.relationship = algoliaFacets.relationship;
      }
      if (algoliaFacets.occasion) {
        facets.occasion = algoliaFacets.occasion;
      }
      if (algoliaFacets.price_bucket) {
        facets.price_bucket = algoliaFacets.price_bucket;
      }
      if (algoliaFacets.categories) {
        facets.categories = algoliaFacets.categories;
      }
    }

    if (!hits.length) {
      return {
        products: [],
        total,
        latencyMs: totalLatencyMs,
        page: currentPage,
        totalPages: Math.ceil(total / limit),
        facets
      };
    }

    const products = hits.map((h: any) => {
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

    const totalPages = Math.ceil(total / limit);
    const hasNext = currentPage < totalPages;
    const hasPrev = currentPage > 1;

    return {
      products,
      total,
      latencyMs: totalLatencyMs,
      page: currentPage,
      totalPages,
      facets,
      ...(hasNext && { nextCursor: `page:${currentPage + 1}` }),
      ...(hasPrev && { prevCursor: `page:${currentPage - 1}` })
    };
  } catch (e) {
    console.error("Algolia paginated search failed", e);
    return {
      products: [],
      total: 0,
      latencyMs: 0,
      page: currentPage,
      totalPages: 0,
      facets: {}
    };
  }
}

export async function searchProducts(
  query: string,
  filters: string[] = [],
  limit = 12,
  context?: { chips?: string[]; page?: number; cursor?: string },
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
