import type { AlertCategory, HazardId, IndicatorId } from "@/types/domain";

export interface IndicatorSeed {
  base: number;
  spread: number;
  /** Total change across the 30-day history (start → today). */
  drift?: number | undefined;
  secondaryBase?: number | undefined;
  secondarySpread?: number | undefined;
  missingDaysAgo?: number[] | undefined;
  unavailableReason?: string | undefined;
  device: string;
}

export interface HazardSeed {
  noFeedReason?: string | undefined;
  base?: number | undefined;
  spread?: number | undefined;
}

export interface AlertSeed {
  id: string;
  category: AlertCategory;
  title: string;
  message: string;
  daysAgo: number;
  hour: number;
  read: boolean;
  indicatorId?: IndicatorId | undefined;
  hazardId?: HazardId | undefined;
}

export interface AstronautSeed {
  indicators: Record<IndicatorId, IndicatorSeed>;
  hazards: Record<HazardId, HazardSeed>;
  distance: (daysAgo: number) => number;
  gravity: { value: number; label: string };
  alerts: AlertSeed[];
}

const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);

export const ASTRONAUT_SEEDS: Record<string, AstronautSeed> = {
  "AST-001": {
    indicators: {
      "heart-rate": { base: 62, spread: 4, drift: 3, device: "Chest strap HR-2 (simulated)" },
      "blood-pressure": {
        base: 116,
        spread: 5,
        secondaryBase: 74,
        secondarySpread: 4,
        device: "Arm cuff BP-1 (simulated)",
      },
      "blood-sugar": { base: 92, spread: 6, device: "Glucometer GL-3 (simulated)" },
      "body-temperature": { base: 36.8, spread: 0.2, device: "Temporal thermometer (simulated)" },
      sleep: { base: 7.1, spread: 0.6, drift: -1.1, device: "Wrist actigraph (simulated)" },
      mood: { base: 4, spread: 0.9, missingDaysAgo: [12, 19], device: "Daily check-in (simulated)" },
    },
    hazards: {
      radiation: { base: 1.3, spread: 0.15 },
      isolation: {},
      distance: {},
      gravity: {},
      "closed-environment": {
        noFeedReason: "The cabin air-quality feed for this outpost is not connected to ASTRA CARE yet.",
      },
    },
    // Halo orbit: distance oscillates over a ~6.5-day period.
    distance: (d) => Math.round(395_000 + 55_000 * Math.sin((2 * Math.PI * (d + 1.3)) / 6.5)),
    gravity: { value: 0, label: "Microgravity (lunar orbit)" },
    alerts: [
      {
        id: "AL-001-01",
        category: "health",
        title: "Sleep entries shorter than your 30-day average",
        message:
          "Your last five sleep entries were each shorter than your own 30-day average. This is a simulated pattern notice, not a medical finding.",
        daysAgo: 0,
        hour: 6,
        read: false,
        indicatorId: "sleep",
      },
      {
        id: "AL-001-02",
        category: "environment",
        title: "Solar particle event drill scheduled",
        message:
          "A simulated shelter-in-place drill is scheduled for mission day 48. Radiation dosimeter data will continue to be recorded.",
        daysAgo: 1,
        hour: 14,
        read: false,
        hazardId: "radiation",
      },
      {
        id: "AL-001-03",
        category: "system",
        title: "Cabin air-quality feed not connected",
        message:
          "ASTRA CARE has no cabin CO₂ data for this outpost. The closed-environment view will stay empty until a feed is connected.",
        daysAgo: 3,
        hour: 9,
        read: true,
        hazardId: "closed-environment",
      },
      {
        id: "AL-001-04",
        category: "health",
        title: "Mood check-in missed",
        message: "No mood entry was logged on two days this month. You can add an entry from the Mood page.",
        daysAgo: 12,
        hour: 20,
        read: true,
        indicatorId: "mood",
      },
      {
        id: "AL-001-05",
        category: "system",
        title: "Weekly summary ready",
        message: "Your simulated weekly health summary is available in Reports.",
        daysAgo: 0,
        hour: 5,
        read: false,
      },
    ],
  },
  "AST-002": {
    indicators: {
      "heart-rate": { base: 70, spread: 5, device: "Chest strap HR-2 (simulated)" },
      "blood-pressure": {
        base: 124,
        spread: 6,
        drift: -4,
        secondaryBase: 80,
        secondarySpread: 5,
        device: "Arm cuff BP-1 (simulated)",
      },
      "blood-sugar": {
        base: 0,
        spread: 0,
        unavailableReason: "No glucometer is paired to this profile for the current increment.",
        device: "Not paired",
      },
      "body-temperature": { base: 36.9, spread: 0.25, drift: 0.2, device: "Temporal thermometer (simulated)" },
      sleep: { base: 6.4, spread: 0.9, device: "Wrist actigraph (simulated)" },
      mood: { base: 3.6, spread: 1, device: "Daily check-in (simulated)" },
    },
    hazards: {
      radiation: { base: 0.5, spread: 0.08 },
      isolation: {},
      distance: {},
      gravity: {},
      "closed-environment": { base: 2600, spread: 350 },
    },
    distance: (d) => Math.round(410 + 6 * Math.sin(d * 1.7)),
    gravity: { value: 0, label: "Microgravity (low Earth orbit)" },
    alerts: [
      {
        id: "AL-002-01",
        category: "environment",
        title: "Cabin CO₂ higher than its 7-day average",
        message:
          "Today's simulated cabin CO₂ value is above the 7-day average for this module. Shown for awareness only.",
        daysAgo: 0,
        hour: 8,
        read: false,
        hazardId: "closed-environment",
      },
      {
        id: "AL-002-02",
        category: "system",
        title: "Glucometer not paired",
        message:
          "Blood sugar data is unavailable because no glucometer is paired to your profile. Pairing will be possible once device integration is built.",
        daysAgo: 2,
        hour: 10,
        read: false,
        indicatorId: "blood-sugar",
      },
      {
        id: "AL-002-03",
        category: "health",
        title: "Sleep varied more than usual this week",
        message:
          "Your sleep entries this week were more spread out than the week before. This is a simulated pattern notice.",
        daysAgo: 4,
        hour: 7,
        read: true,
        indicatorId: "sleep",
      },
      {
        id: "AL-002-04",
        category: "environment",
        title: "South Atlantic Anomaly pass logged",
        message: "Simulated dosimeter logged several passes through the South Atlantic Anomaly today.",
        daysAgo: 6,
        hour: 15,
        read: true,
        hazardId: "radiation",
      },
      {
        id: "AL-002-05",
        category: "system",
        title: "Weekly summary ready",
        message: "Your simulated weekly health summary is available in Reports.",
        daysAgo: 0,
        hour: 5,
        read: true,
      },
    ],
  },
  "AST-003": {
    indicators: {
      "heart-rate": { base: 66, spread: 4, device: "Chest strap HR-2 (simulated)" },
      "blood-pressure": {
        base: 112,
        spread: 5,
        secondaryBase: 70,
        secondarySpread: 4,
        device: "Arm cuff BP-1 (simulated)",
      },
      "blood-sugar": { base: 98, spread: 8, drift: 6, device: "Glucometer GL-3 (simulated)" },
      "body-temperature": {
        base: 37.0,
        spread: 0.2,
        missingDaysAgo: [0, 1, 2],
        device: "Temporal thermometer (simulated)",
      },
      sleep: { base: 7.4, spread: 0.5, device: "Wrist actigraph (simulated)" },
      mood: {
        base: 3.4,
        spread: 1.1,
        missingDaysAgo: [...range(3, 6), 15, 16, 22],
        device: "Daily check-in (simulated)",
      },
    },
    hazards: {
      radiation: { base: 1.8, spread: 0.2 },
      isolation: {},
      distance: {},
      gravity: {},
      "closed-environment": { base: 2200, spread: 250 },
    },
    // Outbound cruise: distance grows steadily.
    distance: (d) => Math.round(48_600_000 - d * 310_000),
    gravity: { value: 0, label: "Microgravity (interplanetary cruise)" },
    alerts: [
      {
        id: "AL-003-01",
        category: "health",
        title: "No temperature readings for 3 days",
        message:
          "ASTRA CARE has not received a body temperature reading for three days. This is a data-gap notice, not a health finding.",
        daysAgo: 0,
        hour: 7,
        read: false,
        indicatorId: "body-temperature",
      },
      {
        id: "AL-003-02",
        category: "environment",
        title: "Communication delay now above 2.5 minutes",
        message:
          "One-way signal delay to Earth on this simulated trajectory is now about 162 seconds. Ground replies will take over five minutes round-trip.",
        daysAgo: 1,
        hour: 12,
        read: false,
        hazardId: "distance",
      },
      {
        id: "AL-003-03",
        category: "health",
        title: "Mood check-ins missed",
        message: "Several mood check-ins are missing this month. You can add an entry from the Mood page.",
        daysAgo: 3,
        hour: 21,
        read: false,
        indicatorId: "mood",
      },
      {
        id: "AL-003-04",
        category: "environment",
        title: "Radiation dose logged above the 7-day average",
        message:
          "Yesterday's simulated dosimeter value was higher than the 7-day average on this trajectory. Shown for awareness only.",
        daysAgo: 5,
        hour: 9,
        read: true,
        hazardId: "radiation",
      },
      {
        id: "AL-003-05",
        category: "system",
        title: "Assessment engine not connected",
        message:
          "Assessments shown in ASTRA CARE are simulated. The future AI model has not been connected to this prototype.",
        daysAgo: 9,
        hour: 11,
        read: true,
      },
      {
        id: "AL-003-06",
        category: "system",
        title: "Weekly summary ready",
        message: "Your simulated weekly health summary is available in Reports.",
        daysAgo: 0,
        hour: 5,
        read: false,
      },
    ],
  },
};
