import { HAZARDS } from "@/data/hazards";
import { INDICATORS, MOOD_LABELS } from "@/data/indicators";
import { mean, round, stdev } from "@/lib/stats";
import type {
  Alert,
  Assessment,
  AssessmentFinding,
  HazardSeries,
  IndicatorDefinition,
  IndicatorId,
  IndicatorSeries,
  Mission,
  Reading,
  Report,
} from "@/types/domain";

import { MOCK_MISSIONS, MOCK_ASTRONAUTS } from "./astronauts";
import { createRandom, daysAgoOf, hashString, HISTORY_DAYS, simTimestamp } from "./clock";
import { ASTRONAUT_SEEDS, type AstronautSeed } from "./seeds";

export interface AstronautDataset {
  series: Record<IndicatorId, IndicatorSeries>;
  hazards: HazardSeries[];
  alerts: Alert[];
  assessments: Assessment[];
  reports: Report[];
}

function getSeed(astronautId: string): AstronautSeed {
  const seed = ASTRONAUT_SEEDS[astronautId];
  if (!seed) throw new Error(`No mock seed for ${astronautId}`);
  return seed;
}

function getMission(astronautId: string): Mission {
  const astronaut = MOCK_ASTRONAUTS.find((a) => a.id === astronautId);
  const mission = MOCK_MISSIONS.find((m) => m.id === astronaut?.missionId);
  if (!mission) throw new Error(`No mission for ${astronautId}`);
  return mission;
}

function buildSeries(astronautId: string, def: IndicatorDefinition, seed: AstronautSeed): IndicatorSeries {
  const cfg = seed.indicators[def.id];
  if (cfg.unavailableReason) {
    return {
      indicatorId: def.id,
      status: "unavailable",
      unavailableReason: cfg.unavailableReason,
      device: cfg.device,
      readings: [],
    };
  }
  const rand = createRandom(hashString(`${astronautId}:${def.id}`));
  const readings: Reading[] = [];
  for (let daysAgo = HISTORY_DAYS - 1; daysAgo >= 0; daysAgo--) {
    const noise = (rand() - 0.5) * 2;
    const noise2 = (rand() - 0.5) * 2;
    if (cfg.missingDaysAgo?.includes(daysAgo)) continue;
    const progress = (HISTORY_DAYS - 1 - daysAgo) / (HISTORY_DAYS - 1);
    let value = cfg.base + (cfg.drift ?? 0) * progress + noise * cfg.spread;
    if (def.valueKind === "scale") value = Math.min(5, Math.max(1, Math.round(value)));
    if (def.id === "sleep") value = Math.min(24, Math.max(0, value));
    const reading: Reading = {
      id: `${def.id}-${daysAgo}`,
      timestamp: simTimestamp(daysAgo, def.id === "mood" ? 20 : 7, def.id === "sleep" ? 5 : 15),
      value: round(value, def.decimals),
      source: "simulated",
    };
    if (def.valueKind === "pressure") {
      reading.secondary = Math.round((cfg.secondaryBase ?? 0) + noise2 * (cfg.secondarySpread ?? 0));
    }
    readings.push(reading);
  }
  return { indicatorId: def.id, status: "available", device: cfg.device, readings };
}

