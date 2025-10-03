export type PersonaTag = string;

export interface PersonaHints {
  queryTerms: string[];
  mustTags: string[];
  optionalFilters: string[][];
  strictFilters: string[][];
}

export interface Persona {
  id: string;
  label: string;
  tags: PersonaTag[];
  hints?: PersonaHints;  // Step 7: Optional hints for Algolia search
}

export interface Relation {
  aliases: string[];
  personas: Persona[];
}

export interface Taxonomy {
  relations: Record<string, Relation>;
  fallback: Persona[];
}
