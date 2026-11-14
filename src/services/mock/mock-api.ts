import { getIndicator } from "@/data/indicators";
import { MOCK_ASTRONAUTS, MOCK_MISSIONS } from "@/data/mock/astronauts";
import { getAstronautDataset } from "@/data/mock/generate";
import { round } from "@/lib/stats";
import type { Alert, IndicatorSeries, Reading } from "@/types/domain";

import { NotFoundError, ValidationError } from "../errors";
import type { ApiClient } from "../types";
import { validateReadingInput } from "../validation";
import { simulateLatency } from "./latency";
import { resolveAstronautId } from "./session-registry";
import { readJson, writeJson } from "./storage";

const readingsKey = (id: string) => `astra.mock.readings.${id}`;
const alertsKey = (id: string) => `astra.mock.alert-state.${id}`;

function manualReadings(astronautId: string): Record<string, Reading[]> {
  return readJson<Record<string, Reading[]>>(readingsKey(astronautId), {});
}

function withManual(astronautId: string, series: IndicatorSeries): IndicatorSeries {
  const extra = manualReadings(astronautId)[series.indicatorId] ?? [];
  if (extra.length === 0) return series;
  const readings = [...series.readings, ...extra].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  return { ...series, readings };
}

function alertsFor(astronautId: string): Alert[] {
  const overrides = readJson<Record<string, boolean>>(alertsKey(astronautId), {});
  return getAstronautDataset(astronautId).alerts.map((a) =>
    ({ ...a, read: overrides[a.id] ?? a.read }),
  );
}

/** Mock implementation of the API. Swap for an HTTP client when a backend exists. */
export const mockApi: ApiClient = {
  profile: {
    async getProfile(token) {
      await simulateLatency(200);
      const id = resolveAstronautId(token);
      const astronaut = MOCK_ASTRONAUTS.find((a) => a.id === id);
      const mission = MOCK_MISSIONS.find((m) => m.id === astronaut?.missionId);
      if (!astronaut || !mission) throw new NotFoundError("Profile not found.");
      return { astronaut, mission };
    },
  },
  health: {
    async listSeries(token) {
      await simulateLatency();
      const id = resolveAstronautId(token);
      return Object.values(getAstronautDataset(id).series).map((s) => withManual(id, s));
    },
    async getSeries(token, indicatorId) {
      await simulateLatency();
      const id = resolveAstronautId(token);
      const series = getAstronautDataset(id).series[indicatorId];
      if (!series) throw new NotFoundError("Indicator not found.");
      return withManual(id, series);
    },
    async addReading(token, indicatorId, input) {
      await simulateLatency(400);
      const id = resolveAstronautId(token);
      const def = getIndicator(indicatorId);
      if (!def) throw new NotFoundError("Indicator not found.");
      const series = getAstronautDataset(id).series[indicatorId];
      if (series.status === "unavailable") throw new ValidationError("This indicator has no data source.");
      const error = validateReadingInput(def, input);
      if (error) throw new ValidationError(error);
      const reading: Reading = {
        id: `manual-${indicatorId}-${Date.now()}`,
        timestamp: new Date().toISOString(),
        value: round(input.value, def.decimals),
        secondary: input.secondary !== undefined ? Math.round(input.secondary) : undefined,
        source: "manual",
        note: input.note?.trim() || undefined,
      };
      const all = manualReadings(id);
      writeJson(readingsKey(id), { ...all, [indicatorId]: [...(all[indicatorId] ?? []), reading] });
      return reading;
    },
  },
  environment: {
    async listHazards(token) {
      await simulateLatency();
      return getAstronautDataset(resolveAstronautId(token)).hazards;
    },
  },
  alerts: {
    async listAlerts(token) {
      await simulateLatency(200);
      return alertsFor(resolveAstronautId(token));
    },
    async setRead(token, alertId, read) {
      await simulateLatency(150);
      const id = resolveAstronautId(token);
      const alert = alertsFor(id).find((a) => a.id === alertId);
      if (!alert) throw new NotFoundError("Alert not found.");
      const overrides = readJson<Record<string, boolean>>(alertsKey(id), {});
      writeJson(alertsKey(id), { ...overrides, [alertId]: read });
      return { ...alert, read };
    },
    async markAllRead(token) {
      await simulateLatency(200);
      const id = resolveAstronautId(token);
      writeJson(alertsKey(id), Object.fromEntries(alertsFor(id).map((a) => [a.id, true])));
    },
  },
  reports: {
    async listReports(token) {
      await simulateLatency();
      return getAstronautDataset(resolveAstronautId(token)).reports;
    },
    async getReport(token, reportId) {
      await simulateLatency();
      const report = getAstronautDataset(resolveAstronautId(token)).reports.find((r) => r.id === reportId);
      // Reports owned by other astronauts are indistinguishable from missing ones.
      if (!report) throw new NotFoundError("Report not found.");
      return report;
    },
  },
  assessments: {
    async listAssessments(token) {
      await simulateLatency();
      return getAstronautDataset(resolveAstronautId(token)).assessments;
    },
  },
};
