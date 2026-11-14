import type { BodyRegionId, IndicatorId } from "@/types/domain";

export interface BodyRegionDefinition {
  id: BodyRegionId;
  name: string;
  description: string;
  indicatorIds: IndicatorId[];
  spaceNote: string;
}

/** Which monitored indicators are associated with each region of the 3D explorer. */
export const BODY_REGIONS: BodyRegionDefinition[] = [
  {
    id: "head",
    name: "Head & Brain",
    description: "Linked to temperature, sleep and mood entries in this explorer.",
    indicatorIds: ["body-temperature", "sleep", "mood"],
    spaceNote:
      "In weightlessness, fluids shift toward the head, which crews often describe as a 'puffy face' feeling.",
  },
  {
    id: "chest",
    name: "Chest & Heart",
    description: "Linked to heart rate and blood pressure readings.",
    indicatorIds: ["heart-rate", "blood-pressure"],
    spaceNote:
      "The heart no longer has to pump against gravity in orbit, so cardiovascular readings are followed through the mission.",
  },
  {
    id: "abdomen",
    name: "Abdomen",
    description: "Linked to blood sugar readings.",
    indicatorIds: ["blood-sugar"],
    spaceNote: "Meal timing and exercise schedules on board shape daily glucose patterns.",
  },
  {
    id: "arms",
    name: "Arms",
    description: "Measurement sites for the blood pressure cuff and finger-stick samples.",
    indicatorIds: ["blood-pressure", "blood-sugar"],
    spaceNote: "Upper-body strength is used constantly for moving and anchoring in weightlessness.",
  },
  {
    id: "legs",
    name: "Legs",
    description: "No monitored indicators are linked to this region yet.",
    indicatorIds: [],
    spaceNote:
      "Legs carry far less load in weightlessness, which is one reason crews exercise every day on a mission.",
  },
];

export function getBodyRegion(id: BodyRegionId): BodyRegionDefinition {
  const region = BODY_REGIONS.find((r) => r.id === id);
  if (!region) throw new Error(`Unknown body region ${id}`);
  return region;
}
