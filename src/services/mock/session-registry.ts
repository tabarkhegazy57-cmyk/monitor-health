import { UnauthorizedError } from "../errors";
import { readJson, writeJson } from "./storage";

/**
 * Simulates the server-side session table. In production this lives on the
 * backend; the browser would only ever hold an opaque token.
 */
const KEY = "astra.mock.sessions";

interface SessionRecord {
  astronautId: string;
  expiresAt: string;
}

function all(): Record<string, SessionRecord> {
  return readJson<Record<string, SessionRecord>>(KEY, {});
}

export function registerSession(token: string, astronautId: string, expiresAt: string): void {
  writeJson(KEY, { ...all(), [token]: { astronautId, expiresAt } });
}

export function revokeSession(token: string): void {
  const sessions = all();
  delete sessions[token];
  writeJson(KEY, sessions);
}

/** Resolves the astronaut that owns a token, or throws. Every data call goes through this. */
export function resolveAstronautId(token: string | null | undefined, now = Date.now()): string {
  if (!token) throw new UnauthorizedError();
  const record = all()[token];
  if (!record) throw new UnauthorizedError();
  if (Date.parse(record.expiresAt) <= now) {
    revokeSession(token);
    throw new UnauthorizedError("Your session expired. Please sign in again.");
  }
  return record.astronautId;
}
