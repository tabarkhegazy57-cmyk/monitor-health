import { beforeEach, describe, expect, it } from "vitest";

import { checkAccessCodeFormat } from "./access-code";
import { createMockAuthService } from "./auth-service";

describe("astronaut access-code login", () => {
  beforeEach(() => sessionStorage.clear());

  it("rejects an empty code", async () => {
    const auth = createMockAuthService();
    expect(await auth.signIn("   ")).toEqual({ ok: false, error: "empty" });
  });

  it("rejects a code in the wrong format", async () => {
    expect(checkAccessCodeFormat("hello")).toBe("format");
    const auth = createMockAuthService();
    expect(await auth.signIn("ASTRA-12-AB")).toEqual({ ok: false, error: "format" });
  });

  it("rejects a well-formed but unknown code", async () => {
    const auth = createMockAuthService();
    expect(await auth.signIn("ASTRA-0000-XXX")).toEqual({ ok: false, error: "unknown" });
    expect(auth.getSession()).toBeNull();
  });

  it.each([
    ["ASTRA-7421-ORN", "AST-001"],
    ["ASTRA-3058-LYR", "AST-002"],
    ["ASTRA-9160-VGA", "AST-003"],
  ])("code %s signs in as %s", async (code, astronautId) => {
    const auth = createMockAuthService();
    const result = await auth.signIn(code);
    expect(result.ok).toBe(true);
    expect(auth.getSession()?.astronautId).toBe(astronautId);
  });

  it("accepts lowercase codes with surrounding spaces", async () => {
    const auth = createMockAuthService();
    const result = await auth.signIn("  astra-7421-orn ");
    expect(result.ok && result.session.astronautId).toBe("AST-001");
  });

  it("locks sign-in after 5 wrong codes", async () => {
    const auth = createMockAuthService();
    for (let i = 0; i < 4; i++) expect((await auth.signIn("ASTRA-0000-XXX")).ok).toBe(false);
    expect(await auth.signIn("ASTRA-0000-XXX")).toEqual({ ok: false, error: "locked" });
    expect(await auth.signIn("ASTRA-7421-ORN")).toEqual({ ok: false, error: "locked" });
  });

  it("signing out ends the session", async () => {
    const auth = createMockAuthService();
    await auth.signIn("ASTRA-7421-ORN");
    await auth.signOut();
    expect(auth.getSession()).toBeNull();
  });
});
