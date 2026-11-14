import { Badge } from "@/components/ui/badge";
import type { PatternObservation } from "@/types/domain";

export const OBSERVATION_LABELS: Record<PatternObservation, string> = {
  stable: "Similar to last week",
  changed: "Average shifted",
  varied: "More variation",
  "insufficient-data": "Not enough data",
};

export function ObservationBadge({ observation }: { observation: PatternObservation }) {
  const variant = observation === "stable" ? "mint" : observation === "insufficient-data" ? "muted" : "coral";
  return <Badge variant={variant}>{OBSERVATION_LABELS[observation]}</Badge>;
}
