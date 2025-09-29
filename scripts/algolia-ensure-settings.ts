// scripts/algolia-ensure-settings.ts
// Ensure Algolia index has proper settings for faceting and search
import algoliasearch from 'algoliasearch';

function uniq<T>(arr: T[]): T[] {
  return [...new Set(arr.filter(Boolean))];
}

async function main() {
  const appId = process.env.ALGOLIA_APP_ID;
  const indexName = process.env.ALGOLIA_INDEX_NAME;
  const adminKey = process.env.ALGOLIA_ADMIN_KEY; // ONLY for this script
  const APPLY = process.argv.includes('--apply');

  if (!appId || !indexName || !adminKey) {
    console.error('Missing ALGOLIA_APP_ID / ALGOLIA_INDEX_NAME / ALGOLIA_ADMIN_KEY');
    process.exit(1);
  }

  const client = algoliasearch(appId, adminKey);
  const index = client.initIndex(indexName);

  const current = await index.getSettings();
  const curFacets = current.attributesForFaceting ?? [];
  const curSearchable = current.searchableAttributes ?? [];
  const curRanking = current.ranking ?? [];

  // Compute recommended settings
  const wantFacets = uniq([...curFacets, 'relation', 'occasion', 'interest', 'price']);
  const wantSearchable = uniq(['title','name','product_title','heading','description', ...curSearchable]);
  const baselineRanking = ['typo','geo','words','filters','proximity','attribute','exact','custom'];
  const wantRanking = uniq([...baselineRanking, ...curRanking]);

  // Calculate diff
  const diff: Record<string, any> = {};
  if (JSON.stringify(curFacets.sort()) !== JSON.stringify(wantFacets.sort())) {
    diff.attributesForFaceting = wantFacets;
  }
  if (JSON.stringify(curSearchable) !== JSON.stringify(wantSearchable)) {
    diff.searchableAttributes = wantSearchable;
  }
  if (JSON.stringify(curRanking) !== JSON.stringify(wantRanking)) {
    diff.ranking = wantRanking;
  }

  const changed = Object.keys(diff).length > 0;

  console.log(JSON.stringify({
    ok: true,
    apply: APPLY,
    changed,
    diff,
    current: {
      attributesForFaceting: curFacets,
      searchableAttributes: curSearchable,
      ranking: curRanking
    },
    recommended: {
      attributesForFaceting: wantFacets,
      searchableAttributes: wantSearchable,
      ranking: wantRanking
    }
  }, null, 2));

  if (APPLY && changed) {
    await index.setSettings(diff);
    console.log('\nSettings applied. Fetching updated settings...\n');

    // Wait a moment for settings to propagate
    await new Promise(resolve => setTimeout(resolve, 1000));

    const after = await index.getSettings();
    console.log(JSON.stringify({
      ok: true,
      applied: true,
      after: {
        attributesForFaceting: after.attributesForFaceting,
        searchableAttributes: after.searchableAttributes,
        ranking: after.ranking
      }
    }, null, 2));
  } else if (APPLY && !changed) {
    console.log('\nNo changes needed. Settings are already optimal.');
  }

  process.exit(0);
}

main().catch(err => {
  console.error(JSON.stringify({
    ok: false,
    error: String(err?.message || err)
  }));
  process.exit(2);
});