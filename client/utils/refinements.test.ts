import { describe, it, expect } from "vitest";
import { detectRelationKey, getRefinementChips } from "./refinements";

describe("refinement resolver", () => {
  it("detects dad from query", () => {
    expect(detectRelationKey("best gifts for dad who loves running")).toBe("dad");
  });

  it("uses fallback if no relation", () => {
    const chips = getRefinementChips({ query: "anniversary ideas", limit: 3 });
    expect(chips.length).toBe(3);
  });

  it("accepts relationHint override", () => {
    expect(detectRelationKey("gift ideas", "sister")).toBe("sister");
  });
});
