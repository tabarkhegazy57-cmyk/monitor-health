import type { IndicatorDefinition, NewReadingInput } from "@/types/domain";

/**
 * Input checks for manually logged readings. These are data-entry sanity
 * checks (numbers, physical limits like 24 h in a day), not medical ranges.
 */
export function validateReadingInput(def: IndicatorDefinition, input: NewReadingInput): string | null {
  const { value, secondary } = input;
  if (!Number.isFinite(value)) return "Enter a number.";
  if (value <= 0) return "Enter a value greater than zero.";
  if (def.valueKind === "scale") {
    if (!Number.isInteger(value) || value < 1 || value > 5) return "Choose a mood from 1 to 5.";
  }
  if (def.id === "sleep" && value > 24) return "Sleep can't be more than 24 hours in a day.";
  if (def.valueKind === "pressure") {
    if (secondary === undefined || !Number.isFinite(secondary)) return "Enter the diastolic (lower) value.";
    if (secondary <= 0) return "Enter a diastolic value greater than zero.";
    if (secondary >= value) return "The systolic (upper) value must be higher than the diastolic value.";
  }
  if (input.note && input.note.length > 200) return "Keep the note under 200 characters.";
  return null;
}
