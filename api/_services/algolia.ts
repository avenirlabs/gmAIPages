import { algoliasearch } from 'algoliasearch';

interface AlgoliaHit {
  objectID: string;
  title?: string;
  name?: string;
  product_title?: string;
  heading?: string;
  url?: string;
  permalink?: string;
  slug?: string;
  handle?: string;
  image?: string;
  images?: string[];
  thumbnail?: string;
  _rankingInfo?: {
    nbExactWords?: number;
  };
  [key: string]: any;
}

interface MappedHit {
  id: string;
  title: string;
  url: string;
  image: string | null;
  score: number;
  reason: string;
  price?: number;
  currency?: string;
  description?: string;
}

interface AlgoliaSearchResult {
  source: 'algolia' | 'stub';
  results: MappedHit[];
}

/**
 * Get Algolia index if environment variables are configured
 * @returns Algolia index and name, or null if not configured
 */
export function getAlgoliaIndex() {
  try {
    const appId = process.env.ALGOLIA_APP_ID;
    const apiKey = process.env.ALGOLIA_API_KEY;
    const indexName = process.env.ALGOLIA_INDEX_NAME;

    if (!appId || !apiKey || !indexName) {
      return null;
    }

    const client = algoliasearch(appId, apiKey);
    const index = client.initIndex(indexName);

    return { index, indexName };
  } catch (error) {
    console.error('[algolia]', { msg: 'Failed to initialize', error: error?.message });
    return null;
  }
}

/**
 * Map Algolia hit to normalized product format
 * @param hit Raw Algolia search hit
 * @returns Normalized product object
 */
export function mapHit(hit: AlgoliaHit): MappedHit {
  // Defensive title extraction
  const title = hit.title ||
               hit.name ||
               hit.product_title ||
               hit.heading ||
               String(hit.objectID);

  // Defensive URL construction
  let url: string;
  if (hit.url) {
    url = hit.url;
  } else if (hit.permalink) {
    url = hit.permalink;
  } else if (hit.slug) {
    url = `/products/${hit.slug}`;
  } else if (hit.handle) {
    url = `/products/${hit.handle}`;
  } else {
    url = `/products/${hit.objectID}`;
  }

  // Defensive image extraction
  const image = hit.image ||
               hit.images?.[0] ||
               hit.thumbnail ||
               null;

  // Score from ranking info or fallback
  const score = hit._rankingInfo?.nbExactWords || 1;

  return {
    id: hit.objectID,
    title,
    url,
    image,
    score,
    reason: 'algolia match',
    price: hit.price ? Number(hit.price) : undefined,
    currency: hit.currency || 'USD',
    description: hit.description || title
  };
}

/**
 * Search Algolia index with query
 * @param q Search query
 * @param topK Maximum number of results
 * @returns Search results or stub fallback
 */
export async function searchAlgolia(q: string, topK: number = 10): Promise<AlgoliaSearchResult> {
  try {
    const algoliaConfig = getAlgoliaIndex();

    if (!algoliaConfig) {
      return { source: 'stub', results: [] };
    }

    const { index } = algoliaConfig;

    const searchResponse = await index.search(q, {
      hitsPerPage: topK
    });

    const results = searchResponse.hits.map(hit => mapHit(hit as AlgoliaHit));

    return {
      source: 'algolia',
      results
    };

  } catch (error) {
    console.error('[algolia]', { msg: error?.message });
    return { source: 'stub', results: [] };
  }
}