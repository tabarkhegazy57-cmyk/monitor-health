import { MOOD_LABELS } from "@/data/indicators";
import type { IndicatorDefinition, Reading } from "@/types/domain";

const dateTime = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});
const dateOnly = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const dayMonth = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const timeOnly = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });

/** All times are shown in GMT/UTC, the usual reference for mission operations. */
export const fmtDateTime = (iso: string) => `${dateTime.format(new Date(iso))} GMT`;
export const fmtDate = (iso: string) => dateOnly.format(new Date(iso));
export const fmtDayMonth = (iso: string) => dayMonth.format(new Date(iso));
export const fmtTime = (iso: string) => `${timeOnly.format(new Date(iso))} GMT`;

export function fmtNumber(value: number, decimals = 0): string {
  return value.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/** Value without unit, e.g. "118/76", "36.8", "4". */
export function fmtReadingValue(def: IndicatorDefinition, r: Pick<Reading, "value" | "secondary">): string {
  if (def.valueKind === "pressure") return `${r.value}/${r.secondary ?? "–"}`;
  return fmtNumber(r.value, def.decimals);
}

/** Unit or scale label to show next to a value. */
export function fmtReadingUnit(def: IndicatorDefinition, r?: Pick<Reading, "value">): string {
  if (def.valueKind === "scale") return r ? `/ 5 · ${MOOD_LABELS[r.value] ?? ""}` : "/ 5";
  return def.unit ?? "";
}

export function fmtDistanceKm(km: number): string {
  if (km >= 1_000_000) return `${fmtNumber(km / 1_000_000, 1)} million km`;
  return `${fmtNumber(km)} km`;
}
