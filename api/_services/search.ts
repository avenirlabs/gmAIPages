// api/_services/search.ts
import { algoliasearch } from 'algoliasearch';

type Cursor = string | null;

const encodeCursor = (page: number | null) => page == null ? null : Buffer.from(String(page)).toString('base64');

const decodeCursor = (cursor: Cursor) => {
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
  return { index: client.initIndex(indexName), indexName };
};

export type SearchOpts = {
  topK?: number;
  cursor?: Cursor;
  // reserved for next step:
  filters?: { relation?: string[]; occasion?: string[]; interest?: string[]; priceRange?: [number, number] };
  soft?: boolean;
};

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
      timings: { queryLatencyMs: Date.now() - start, source: 'stub' as const }
    };
  }

  const pageSize = Math.max(1, Math.min(50, opts.topK ?? 10));
  const page = Math.max(0, decodeCursor(opts.cursor));

  // (Filters soft/strict comes in next step; keep simple search now)
  const res = await cfg.index.search(q, {
    hitsPerPage: pageSize,
    page,
    attributesToRetrieve: ['objectID','title','name','product_title','heading','url','permalink','slug','handle','image','images','thumbnail','price','currency','description']
  });

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
  const totalPages = res.nbPages ?? Math.ceil(total / pageSize);
  const hasMore = page + 1 < totalPages;

  return {
    products,
    facets: res.facets || {},
    pageInfo: {
      total,
      pageSize,
      page,
      totalPages,
      cursor: encodeCursor(page),
      nextCursor: hasMore ? encodeCursor(page + 1) : null,
      prevCursor: page > 0 ? encodeCursor(page - 1) : null,
      hasMore
    },
    timings: { queryLatencyMs: Date.now() - start, source: 'algolia' as const }
  };
}