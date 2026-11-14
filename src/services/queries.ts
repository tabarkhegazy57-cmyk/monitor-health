import { queryOptions } from "@tanstack/react-query";

import type { IndicatorId, Session } from "@/types/domain";

import { api } from "./api";

/** Query keys always include the astronaut ID so caches never mix profiles. */
export const keys = {
  profile: (s: Session) => ["profile", s.astronautId] as const,
  health: (s: Session) => ["health", s.astronautId] as const,
  series: (s: Session, id: IndicatorId) => ["health", s.astronautId, id] as const,
  hazards: (s: Session) => ["hazards", s.astronautId] as const,
  alerts: (s: Session) => ["alerts", s.astronautId] as const,
  reports: (s: Session) => ["reports", s.astronautId] as const,
  report: (s: Session, id: string) => ["reports", s.astronautId, id] as const,
  assessments: (s: Session) => ["assessments", s.astronautId] as const,
};

export const profileQuery = (s: Session) =>
  queryOptions({ queryKey: keys.profile(s), queryFn: () => api.profile.getProfile(s.token) });

export const healthQuery = (s: Session) =>
  queryOptions({ queryKey: keys.health(s), queryFn: () => api.health.listSeries(s.token) });

export const seriesQuery = (s: Session, id: IndicatorId) =>
  queryOptions({ queryKey: keys.series(s, id), queryFn: () => api.health.getSeries(s.token, id) });

export const hazardsQuery = (s: Session) =>
  queryOptions({ queryKey: keys.hazards(s), queryFn: () => api.environment.listHazards(s.token) });

export const alertsQuery = (s: Session) =>
  queryOptions({ queryKey: keys.alerts(s), queryFn: () => api.alerts.listAlerts(s.token) });

export const reportsQuery = (s: Session) =>
  queryOptions({ queryKey: keys.reports(s), queryFn: () => api.reports.listReports(s.token) });

export const reportQuery = (s: Session, id: string) =>
  queryOptions({ queryKey: keys.report(s, id), queryFn: () => api.reports.getReport(s.token, id) });

export const assessmentsQuery = (s: Session) =>
  queryOptions({ queryKey: keys.assessments(s), queryFn: () => api.assessments.listAssessments(s.token) });
