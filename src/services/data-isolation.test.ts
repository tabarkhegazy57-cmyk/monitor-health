import { beforeEach, describe, expect, it } from "vitest";

import { createMockAuthService } from "@/features/auth/auth-service";

import { api } from "./api";

async function tokenFor(code: string) {
  const result = await createMockAuthService().signIn(code);
  if (!result.ok) throw new Error("sign in failed");
  return result.session.token;
}

describe("astronaut data separation", () => {
  beforeEach(() => sessionStorage.clear());

  it("each code sees its own profile and mission", async () => {
    const a = await api.profile.getProfile(await tokenFor("ASTRA-7421-ORN"));
    const b = await api.profile.getProfile(await tokenFor("ASTRA-3058-LYR"));
    const c = await api.profile.getProfile(await tokenFor("ASTRA-9160-VGA"));
    expect([a.astronaut.name, b.astronaut.name, c.astronaut.name]).toEqual([
      "Lena Okafor",
      "Mateo Rinaldi",
      "Hana Sato",
    ]);
    expect(new Set([a.mission.id, b.mission.id, c.mission.id]).size).toBe(3);
  });

  it("an astronaut cannot open another astronaut's report", async () => {
    const lena = await tokenFor("ASTRA-7421-ORN");
    const mateo = await tokenFor("ASTRA-3058-LYR");
    const mateoReport = (await api.reports.listReports(mateo))[0]!;
    await expect(api.reports.getReport(lena, mateoReport.id)).rejects.toThrow("Report not found");
  });

  it("alerts are separate per astronaut", async () => {
    const lena = await api.alerts.listAlerts(await tokenFor("ASTRA-7421-ORN"));
    const hana = await api.alerts.listAlerts(await tokenFor("ASTRA-9160-VGA"));
    const lenaIds = new Set(lena.map((a) => a.id));
    expect(hana.some((a) => lenaIds.has(a.id))).toBe(false);
  });

  it("marking an alert read for one astronaut does not affect others", async () => {
    const lena = await tokenFor("ASTRA-7421-ORN");
    const before = (await api.alerts.listAlerts(lena)).filter((a) => !a.read).length;
    await api.alerts.markAllRead(await tokenFor("ASTRA-9160-VGA"));
    expect((await api.alerts.listAlerts(lena)).filter((a) => !a.read).length).toBe(before);
  });

  it("a manual reading is only visible to the astronaut who logged it", async () => {
    const lena = await tokenFor("ASTRA-7421-ORN");
    const hana = await tokenFor("ASTRA-9160-VGA");
    await api.health.addReading(lena, "sleep", { value: 6.5, note: "test" });
    const lenaSleep = await api.health.getSeries(lena, "sleep");
    const hanaSleep = await api.health.getSeries(hana, "sleep");
    expect(lenaSleep.readings.some((r) => r.source === "manual")).toBe(true);
    expect(hanaSleep.readings.some((r) => r.source === "manual")).toBe(false);
  });

  it("data calls without a valid session are refused", async () => {
    await expect(api.health.listSeries("not-a-token")).rejects.toThrow(/sign in/i);
  });

  it("Mateo's blood sugar is unavailable while the others have readings", async () => {
    const mateo = await api.health.getSeries(await tokenFor("ASTRA-3058-LYR"), "blood-sugar");
    const lena = await api.health.getSeries(await tokenFor("ASTRA-7421-ORN"), "blood-sugar");
    expect(mateo.status).toBe("unavailable");
    expect(lena.readings.length).toBe(30);
  });
});
