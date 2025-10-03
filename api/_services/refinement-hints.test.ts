import { describe, it, expect } from "vitest";
import { collectHintsFromTags } from "./refinement-hints.js";

describe("refinement-hints resolver", () => {
  it("returns empty hints when no tags provided", () => {
    const hints = collectHintsFromTags([]);
    expect(hints.queryTerms).toEqual([]);
    expect(hints.optionalFilters).toEqual([]);
    expect(hints.strictFilters).toEqual([]);
  });

  it("collects query terms for cooking persona", () => {
    const hints = collectHintsFromTags(["cooking"]);
    expect(hints.queryTerms).toContain("apron");
    expect(hints.queryTerms).toContain("kitchen");
    expect(hints.queryTerms).toContain("chef");
    expect(hints.queryTerms.length).toBeGreaterThan(0);
  });

  it("collects optional filters for cooking persona", () => {
    const hints = collectHintsFromTags(["cooking", "kitchen"]);
    // Should have at least the category and collection filter groups
    expect(hints.optionalFilters.length).toBeGreaterThan(0);

    // Flatten to check individual filters
    const allFilters = hints.optionalFilters.flat();
    expect(allFilters.some(f => f.includes("category:"))).toBe(true);
  });

  it("deduplicates hints when multiple personas share tags", () => {
    // Both dad_cooking and mom_cooking have "cooking" tag
    const hints = collectHintsFromTags(["cooking", "kitchen", "chef"]);

    // Query terms should be deduped (no duplicates in Set)
    const uniqueTerms = new Set(hints.queryTerms);
    expect(hints.queryTerms.length).toBe(uniqueTerms.size);

    // Should merge hints from both personas
    expect(hints.queryTerms.length).toBeGreaterThan(0);
  });

  it("collects hints for whisky persona", () => {
    const hints = collectHintsFromTags(["whisky", "barware"]);
    expect(hints.queryTerms).toContain("whiskey");
    expect(hints.queryTerms).toContain("glass");
    expect(hints.queryTerms).toContain("decanter");
  });

  it("merges hints from multiple personas", () => {
    // Select both cooking and whisky personas
    const hints = collectHintsFromTags(["cooking", "whisky"]);

    // Should have terms from both
    expect(hints.queryTerms).toContain("apron"); // from cooking
    expect(hints.queryTerms).toContain("whiskey"); // from whisky

    // Should have filters from both
    expect(hints.optionalFilters.length).toBeGreaterThan(1);
  });

  it("handles fallback persona hints", () => {
    const hints = collectHintsFromTags(["personalized"]);
    expect(hints.queryTerms).toContain("custom");
    expect(hints.queryTerms).toContain("engraved");
  });

  it("is case-insensitive for tag matching", () => {
    const hints1 = collectHintsFromTags(["COOKING"]);
    const hints2 = collectHintsFromTags(["cooking"]);
    expect(hints1.queryTerms).toEqual(hints2.queryTerms);
  });
});
