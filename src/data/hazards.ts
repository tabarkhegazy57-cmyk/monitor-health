import type { HazardDefinition, HazardId } from "@/types/domain";

/** The five hazards of human spaceflight, kept separate from personal health data. */
export const HAZARDS: HazardDefinition[] = [
  {
    id: "radiation",
    name: "Space Radiation",
    shortName: "Radiation",
    unit: "mSv/day",
    metricLabel: "Daily dose from personal dosimeter",
    description:
      "Ionizing radiation from galactic cosmic rays and solar particle events. Beyond Earth's magnetic field, exposure increases.",
    whyItMatters:
      "Radiation exposure accumulates over a mission and is one of the main factors that limit how long crews can stay in space.",
  },
  {
    id: "isolation",
    name: "Isolation & Confinement",
    shortName: "Isolation",
    unit: "days",
    metricLabel: "Days in confinement this mission",
    description:
      "Living and working with a small crew in a confined habitat, far from family and familiar surroundings, for months at a time.",
    whyItMatters:
      "Long isolation can affect sleep, mood, workload perception and team dynamics, so it is tracked alongside the mission timeline.",
  },
  {
    id: "distance",
    name: "Distance from Earth",
    shortName: "Distance",
    unit: "km",
    metricLabel: "Distance from Earth along the mission trajectory",
    description:
      "The farther a crew travels, the longer messages take to arrive and the harder an emergency return becomes.",
    whyItMatters:
      "Distance decides how self-reliant a crew must be, including how quickly medical questions can be answered from the ground.",
  },
  {
    id: "gravity",
    name: "Gravity Fields",
    shortName: "Gravity",
    unit: "g",
    metricLabel: "Local gravity level",
    description:
      "Crews move between gravity fields: weightlessness in orbit and transit, partial gravity on the Moon (0.17 g) or Mars (0.38 g), and 1 g on return.",
    whyItMatters:
      "Changes in gravity affect balance, spatial orientation, bones, muscles and the way fluids are distributed in the body.",
  },
  {
    id: "closed-environment",
    name: "Hostile & Closed Environments",
    shortName: "Closed environment",
    unit: "ppm",
    metricLabel: "Cabin carbon dioxide concentration",
    description:
      "The spacecraft is the crew's entire ecosystem: air, temperature, noise, lighting and microbes are engineered and managed continuously.",
    whyItMatters:
      "Small changes in cabin air or habitat conditions can affect comfort, sleep and performance over a long mission.",
  },
];

export function getHazard(id: string): HazardDefinition | undefined {
  return HAZARDS.find((h) => h.id === id);
}

export function isHazardId(id: string): id is HazardId {
  return HAZARDS.some((h) => h.id === id);
}
