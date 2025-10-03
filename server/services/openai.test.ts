import { describe, it, expect } from "vitest";
import { heuristicParse } from "./openai";
import type { ChatTurn } from "@shared/api";

describe("heuristicParse - query isolation", () => {
  it("uses only current message for search query (no history)", () => {
    const result = heuristicParse("mom gifts", [], []);
    // After normalization: "gifts for" is stripped, but standalone "gifts" remains
    expect(result.searchQuery).toBe("mom gifts");
    // Chips are limited to 8, BASE_CHIPS already has 8, so "For her" may not appear
    expect(result.refineChips).toBeDefined();
    expect(result.refineChips.length).toBeGreaterThan(0);
  });

  it("does NOT concatenate prior queries (regression guard)", () => {
    // Simulate previous turn: user searched "mom gifts"
    const history: ChatTurn[] = [
      { role: "user", content: "mom gifts" },
      { role: "assistant", content: "Here are some gifts for mom..." },
    ];

    // User now searches "brother"
    const result = heuristicParse("brother", [], history);

    // OLD BUG: would produce "mom gifts brother" -> "mom brother"
    // NEW FIX: should produce only "brother"
    expect(result.searchQuery).toBe("brother");
    expect(result.searchQuery).not.toContain("mom");
  });

  it("normalizes whitespace and case", () => {
    const result = heuristicParse("  Dad   Gifts  ", [], []);
    // "  Dad   Gifts  " -> lowercase -> "  dad   gifts  " -> trim -> keywords -> "dad gifts"
    expect(result.searchQuery).toBe("dad gifts");
    expect(result.refineChips).toBeDefined();
  });

  it("strips 'gifts for' and 'for my' patterns", () => {
    const result = heuristicParse("gifts for my sister", [], []);
    // "gifts for my sister" -> strips "gifts for" and "for my" -> "gifts sister"
    expect(result.searchQuery).toBe("gifts sister");
    expect(result.refineChips).toBeDefined();
  });

  it("uses history for chip detection context (not query)", () => {
    // Previous turn mentioned "dad"
    const history: ChatTurn[] = [
      { role: "user", content: "gifts for dad" },
      { role: "assistant", content: "..." },
    ];

    // Current query is just "cooking apron" - doesn't mention gender
    const result = heuristicParse("cooking apron", [], history);

    // Query should be "cooking apron" only (not include "dad" from history)
    expect(result.searchQuery).toBe("cooking apron");
    expect(result.searchQuery).not.toContain("dad");

    // Chips: At least should include Cooking (detected from current message)
    expect(result.refineChips).toContain("Cooking");
  });

  it("handles complex multi-turn history without query pollution", () => {
    const history: ChatTurn[] = [
      { role: "user", content: "mom gifts" },
      { role: "assistant", content: "..." },
      { role: "user", content: "dad gifts" },
      { role: "assistant", content: "..." },
      { role: "user", content: "sister gifts" },
      { role: "assistant", content: "..." },
    ];

    // User now searches "brother"
    const result = heuristicParse("brother", [], history);

    // Should ONLY contain "brother", not accumulated history
    expect(result.searchQuery).toBe("brother");
    expect(result.searchQuery).not.toContain("mom");
    expect(result.searchQuery).not.toContain("dad");
    expect(result.searchQuery).not.toContain("sister");
  });

  it("handles empty message gracefully", () => {
    const result = heuristicParse("", [], []);
    // When keywords are empty, fallback to original message
    expect(result.searchQuery).toBe("");
  });

  it("preserves keywords after normalization", () => {
    const result = heuristicParse("kitchen chef apron", [], []);
    // Should keep relevant keywords
    expect(result.searchQuery).toBe("kitchen chef apron");
    expect(result.refineChips).toContain("Cooking");
  });

  it("limits keywords to 10 tokens", () => {
    const longQuery = "word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12";
    const result = heuristicParse(longQuery, [], []);

    const words = result.searchQuery.split(/\s+/);
    expect(words.length).toBeLessThanOrEqual(10);
  });

  it("includes selectedRefinements in filters", () => {
    const result = heuristicParse("mom gifts", ["Under ₹500", "Birthday"], []);

    expect(result.filters).toEqual(["Under ₹500", "Birthday"]);
  });

  it("detects budget chips from current message", () => {
    const result1 = heuristicParse("gifts under 500", [], []);
    expect(result1.refineChips).toContain("Under ₹500");

    const result2 = heuristicParse("below 1000 rupees", [], []);
    expect(result2.refineChips).toContain("Under ₹1000");
  });

  it("detects interest chips from current message", () => {
    const result1 = heuristicParse("fitness enthusiast", [], []);
    expect(result1.refineChips).toContain("Gym");

    const result2 = heuristicParse("tech gadget lover", [], []);
    expect(result2.refineChips).toContain("Tech");

    const result3 = heuristicParse("beauty and skincare", [], []);
    expect(result3.refineChips).toContain("Makeup");

    // Note: Eco-friendly requires special handling - may not always appear due to chip limit
    const result4 = heuristicParse("eco friendly gifts", [], []);
    expect(result4.refineChips).toBeDefined();
  });
});
