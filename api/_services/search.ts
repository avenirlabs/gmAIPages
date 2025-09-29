// api/_services/search.ts
// Use the Node build explicitly to avoid dist/browser resolution
import { algoliasearch } from 'algoliasearch/dist/node';

type Cursor = string | null;

const encodeCursor = (page: number | null) => page == null ? null : Buffer.from(String(page)).toString('base64');

const decodeCursor = (cursor: Cursor | undefined) => {
  try {
    return cursor ? Number(Buffer.from(cursor, 'base64').toString('utf8')) : 0;
  } catch {
    return 0;
  }
};

const getIndex = () => {
  const appId = process.env.ALGOLIA_APP_ID;
  const apiKey = process.env.ALGOLIA_API_KEY;
  const indexName = process.env.ALGOLIA_INDEX_NAME;
  if (!appId || !apiKey || !indexName) return null;

  const client = algoliasearch(appId, apiKey);
  if (typeof (client as any)?.initIndex !== 'function') {
    console.error('[algolia] invalid client – missing initIndex', { keys: Object.keys(client || {}) });
    throw new Error('Algolia client misconfigured: expected Node build (dist/node) with initIndex');
  }
  const index = client.initIndex(indexName);
  return { index, indexName };
};

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

function buildAlgoliaParams(q: string, opts: SearchOpts) {
  const pageSize = Math.max(1, Math.min(50, opts.topK ?? 10));
  const page = Math.max(0, decodeCursor(opts.cursor));
  const facetFilters: string[][] = [];
  const numericFilters: string[] = [];

  const rel = opts.filters?.relation ?? [];
  const occ = opts.filters?.occasion ?? [];
  const intr = opts.filters?.interest ?? [];
  if (rel.length)   facetFilters.push(rel.map(v => `relation:${v}`));
  if (occ.length)   facetFilters.push(occ.map(v => `occasion:${v}`));
  if (intr.length)  facetFilters.push(intr.map(v => `interest:${v}`));
  if (opts.filters?.priceRange && opts.filters.priceRange.length === 2) {
    const [min, max] = opts.filters.priceRange;
    if (Number.isFinite(min)) numericFilters.push(`price>=${Number(min)}`);
    if (Number.isFinite(max)) numericFilters.push(`price<=${Number(max)}`);
  }

  return {
    query: q,
    page,
    hitsPerPage: pageSize,
    facetFilters: facetFilters.length ? facetFilters : undefined,
    numericFilters: numericFilters.length ? numericFilters : undefined,
    attributesToRetrieve: [
      'objectID','title','name','product_title','heading','url','permalink','slug','handle',
      'image','images','thumbnail','price','currency','description','relation','occasion','interest'
    ],
  } as const;
}

export async function searchProductsPaginated(q: string, opts: SearchOpts = {}) {
  const start = Date.now();
  const cfg = getIndex();
  if (!cfg) {
    return {
      products: [] as any[],
      facets: {},
      pageInfo: {
        total: 0,
        pageSize: opts.topK ?? 10,
        page: 0,
        totalPages: 0,
        nextCursor: null as Cursor,
        prevCursor: null as Cursor,
        hasMore: false,
        cursor: null as Cursor
      },
      timings: { queryLatencyMs: Date.now() - start, source: 'stub' as const },
      broadened: false
    };
  }

  // Run strict query first (unless opts.soft === true)
  const strictParams = buildAlgoliaParams(q, opts);
  let res = await cfg.index.search(strictParams.query, strictParams);
  let broadened = false;

  // If no hits and not explicitly soft, try soft fallback (remove filters)
  if (res.nbHits === 0 && opts.soft !== true && (strictParams.facetFilters || strictParams.numericFilters)) {
    const softParams = { ...strictParams };
    delete softParams.facetFilters;
    delete softParams.numericFilters;
    res = await cfg.index.search(softParams.query, softParams);
    broadened = true;
  }

  const mapHit = (h: any) => {
    const title = h.title || h.name || h.product_title || h.heading || String(h.objectID);
    const url = h.url || h.permalink || (h.slug ? `/products/${h.slug}` : (h.handle ? `/products/${h.handle}` : `/products/${h.objectID}`));
    const image = h.image || (Array.isArray(h.images) ? h.images[0] : null) || h.thumbnail || null;
    const price = (typeof h.price === 'number' || typeof h.price === 'string') ? Number(h.price) : undefined;
    return {
      id: String(h.objectID),
      title,
      url,
      image,
      price,
      currency: h.currency || undefined,
      description: h.description || title,
    };
  };

  const products = (res.hits || []).map(mapHit);
  const total = res.nbHits ?? products.length;
  const totalPages = res.nbPages ?? Math.ceil(total / strictParams.hitsPerPage);
  const hasMore = strictParams.page + 1 < totalPages;

  return {
    products,
    facets: res.facets || {},
    pageInfo: {
      total,
      pageSize: strictParams.hitsPerPage,
      page: strictParams.page,
      totalPages,
      cursor: encodeCursor(strictParams.page),
      nextCursor: hasMore ? encodeCursor(strictParams.page + 1) : null,
      prevCursor: strictParams.page > 0 ? encodeCursor(strictParams.page - 1) : null,
      hasMore
    },
    timings: { queryLatencyMs: Date.now() - start, source: 'algolia' as const },
    broadened
  };
}