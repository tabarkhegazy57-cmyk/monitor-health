import { ANATOMY_STRUCTURES } from "open-anatomy-3d";
import { describe, expect, it } from "vitest";

import { regionForStructure, structuresInRegion } from "./anatomy-regions";

describe("anatomy structure → explorer region", () => {
  it("maps every selectable structure in the model to a region", () => {
    const unmapped = ANATOMY_STRUCTURES.filter((s) => s.system !== "skin" && !regionForStructure(s.key));
    expect(unmapped.map((s) => s.key)).toEqual([]);
  });

  it("only lists structures that exist in the model", () => {
    const known = new Set(ANATOMY_STRUCTURES.map((s) => s.key));
    for (const region of ["head", "chest", "abdomen", "arms", "legs"] as const) {
      for (const key of structuresInRegion(region)) expect(known.has(key)).toBe(true);
    }
  });

  it("sends key organs to the panel region with their readings", () => {
    expect(regionForStructure("heart")).toBe("chest");
    expect(regionForStructure("brain")).toBe("head");
    expect(regionForStructure("pancreas")).toBe("abdomen");
    expect(regionForStructure("humerus_l")).toBe("arms");
    expect(regionForStructure("femur_r")).toBe("legs");
  });
});
