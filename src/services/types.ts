import type {
  Alert,
  Assessment,
  AstronautProfile,
  HazardSeries,
  IndicatorId,
  IndicatorSeries,
  NewReadingInput,
  Reading,
  Report,
} from "@/types/domain";

/**
 * Service contracts. Every method takes the session token and resolves the
 * astronaut from it — callers never pass an astronaut ID. A real backend
 * implementation must enforce the same rule server-side.
 */
export interface ProfileService {
  getProfile(token: string): Promise<AstronautProfile>;
}

export interface HealthService {
  listSeries(token: string): Promise<IndicatorSeries[]>;
  getSeries(token: string, indicatorId: IndicatorId): Promise<IndicatorSeries>;
  addReading(token: string, indicatorId: IndicatorId, input: NewReadingInput): Promise<Reading>;
}

export interface EnvironmentService {
  listHazards(token: string): Promise<HazardSeries[]>;
}

export interface AlertsService {
  listAlerts(token: string): Promise<Alert[]>;
  setRead(token: string, alertId: string, read: boolean): Promise<Alert>;
  markAllRead(token: string): Promise<void>;
}

export interface ReportsService {
  listReports(token: string): Promise<Report[]>;
  getReport(token: string, reportId: string): Promise<Report>;
}

export interface AssessmentService {
  listAssessments(token: string): Promise<Assessment[]>;
}

export interface ApiClient {
  profile: ProfileService;
  health: HealthService;
  environment: EnvironmentService;
  alerts: AlertsService;
  reports: ReportsService;
  assessments: AssessmentService;
}