function buildHazards(astronautId: string, seed: AstronautSeed): HazardSeries[] {
  const mission = getMission(astronautId);
  return HAZARDS.map((def): HazardSeries => {
    const cfg = seed.hazards[def.id];
    if (cfg.noFeedReason) {
      return { hazardId: def.id, status: "no-feed", noFeedReason: cfg.noFeedReason, readings: [], context: [] };
    }
    const rand = createRandom(hashString(`${astronautId}:${def.id}`));
    const daily = (fn: (daysAgo: number) => number) =>
      Array.from({ length: HISTORY_DAYS }, (_, i) => {
        const daysAgo = HISTORY_DAYS - 1 - i;
        return { timestamp: simTimestamp(daysAgo, 0, 0), value: fn(daysAgo) };
      });

    switch (def.id) {
      case "radiation": {
        const readings = daily(() => round((cfg.base ?? 0) + (rand() - 0.5) * 2 * (cfg.spread ?? 0), 2));
        const total = readings.reduce((a, r) => a + r.value, 0);
        return {
          hazardId: def.id,
          status: "simulated",
          readings,
          latest: { ...readings[readings.length - 1]! },
          context: [
            { label: "30-day simulated total", value: `${round(total, 1)} mSv` },
            { label: "Dosimeter", value: "Personal dosimeter (simulated)" },
          ],
        };
      }
      case "closed-environment": {
        const readings = daily(() => Math.round((cfg.base ?? 0) + (rand() - 0.5) * 2 * (cfg.spread ?? 0)));
        return {
          hazardId: def.id,
          status: "simulated",
          readings,
          latest: { ...readings[readings.length - 1]! },
          context: [
            { label: "Monitored module", value: "Crew quarters (simulated)" },
            { label: "Other habitat feeds", value: "Not connected" },
          ],
        };
      }
      case "distance": {
        const readings = daily(seed.distance);
        const latest = readings[readings.length - 1]!;
        return {
          hazardId: def.id,
          status: "simulated",
          readings,
          latest: { ...latest },
          context: [
            {
              label: "One-way signal delay",
              value: mission.commDelaySeconds === null ? "Near real-time" : `${mission.commDelaySeconds} s`,
            },
            { label: "Trajectory", value: mission.destination },
          ],
        };
      }
      case "gravity":
        return {
          hazardId: def.id,
          status: "simulated",
          readings: [],
          latest: { value: seed.gravity.value, timestamp: simTimestamp(0, 6, 0), label: seed.gravity.label },
          context: [
            { label: "Artificial gravity", value: "None on this vehicle" },
            { label: "Next gravity transition", value: "Return to Earth (1 g)" },
          ],
        };
      case "isolation":
        return {
          hazardId: def.id,
          status: "simulated",
          readings: [],
          latest: { value: mission.missionDay, timestamp: simTimestamp(0, 6, 0), label: "Mission days in confinement" },
          context: [
            { label: "Crew size", value: `${mission.crewSize} people` },
            { label: "Days remaining (planned)", value: `${mission.plannedDurationDays - mission.missionDay}` },
            {
              label: "Real-time calls with Earth",
              value: mission.commDelaySeconds !== null && mission.commDelaySeconds > 10 ? "Not possible" : "Possible",
            },
          ],
        };
    }
  });
}

function formatValue(def: IndicatorDefinition, v: number): string {
  if (def.valueKind === "scale") return `${round(v, 1)} / 5`;
  return `${round(v, def.decimals)}${def.unit ? ` ${def.unit}` : ""}`;
}

