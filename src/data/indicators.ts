import type { IndicatorDefinition, IndicatorId } from "@/types/domain";

export const INDICATORS: IndicatorDefinition[] = [
  {
    id: "heart-rate",
    name: "Heart Rate",
    shortName: "Heart rate",
    unit: "bpm",
    valueKind: "number",
    decimals: 0,
    description: "Heartbeats per minute, recorded at rest shortly after waking.",
    howMeasured: "Simulated wearable chest-strap reading.",
    spaceContext:
      "In weightlessness, body fluids shift toward the upper body and the heart works differently, so crews track heart rate routinely.",
    bodyRegions: ["chest"],
  },
  {
    id: "blood-pressure",
    name: "Blood Pressure",
    shortName: "Blood pressure",
    unit: "mmHg",
    valueKind: "pressure",
    decimals: 0,
    description: "Systolic and diastolic arterial pressure, recorded seated each morning.",
    howMeasured: "Simulated automated upper-arm cuff reading.",
    spaceContext:
      "Fluid redistribution in microgravity changes how blood pressure is regulated, especially when returning to gravity.",
    bodyRegions: ["chest", "arms"],
  },
  {
    id: "blood-sugar",
    name: "Blood Sugar",
    shortName: "Blood sugar",
    unit: "mg/dL",
    valueKind: "number",
    decimals: 0,
    description: "Blood glucose concentration from a morning sample before breakfast.",
    howMeasured: "Simulated finger-stick glucometer reading.",
    spaceContext:
      "Diet, exercise schedules and shifted sleep cycles on a mission can all shape day-to-day glucose patterns.",
    bodyRegions: ["abdomen", "arms"],
  },
  {
    id: "body-temperature",
    name: "Body Temperature",
    shortName: "Temperature",
    unit: "°C",
    valueKind: "number",
    decimals: 1,
    description: "Body temperature recorded at the start of each working day.",
    howMeasured: "Simulated temporal (forehead) thermometer reading.",
    spaceContext:
      "Without convection in weightlessness, the body sheds heat less efficiently, so temperature is tracked over the mission.",
    bodyRegions: ["head"],
  },
  {
    id: "sleep",
    name: "Daily Sleep Hours",
    shortName: "Sleep",
    unit: "h",
    valueKind: "number",
    decimals: 1,
    description: "Total sleep recorded during the previous rest period.",
    howMeasured: "Simulated wrist actigraphy estimate.",
    spaceContext:
      "Without a natural day–night cycle, sleep is shaped by lighting, workload and schedule shifts.",
    bodyRegions: ["head"],
  },
  {
    id: "mood",
    name: "Mood",
    shortName: "Mood",
    unit: null,
    valueKind: "scale",
    decimals: 0,
    description: "Self-reported mood on a five-point scale, logged once per day.",
    howMeasured: "Simulated daily check-in entry.",
    spaceContext:
      "Isolation, confinement and heavy workload make regular mood check-ins a standard part of crew wellbeing support.",
    bodyRegions: ["head"],
  },
];

export const MOOD_LABELS: Record<number, string> = {
  1: "Very low",
  2: "Low",
  3: "Neutral",
  4: "Good",
  5: "Very good",
};

export function getIndicator(id: string): IndicatorDefinition | undefined {
  return INDICATORS.find((i) => i.id === id);
}

export function isIndicatorId(id: string): id is IndicatorId {
  return INDICATORS.some((i) => i.id === id);
}
