// api/_services/search.ts
import { algoliasearch } from 'algoliasearch';

type Cursor = string | null;

const encodeCursor = (page: number | null) => page == null ? null : Buffer.from(String(page)).toString('base64');

const decodeCursor = (cursor: Cursor | undefined) => {
  try {
    return cursor ? Number(Buffer.from(cursor, 'base64').toString('utf8')) : 0;
  } catch {
    return 0;
  }
};

function getClient() {
  const appId = process.env.ALGOLIA_APP_ID;
  const apiKey = process.env.ALGOLIA_API_KEY;
  const indexName = process.env.ALGOLIA_INDEX_NAME;
  if (!appId || !apiKey || !indexName) return null;
  const client = algoliasearch(appId, apiKey);
  return { client, indexName };
}

export type SearchOpts = {
  topK?: number;
  cursor?: Cursor;
  filters?: {
    relation?: string[];   // e.g., ['Dad','Brother']
    occasion?: string[];   // e.g., ['Birthday','Anniversary']
    interest?: string[];   // e.g., ['Gamer','Foodie']
    priceRange?: [number, number] | null; // e.g., [499, 1499]
  };
  soft?: boolean; // when true, relaxes filters
};

function buildParams(q: string, {
  topK, cursor, filters
}: { topK?: number; cursor?: Cursor; filters?: {
  relation?: string[]; occasion?: string[]; interest?: string[]; priceRange?: [number, number] | null;
}}) {
  const pageSize = Math.max(1, Math.min(50, topK ?? 10));
  const page = Math.max(0, decodeCursor(cursor));
  const facetFilters: string[][] = [];
  const numericFilters: string[] = [];

  const rel = filters?.relation ?? [];
  const occ = filters?.occasion ?? [];
  const intr = filters?.interest ?? [];
  if (rel.length) facetFilters.push(rel.map(v => `relation:${v}`));
  if (occ.length) facetFilters.push(occ.map(v => `occasion:${v}`));
  if (intr.length) facetFilters.push(intr.map(v => `interest:${v}`));

  if (filters?.priceRange && filters.priceRange.length === 2) {
    const [min, max] = filters.priceRange;
    if (Number.isFinite(min)) numericFilters.push(`price>=${Number(min)}`);
    if (Number.isFinite(max)) numericFilters.push(`price<=${Number(max)}`);
  }

  return {
    hitsPerPage: pageSize,
    page,
    facetFilters: facetFilters.length ? facetFilters : undefined,
    numericFilters: numericFilters.length ? numericFilters : undefined,
    attributesToRetrieve: [
      'objectID','title','name','product_title','heading','url','permalink','slug','handle',
      'image','images','thumbnail','price','currency','description','relation','occasion','interest'
    ],
    query: q
  } as const;
}

export async function searchProductsPaginated(q: string, opts: {
  topK?: number; cursor?: Cursor; filters?: {
    relation?: string[]; occasion?: string[]; interest?: string[]; priceRange?: [number, number] | null;
  }; soft?: boolean;
} = {}) {
  const start = Date.now();
  const cfg = getClient();
  if (!cfg) {
    return {
      products: [] as any[],
      facets: {},
      pageInfo: { total: 0, pageSize: opts.topK ?? 10, page: 0, totalPages: 0, nextCursor: null as Cursor, prevCursor: null as Cursor, hasMore: false, cursor: null as Cursor },
      timings: { queryLatencyMs: Date.now() - start, source: 'stub' as const },
      broadened: false
    };
  }

  const { client, indexName } = cfg;

  const strictParams = buildParams(q, { topK: opts.topK, cursor: opts.cursor, filters: opts.filters });
  const strictRes = await client.searchSingleIndex({
    indexName,
    searchParams: strictParams
  });

  let res = strictRes;
  let broadened = false;

  // Soft fallback if 0 hits and soft is not explicitly true
  if ((strictRes.nbHits ?? 0) === 0 && opts.soft !== true) {
    const softParams = { ...strictParams, facetFilters: undefined, numericFilters: undefined };
    const softRes = await client.searchSingleIndex({
      indexName,
      searchParams: softParams
    });
    res = softRes;
    broadened = (softRes.nbHits ?? 0) > 0;
  }

  const hits = res.hits ?? [];
  const mapHit = (h: any) => {
    const title = h.title || h.name || h.product_title || h.heading || String(h.objectID);
    const url = h.url || h.permalink || (h.slug ? `/products/${h.slug}` : (h.handle ? `/products/${h.handle}` : `/products/${h.objectID}`));
    const image = h.image || (Array.isArray(h.images) ? h.images[0] : null) || h.thumbnail || null;
    const price = (typeof h.price === 'number' || typeof h.price === 'string') ? Number(h.price) : undefined;
    return { id: String(h.objectID), title, url, image, price, currency: h.currency || undefined, description: h.description || title };
  };

  const products = hits.map(mapHit);
  const total = res.nbHits ?? products.length;
  const pageSize = strictParams.hitsPerPage;
  const page = strictParams.page;
  const totalPages = res.nbPages ?? Math.ceil(total / pageSize);
  const hasMore = page + 1 < totalPages;

  return {
    products,
    facets: res.facets || {},
    pageInfo: {
      total, pageSize, page, totalPages,
      cursor: encodeCursor(page),
      nextCursor: hasMore ? encodeCursor(page + 1) : null,
      prevCursor: page > 0 ? encodeCursor(page - 1) : null,
      hasMore
    },
    timings: { queryLatencyMs: Date.now() - start, source: 'algolia' as const },
    broadened
  };
}