import { describe, it, expect } from "vitest";
import { parseQueryTags, tagScore } from "./refinements";

describe("refinements parser", () => {
  it("parses tags and strips them", () => {
    const { plainQuery, tags } = parseQueryTags("gifts for dad #cooking #kitchen #chef");
    expect(plainQuery).toBe("gifts for dad");
    expect(tags).toEqual(["cooking", "kitchen", "chef"]);
  });

  it("scores text against tags", () => {
    const s = tagScore("Premium kitchen chef knife set", ["cooking", "kitchen", "chef"]);
    expect(s).toBeGreaterThan(0);
  });

  it("handles queries without tags", () => {
    const { plainQuery, tags } = parseQueryTags("gifts for mom");
    expect(plainQuery).toBe("gifts for mom");
    expect(tags).toEqual([]);
  });

  it("normalizes underscores in tags", () => {
    const { plainQuery, tags } = parseQueryTags("gifts #self_care #spa");
    expect(plainQuery).toBe("gifts");
    expect(tags).toEqual(["self_care", "spa"]);
  });

  it("removes duplicate tags", () => {
    const { plainQuery, tags } = parseQueryTags("gifts #cooking #kitchen #cooking");
    expect(plainQuery).toBe("gifts");
    expect(tags).toEqual(["cooking", "kitchen"]);
  });

  it("handles empty or invalid input", () => {
    const { plainQuery, tags } = parseQueryTags("");
    expect(plainQuery).toBe("");
    expect(tags).toEqual([]);
  });
});
