// scripts/algolia-health.ts
// Algolia index health check and settings inspection
// Use the Node build explicitly to avoid dist/browser resolution
import { algoliasearch } from 'algoliasearch/dist/node';

async function main() {
  try {
    // Check required environment variables
    const appId = process.env.ALGOLIA_APP_ID;
    const apiKey = process.env.ALGOLIA_API_KEY;
    const indexName = process.env.ALGOLIA_INDEX_NAME;

    if (!appId || !apiKey || !indexName) {
      console.error('Missing required environment variables: ALGOLIA_APP_ID, ALGOLIA_API_KEY, ALGOLIA_INDEX_NAME');
      process.exit(1);
    }

    // Connect to Algolia
    const client = algoliasearch(appId, apiKey);
    const index = client.initIndex(indexName);

    // Get index settings
    const settings = await index.getSettings();

    // Get sample data (first 3 hits)
    const searchResult = await index.search('', { hitsPerPage: 3 });

    // Whitelist sample fields
    const sampleData = (searchResult.hits || []).map((hit: any) => {
      const sample: any = {
        objectID: hit.objectID
      };

      // Add title field (try multiple variations)
      const title = hit.title || hit.name || hit.product_title || hit.heading;
      if (title) {
        sample['title|name'] = title;
      }

      // Add facet fields if they exist
      if (hit.relation) sample['relation?'] = hit.relation;
      if (hit.occasion) sample['occasion?'] = hit.occasion;
      if (hit.interest) sample['interest?'] = hit.interest;

      return sample;
    });

    // Create health report
    const healthReport = {
      ok: true,
      index: indexName,
      nbHits: searchResult.nbHits || 0,
      settings: {
        searchableAttributes: settings.searchableAttributes || [],
        attributesForFaceting: settings.attributesForFaceting || [],
        ranking: settings.ranking || []
      },
      sample: sampleData
    };

    console.log(JSON.stringify(healthReport, null, 2));
    process.exit(0);

  } catch (error) {
    console.error('Algolia API error:', error);
    process.exit(2);
  }
}

main();