import type { Taxonomy, Persona } from "../types/taxonomy";

// Lightweight in-bundle JSON import (Vite supports JSON imports)
import taxonomyJson from "../../data/taxonomy.json";

const taxonomy: Taxonomy = taxonomyJson as Taxonomy;

export interface RefinementContext {
  // raw user query or selected chip e.g. "gifts for dad who loves cooking"
  query: string;
  // optional explicit relation from upstream (if you parse relation elsewhere)
  relationHint?: string;
  // max chips to return
  limit?: number;
}

/**
 * Heuristically infer a relation key from the query/hint using aliases.
 */
export function detectRelationKey(query: string, hint?: string): string | null {
  const q = (hint || query).toLowerCase();
  // exact keys first
  for (const key of Object.keys(taxonomy.relations)) {
    if (q.includes(key)) return key;
  }
  // alias match
  for (const [key, rel] of Object.entries(taxonomy.relations)) {
    if (rel.aliases.some(a => q.includes(a.toLowerCase()))) return key;
  }
  return null;
}

/**
 * Return personas for the detected relation; fall back to generic personas.
 */
export function getRefinementChips(ctx: RefinementContext): Persona[] {
  const { query, relationHint, limit = 8 } = ctx;
  const relKey = detectRelationKey(query, relationHint || undefined);
  let personas: Persona[] | null = null;

  if (relKey && taxonomy.relations[relKey]) {
    personas = taxonomy.relations[relKey].personas;
  }

  const list = (personas && personas.length ? personas : taxonomy.fallback).slice(0, limit);

  // de-dup by id just in case
  const seen = new Set<string>();
  return list.filter(p => (seen.has(p.id) ? false : (seen.add(p.id), true)));
}

// --- Client-side helpers for managing tags in the input query ---

/** Extract hashtag tokens (lowercased, underscores preserved). */
export function extractTagsFromQuery(q: string): string[] {
  if (!q) return [];
  const re = /(^|\s)#([a-z0-9_]{2,40})\b/gi;
  const tags: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(q))) {
    const t = (m[2] || "").toLowerCase().replace(/_+/g, "_");
    if (t && !tags.includes(t)) tags.push(t);
  }
  return tags;
}

/** Remove a specific tag from a query string. */
export function removeTagFromQuery(q: string, tag: string): string {
  if (!q) return q;
  const t = tag.toLowerCase().replace(/_+/g, "_");
  // remove '#tag' with optional leading whitespace
  const re = new RegExp(`(^|\\s)#${t}\\b`, "gi");
  const stripped = q.replace(re, " ").replace(/\s{2,}/g, " ").trim();
  return stripped;
}

/** Remove all hashtag refinements from a query string. */
export function stripAllTags(q: string): string {
  if (!q) return q;
  return q.replace(/(^|\s)#[a-z0-9_]{2,40}\b/gi, " ").replace(/\s{2,}/g, " ").trim();
}

/** Add tags to a query, deduping and preserving order: base query first, then #tags */
export function addTagsToQuery(q: string, newTags: string[]): string {
  const base = stripAllTags(q);
  const existing = extractTagsFromQuery(q);
  const merged = [...existing];
  for (const raw of newTags) {
    const t = raw.toLowerCase().replace(/_+/g, "_");
    if (t && !merged.includes(t)) merged.push(t);
  }
  const suffix = merged.map(t => `#${t}`).join(" ");
  return [base.trim(), suffix].filter(Boolean).join(" ").trim();
}

/** Replace the whole tag set in a query (used when applying many chips at once). */
export function replaceAllTags(q: string, tags: string[]): string {
  const base = stripAllTags(q);
  const suffix = tags.map(t => `#${t.toLowerCase().replace(/_+/g, "_")}`).join(" ");
  return [base.trim(), suffix].filter(Boolean).join(" ").trim();
}
