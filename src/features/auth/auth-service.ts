import type { Session } from "@/types/domain";
import { registerSession, resolveAstronautId, revokeSession } from "@/services/mock/session-registry";
import { simulateLatency } from "@/services/mock/latency";
import { readJson, removeKey, writeJson } from "@/services/mock/storage";

import { checkAccessCodeFormat, normalizeAccessCode, type AuthErrorCode } from "./access-code";
import { DEMO_ACCOUNTS } from "./demo-accounts";

export type SignInResult = { ok: true; session: Session } | { ok: false; error: AuthErrorCode };

export interface AuthService {
  signIn(rawCode: string): Promise<SignInResult>;
  signOut(): Promise<void>;
  /** Returns the current valid session, or null. */
  getSession(): Session | null;
}

const CLIENT_SESSION_KEY = "astra.session";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 30_000;

function makeToken(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `tok-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Demo authentication. NOT production security: codes and sessions live in
 * the browser. The interface mirrors what a backend-backed service would offer.
 */
export function createMockAuthService(): AuthService {
  let failed = 0;
  let lockedUntil = 0;

  return {
    async signIn(rawCode) {
      const formatError = checkAccessCodeFormat(rawCode);
      if (formatError) return { ok: false, error: formatError };
      if (Date.now() < lockedUntil) return { ok: false, error: "locked" };

      await simulateLatency(700);
      const code = normalizeAccessCode(rawCode);
      const account = DEMO_ACCOUNTS.find((a) => a.code === code);
      if (!account) {
        failed += 1;
        if (failed >= MAX_FAILED_ATTEMPTS) {
          failed = 0;
          lockedUntil = Date.now() + LOCKOUT_MS;
          return { ok: false, error: "locked" };
        }
        return { ok: false, error: "unknown" };
      }
      failed = 0;
      const now = Date.now();
      const session: Session = {
        token: makeToken(),
        astronautId: account.astronautId,
        issuedAt: new Date(now).toISOString(),
        expiresAt: new Date(now + SESSION_TTL_MS).toISOString(),
      };
      registerSession(session.token, session.astronautId, session.expiresAt);
      writeJson(CLIENT_SESSION_KEY, session);
      return { ok: true, session };
    },

    async signOut() {
      const session = readJson<Session | null>(CLIENT_SESSION_KEY, null);
      if (session) revokeSession(session.token);
      removeKey(CLIENT_SESSION_KEY);
    },

    getSession() {
      const session = readJson<Session | null>(CLIENT_SESSION_KEY, null);
      if (!session) return null;
      try {
        // Re-validate against the "server" registry; ignore the client's own astronautId.
        const astronautId = resolveAstronautId(session.token);
        return { ...session, astronautId };
      } catch {
        removeKey(CLIENT_SESSION_KEY);
        return null;
      }
    },
  };
}

export const authService: AuthService = createMockAuthService();