/** Descriptive comparison of one 7-day window to the previous 7 days. Not a medical evaluation. */
export function describeWindow(
  def: IndicatorDefinition,
  series: IndicatorSeries,
  endDaysAgo: number,
): AssessmentFinding {
  if (series.status === "unavailable") {
    return {
      indicatorId: def.id,
      observation: "insufficient-data",
      pattern: "No data available",
      detail: series.unavailableReason ?? "This indicator has no data source.",
    };
  }
  const inWindow = (r: Reading, start: number, end: number) => {
    const daysAgo = daysAgoOf(r.timestamp);
    return daysAgo >= end && daysAgo < start;
  };
  const current = series.readings.filter((r) => inWindow(r, endDaysAgo + 7, endDaysAgo)).map((r) => r.value);
  const previous = series.readings
    .filter((r) => inWindow(r, endDaysAgo + 14, endDaysAgo + 7))
    .map((r) => r.value);

  if (current.length < 4 || previous.length < 4) {
    return {
      indicatorId: def.id,
      observation: "insufficient-data",
      pattern: "Not enough readings to compare",
      detail: `Only ${current.length} reading${current.length === 1 ? "" : "s"} in this 7-day window, so no pattern is described.`,
    };
  }
  const m = mean(current);
  const pm = mean(previous);
  const change = (m - pm) / Math.abs(pm);
  const cv = stdev(current) / Math.abs(m);
  const pcv = stdev(previous) / Math.abs(pm);
  const unitChange = formatValue(def, Math.abs(m - pm));

  if (Math.abs(change) >= 0.05) {
    return {
      indicatorId: def.id,
      observation: "changed",
      pattern: `7-day average ${m > pm ? "higher" : "lower"} than the week before`,
      detail: `Average ${formatValue(def, m)} across ${current.length} readings, ${unitChange} ${m > pm ? "above" : "below"} the previous 7 days (${formatValue(def, pm)}).`,
    };
  }
  if (pcv > 0 && cv > pcv * 1.5) {
    return {
      indicatorId: def.id,
      observation: "varied",
      pattern: "More day-to-day variation than the week before",
      detail: `Average ${formatValue(def, m)} was similar to the previous week, but readings were more spread out from day to day.`,
    };
  }
  return {
    indicatorId: def.id,
    observation: "stable",
    pattern: "Similar to the week before",
    detail: `Average ${formatValue(def, m)} across ${current.length} readings, close to the previous 7 days (${formatValue(def, pm)}).`,
  };
}

function buildAssessments(astronautId: string, series: Record<IndicatorId, IndicatorSeries>): Assessment[] {
  return [0, 7, 14].map((endDaysAgo, i) => {
    const findings = INDICATORS.map((def) => describeWindow(def, series[def.id], endDaysAgo));
    const count = (o: string) => findings.filter((f) => f.observation === o).length;
    return {
      id: `AS-${astronautId.slice(-3)}-${String(3 - i).padStart(2, "0")}`,
      createdAt: simTimestamp(endDaysAgo, 5, 30),
      periodStart: simTimestamp(endDaysAgo + 7, 0, 0),
      periodEnd: simTimestamp(endDaysAgo, 0, 0),
      source: "ASTRA CARE assessment engine (simulated)",
      modelVersion: "sim-0.1 · AI model not connected",
      overview: `Descriptive summary of simulated readings across six indicators: ${count("stable")} similar to the previous week, ${count("changed")} with a shifted average, ${count("varied")} with more variation, and ${count("insufficient-data")} without enough data. This is not a medical evaluation.`,
      findings,
    };
  });
}

