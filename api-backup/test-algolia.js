// Test Algolia connection
export default async function handler(req, res) {
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    const appId = process.env.ALGOLIA_APP_ID;
    const apiKey = process.env.ALGOLIA_API_KEY;
    const indexName = process.env.ALGOLIA_INDEX_NAME || 'gmProducts';

    if (!appId || !apiKey) {
      return res.json({
        error: "Algolia credentials not configured",
        hasAppId: !!appId,
        hasApiKey: !!apiKey,
        appId: appId || 'missing',
        indexName
      });
    }

    try {
      // Dynamic import for algoliasearch using the correct pattern
      const mod = await import('algoliasearch');
      const ctor = mod.default ?? mod.algoliasearch;
      const client = ctor(appId, apiKey);
      const index = client.initIndex(indexName);

      // Test search
      const { hits, nbHits } = await index.search('test', {
        hitsPerPage: 1,
      });

      return res.json({
        success: true,
        appId,
        indexName,
        totalResults: nbHits,
        sampleHit: hits[0] ? {
          objectID: hits[0].objectID,
          name: hits[0].name,
          hasImage: !!hits[0].image,
          hasPrice: !!hits[0].price
        } : null
      });

    } catch (importError) {
      return res.json({
        error: "Failed to import algoliasearch",
        details: importError.message,
        appId,
        indexName
      });
    }

  } catch (error) {
    console.error('Algolia test error:', error);
    return res.json({
      error: error.message,
      stack: error.stack
    });
  }
}