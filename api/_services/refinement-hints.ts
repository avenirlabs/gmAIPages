/**
 * Refinement hints resolver
 *
 * Collects Algolia search hints (query expansion, optional filters) from selected persona tags.
 * Uses data/taxonomy.json to map tags to searchable hints.
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load taxonomy once at module init
const taxonomyPath = join(__dirname, "../../data/taxonomy.json");
const taxonomyJSON = readFileSync(taxonomyPath, "utf-8");
const taxonomy = JSON.parse(taxonomyJSON);

export interface SearchHints {
  queryTerms: string[];
  optionalFilters: string[][];
  strictFilters: string[][];
}

/**
 * Collects search hints from selected tags by merging hints from matching personas
 *
 * @param tags - Array of tags (e.g., ["cooking", "kitchen"])
 * @returns Merged hints with deduplicated arrays
 */
export function collectHintsFromTags(tags: string[]): SearchHints {
  if (!tags || tags.length === 0) {
    return { queryTerms: [], optionalFilters: [], strictFilters: [] };
  }

  // Normalize tags for matching
  const normalizedTags = tags.map(t => t.toLowerCase().trim());

  const mergedQueryTerms = new Set<string>();
  const mergedOptionalFilters: string[][] = [];
  const mergedStrictFilters: string[][] = [];

  // Helper to check if persona contains any of the tags
  const personaMatches = (persona: any): boolean => {
    const personaTags = (persona.tags || []).map((t: string) => t.toLowerCase().trim());
    return normalizedTags.some(tag => personaTags.includes(tag));
  };

  // Helper to merge hints from a persona
  const mergeHints = (persona: any) => {
    if (!persona.hints) return;

    const hints = persona.hints;

    // Merge queryTerms (dedupe with Set)
    if (Array.isArray(hints.queryTerms)) {
      hints.queryTerms.forEach((term: string) => mergedQueryTerms.add(term));
    }

    // Merge optionalFilters (dedupe groups)
    if (Array.isArray(hints.optionalFilters)) {
      hints.optionalFilters.forEach((group: string[]) => {
        // Check if this group already exists (by comparing stringified versions)
        const groupStr = JSON.stringify(group.slice().sort());
        const exists = mergedOptionalFilters.some(
          existing => JSON.stringify(existing.slice().sort()) === groupStr
        );
        if (!exists && group.length > 0) {
          mergedOptionalFilters.push([...group]);
        }
      });
    }

    // Merge strictFilters (dedupe groups)
    if (Array.isArray(hints.strictFilters)) {
      hints.strictFilters.forEach((group: string[]) => {
        const groupStr = JSON.stringify(group.slice().sort());
        const exists = mergedStrictFilters.some(
          existing => JSON.stringify(existing.slice().sort()) === groupStr
        );
        if (!exists && group.length > 0) {
          mergedStrictFilters.push([...group]);
        }
      });
    }
  };

  // Iterate through all relations and personas
  Object.values(taxonomy.relations || {}).forEach((relation: any) => {
    (relation.personas || []).forEach((persona: any) => {
      if (personaMatches(persona)) {
        mergeHints(persona);
      }
    });
  });

  // Also check fallback personas
  (taxonomy.fallback || []).forEach((persona: any) => {
    if (personaMatches(persona)) {
      mergeHints(persona);
    }
  });

  return {
    queryTerms: Array.from(mergedQueryTerms),
    optionalFilters: mergedOptionalFilters,
    strictFilters: mergedStrictFilters,
  };
}
