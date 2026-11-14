import { fmtNumber } from "@/lib/format";
import type { HazardDefinition, HazardSeries } from "@/types/domain";

/** Formats the latest value of a hazard series for display. */
export function hazardValue(def: HazardDefinition, s: HazardSeries): { value: string; unit: string } | null {
  if (s.status === "no-feed" || !s.latest) return null;
  const v = s.latest.value;
  switch (def.id) {
    case "distance":
      return v >= 1_000_000 ? { value: fmtNumber(v / 1_000_000, 1), unit: "million km" } : { value: fmtNumber(v), unit: "km" };
    case "gravity":
      return { value: "≈ 0", unit: "g" };
    case "isolation":
      return { value: fmtNumber(v), unit: "days" };
    case "radiation":
      return { value: fmtNumber(v, 2), unit: "mSv/day" };
    default:
      return { value: fmtNumber(v), unit: def.unit ?? "" };
  }
}
