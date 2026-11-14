/**
 * Fixed simulated mission clock so demo data is deterministic.
 * Replace with real timestamps when sensor feeds are connected.
 */
export const SIM_NOW_MS = Date.UTC(2026, 10, 14, 6, 0, 0);
export const DAY_MS = 86_400_000;
export const HISTORY_DAYS = 30;

export function simTimestamp(daysAgo: number, hour = 7, minute = 0): string {
  const d = new Date(SIM_NOW_MS - daysAgo * DAY_MS);
  d.setUTCHours(hour, minute, 0, 0);
  return d.toISOString();
}

/** Deterministic PRNG (mulberry32). */
export function createRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Whole calendar days between a timestamp and the simulated "today". */
export function daysAgoOf(timestamp: string): number {
  const d = new Date(timestamp);
  const day = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const now = new Date(SIM_NOW_MS);
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((today - day) / DAY_MS);
}