function buildAlerts(seed: AstronautSeed): Alert[] {
  return seed.alerts
    .map((a) => ({
      id: a.id,
      category: a.category,
      title: a.title,
      message: a.message,
      createdAt: simTimestamp(a.daysAgo, a.hour, 0),
      read: a.read,
      indicatorId: a.indicatorId,
      hazardId: a.hazardId,
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function weeklySections(series: Record<IndicatorId, IndicatorSeries>, endDaysAgo: number) {
  return INDICATORS.map((def) => {
    const s = series[def.id];
    const f = describeWindow(def, s, endDaysAgo);
    return { heading: def.name, body: `${f.pattern}. ${f.detail}` };
  });
}

function buildReports(
  astronautId: string,
  series: Record<IndicatorId, IndicatorSeries>,
  hazards: HazardSeries[],
  assessments: Assessment[],
): Report[] {
  const short = astronautId.slice(-3);
  const author = "ASTRA CARE report generator (simulated)";
  const allIndicators = INDICATORS.map((i) => i.id);
  const latestLines = INDICATORS.map((def) => {
    const s = series[def.id];
    const last = s.readings[s.readings.length - 1];
    if (s.status === "unavailable") return { heading: def.name, body: `Unavailable. ${s.unavailableReason ?? ""}` };
    if (!last) return { heading: def.name, body: "No readings recorded." };
    const value =
      def.valueKind === "pressure"
        ? `${last.value}/${last.secondary} mmHg`
        : def.valueKind === "scale"
          ? `${last.value} / 5 (${MOOD_LABELS[last.value]})`
          : formatValue(def, last.value);
    return { heading: def.name, body: `Latest simulated reading: ${value}, recorded ${last.timestamp.slice(0, 10)}.` };
  });
  const hazardSections = hazards.map((h) => {
    const def = HAZARDS.find((d) => d.id === h.hazardId)!;
    if (h.status === "no-feed") return { heading: def.name, body: `No data feed connected. ${h.noFeedReason ?? ""}` };
    const latest = h.latest;
    const value = latest?.label ?? `${latest?.value.toLocaleString("en-US")} ${def.unit ?? ""}`;
    return { heading: def.name, body: `Latest simulated value: ${value}. ${h.context.map((c) => `${c.label}: ${c.value}`).join(". ")}.` };
  });

  const previous = assessments[1]!;
  return [
    {
      id: `RP-${short}-05`,
      type: "daily",
      title: "Daily health snapshot",
      createdAt: simTimestamp(0, 5, 45),
      periodStart: simTimestamp(1, 0, 0),
      periodEnd: simTimestamp(0, 0, 0),
      author,
      summary: "Latest simulated reading for each monitored indicator.",
      sections: latestLines,
      indicatorIds: allIndicators,
      hazardIds: [],
    },
    {
      id: `RP-${short}-04`,
      type: "weekly",
      title: "Weekly health summary",
      createdAt: simTimestamp(0, 5, 0),
      periodStart: simTimestamp(7, 0, 0),
      periodEnd: simTimestamp(0, 0, 0),
      author,
      summary: "How each indicator's simulated readings this week compare with the week before.",
      sections: weeklySections(series, 0),
      indicatorIds: allIndicators,
      hazardIds: [],
    },
    {
      id: `RP-${short}-03`,
      type: "environment",
      title: "Space environment summary",
      createdAt: simTimestamp(2, 6, 0),
      periodStart: simTimestamp(9, 0, 0),
      periodEnd: simTimestamp(2, 0, 0),
      author,
      summary: "Status of the five spaceflight hazards tracked for this mission.",
      sections: hazardSections,
      indicatorIds: [],
      hazardIds: HAZARDS.map((h) => h.id),
    },
    {
      id: `RP-${short}-02`,
      type: "assessment",
      title: "Assessment summary",
      createdAt: previous.createdAt,
      periodStart: previous.periodStart,
      periodEnd: previous.periodEnd,
      author,
      summary: previous.overview,
      sections: previous.findings.map((f) => ({
        heading: INDICATORS.find((i) => i.id === f.indicatorId)!.name,
        body: `${f.pattern}. ${f.detail}`,
      })),
      indicatorIds: allIndicators,
      hazardIds: [],
    },
    {
      id: `RP-${short}-01`,
      type: "weekly",
      title: "Weekly health summary",
      createdAt: simTimestamp(7, 5, 0),
      periodStart: simTimestamp(14, 0, 0),
      periodEnd: simTimestamp(7, 0, 0),
      author,
      summary: "How each indicator's simulated readings compared with the week before.",
      sections: weeklySections(series, 7),
      indicatorIds: allIndicators,
      hazardIds: [],
    },
  ];
}

const cache = new Map<string, AstronautDataset>();

/** Lazily builds (and memoizes) the full simulated dataset for one astronaut. */
export function getAstronautDataset(astronautId: string): AstronautDataset {
  const cached = cache.get(astronautId);
  if (cached) return cached;
  const seed = getSeed(astronautId);
  const series = Object.fromEntries(
    INDICATORS.map((def) => [def.id, buildSeries(astronautId, def, seed)]),
  ) as Record<IndicatorId, IndicatorSeries>;
  const hazards = buildHazards(astronautId, seed);
  const assessments = buildAssessments(astronautId, series);
  const dataset: AstronautDataset = {
    series,
    hazards,
    alerts: buildAlerts(seed),
    assessments,
    reports: buildReports(astronautId, series, hazards, assessments),
  };
  cache.set(astronautId, dataset);
  return dataset;
}
