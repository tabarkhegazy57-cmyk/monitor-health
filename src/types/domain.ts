/** Domain models shared by services, mock data and UI. */

export type IndicatorId =
  | "heart-rate"
  | "blood-pressure"
  | "blood-sugar"
  | "body-temperature"
  | "sleep"
  | "mood";

export type HazardId = "radiation" | "isolation" | "distance" | "gravity" | "closed-environment";

export type BodyRegionId = "head" | "chest" | "abdomen" | "arms" | "legs";

export interface Astronaut {
  id: string;
  name: string;
  rank: string;
  role: string;
  agency: string;
  initials: string;
  bio: string;
  missionId: string;
}

export interface Mission {
  id: string;
  name: string;
  vehicle: string;
  destination: string;
  phase: string;
  launchDate: string;
  missionDay: number;
  plannedDurationDays: number;
  crewSize: number;
  summary: string;
  /** One-way signal delay in seconds; null when effectively real-time. */
  commDelaySeconds: number | null;
}

export interface AstronautProfile {
  astronaut: Astronaut;
  mission: Mission;
}

export type ReadingSource = "simulated" | "manual";

export interface Reading {
  id: string;
  timestamp: string;
  value: number;
  /** Diastolic value for blood pressure. */
  secondary?: number | undefined;
  source: ReadingSource;
  note?: string | undefined;
}

export interface IndicatorSeries {
  indicatorId: IndicatorId;
  status: "available" | "unavailable";
  unavailableReason?: string | undefined;
  device: string;
  readings: Reading[];
}

export interface IndicatorDefinition {
  id: IndicatorId;
  name: string;
  shortName: string;
  unit: string | null;
  valueKind: "number" | "pressure" | "scale";
  decimals: number;
  description: string;
  howMeasured: string;
  spaceContext: string;
  bodyRegions: BodyRegionId[];
}

export interface HazardDefinition {
  id: HazardId;
  name: string;
  shortName: string;
  unit: string | null;
  metricLabel: string;
  description: string;
  whyItMatters: string;
}

export interface HazardPoint {
  timestamp: string;
  value: number;
}

export interface HazardSeries {
  hazardId: HazardId;
  status: "simulated" | "no-feed";
  noFeedReason?: string | undefined;
  latest?: { value: number; timestamp: string; label?: string | undefined } | undefined;
  readings: HazardPoint[];
  context: { label: string; value: string }[];
}

export type AlertCategory = "health" | "environment" | "system";

export interface Alert {
  id: string;
  category: AlertCategory;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  indicatorId?: IndicatorId | undefined;
  hazardId?: HazardId | undefined;
}

export type ReportType = "daily" | "weekly" | "environment" | "assessment";

export interface ReportSection {
  heading: string;
  body: string;
}

export interface Report {
  id: string;
  type: ReportType;
  title: string;
  createdAt: string;
  periodStart: string;
  periodEnd: string;
  author: string;
  summary: string;
  sections: ReportSection[];
  indicatorIds: IndicatorId[];
  hazardIds: HazardId[];
}

export type PatternObservation = "stable" | "changed" | "varied" | "insufficient-data";

export interface AssessmentFinding {
  indicatorId: IndicatorId;
  observation: PatternObservation;
  pattern: string;
  detail: string;
}

export interface Assessment {
  id: string;
  createdAt: string;
  periodStart: string;
  periodEnd: string;
  source: string;
  modelVersion: string;
  overview: string;
  findings: AssessmentFinding[];
}

export interface Session {
  token: string;
  astronautId: string;
  issuedAt: string;
  expiresAt: string;
}

export interface NewReadingInput {
  value: number;
  secondary?: number | undefined;
  note?: string | undefined;
}
