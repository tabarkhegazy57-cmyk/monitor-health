import { describe, expect, it } from "vitest";

import { getIndicator } from "@/data/indicators";

import { validateReadingInput } from "./validation";

const def = (id: string) => getIndicator(id)!;

describe("manual reading entry checks", () => {
  it("sleep cannot exceed 24 hours", () => {
    expect(validateReadingInput(def("sleep"), { value: 25 })).toMatch(/24 hours/);
    expect(validateReadingInput(def("sleep"), { value: 7.5 })).toBeNull();
  });

  it("mood must be a whole number from 1 to 5", () => {
    expect(validateReadingInput(def("mood"), { value: 6 })).toMatch(/1 to 5/);
    expect(validateReadingInput(def("mood"), { value: 3 })).toBeNull();
  });

  it("blood pressure needs a systolic value above the diastolic value", () => {
    expect(validateReadingInput(def("blood-pressure"), { value: 80, secondary: 120 })).toMatch(/higher/);
    expect(validateReadingInput(def("blood-pressure"), { value: 120 })).toMatch(/diastolic/);
    expect(validateReadingInput(def("blood-pressure"), { value: 120, secondary: 80 })).toBeNull();
  });
});
