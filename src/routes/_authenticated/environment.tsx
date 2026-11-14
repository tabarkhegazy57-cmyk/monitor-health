import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Unplug, Info } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { SimulatedBadge } from "@/components/common/simulated-badge";
import { hazardValue } from "@/components/environment/hazard-value";
import { HAZARD_ICONS } from "@/components/health/indicator-icon";
import { Badge } from "@/components/ui/badge";
import { getHazard, HAZARDS, isHazardId } from "@/data/hazards";
import { useSession } from "@/features/auth/use-session";
import { fmtDate, fmtDayMonth, fmtDistanceKm, fmtNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { hazardsQuery } from "@/services/queries";
import type { HazardDefinition, HazardId, HazardPoint } from "@/types/domain";

export const Route = createFileRoute("/_authenticated/environment")({
  validateSearch: (s: Record<string, unknown>): { hazard?: HazardId | undefined } => ({
    hazard: typeof s["hazard"] === "string" && isHazardId(s["hazard"]) ? s["hazard"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Space environment — ASTRA CARE" },
      { name: "description", content: "Radiation, isolation, distance from Earth, gravity and closed-environment monitoring." },
      { property: "og:title", content: "Space environment — ASTRA CARE" },
      { property: "og:description", content: "The five hazards of human spaceflight for your mission." },
    ],
  }),
  loader: ({ context: { queryClient, session } }) => queryClient.ensureQueryData(hazardsQuery(session)),
  component: EnvironmentPage,
});

function fmtHazardPoint(def: HazardDefinition, v: number) {
  if (def.id === "distance") return fmtDistanceKm(v);
  if (def.id === "radiation") return `${fmtNumber(v, 2)} mSv/day`;
  return `${fmtNumber(v)} ${def.unit ?? ""}`;
}

function HazardChart({ def, points }: { def: HazardDefinition; points: HazardPoint[] }) {
  const data = points.map((p) => ({ label: fmtDayMonth(p.timestamp), value: p.value }));
  return (
    <div className="h-64" role="img" aria-label={`${def.name} simulated 30-day chart`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="hz" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.22} />
              <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 4" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis
            domain={["auto", "auto"]}
            width={64}
            tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => (def.id === "distance" ? (v >= 1e6 ? `${fmtNumber(v / 1e6, 1)}M` : `${fmtNumber(v / 1000)}k`) : String(v))}
          />
          <Tooltip
            formatter={(v: number) => [fmtHazardPoint(def, v), "Simulated"]}
            contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 12 }}
          />
          <Area type="monotone" dataKey="value" stroke="var(--color-chart-2)" strokeWidth={2} fill="url(#hz)" animationDuration={600} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function EnvironmentPage() {
  const session = useSession();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/environment" });
  const { data: hazards } = useSuspenseQuery(hazardsQuery(session));
  const activeId = search.hazard ?? "radiation";
  const def = getHazard(activeId)!;
  const series = hazards.find((h) => h.hazardId === activeId)!;
  const Icon = HAZARD_ICONS[activeId];
  const v = hazardValue(def, series);

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow={
          <>
            Mission environment <SimulatedBadge />
          </>
        }
        title="Space environment"
        description="The five hazards of human spaceflight for your mission. Environmental data is kept separate from your personal health readings."
      />

      <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5" role="tablist" aria-label="Hazards">
        {HAZARDS.map((h) => {
          const s = hazards.find((x) => x.hazardId === h.id)!;
          const HIcon = HAZARD_ICONS[h.id];
          const active = h.id === activeId;
          return (
            <button
              key={h.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => navigate({ search: { hazard: h.id }, replace: true })}
              className={cn(
                "surface-card interactive-card flex flex-col items-start gap-2 p-3 text-left",
                active && "border-primary bg-accent/60 shadow-raised",
              )}
            >
              <span className={cn("grid size-8 place-items-center rounded-md", active ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground")}>
                <HIcon className="size-4" aria-hidden />
              </span>
              <span className="text-sm font-medium leading-tight">{h.shortName}</span>
              <span className="text-xs text-muted-foreground">{s.status === "no-feed" ? "No data feed" : "Simulated data"}</span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]" role="tabpanel" aria-label={def.name}>
        <section className="surface-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-md bg-primary text-primary-foreground">
                <Icon className="size-5" aria-hidden />
              </span>
              <div>
                <h2 className="text-xl font-semibold">{def.name}</h2>
                <p className="text-sm text-muted-foreground">{def.metricLabel}</p>
              </div>
            </div>
            {series.status === "no-feed" ? <Badge variant="muted">No data feed</Badge> : <SimulatedBadge />}
          </div>

          {series.status === "no-feed" ? (
            <EmptyState
              className="mt-5"
              icon={Unplug}
              title="No data feed connected"
              description={`${series.noFeedReason ?? ""} No values are shown rather than estimates.`}
            />
          ) : (
            <>
              <div className="mt-5 flex flex-wrap items-baseline gap-x-2">
                <span className="font-mono text-4xl font-medium tabular">{v?.value}</span>
                <span className="text-muted-foreground">{v?.unit}</span>
                {series.latest?.label && <span className="ml-2 text-sm text-muted-foreground">· {series.latest.label}</span>}
              </div>
              {series.latest && <div className="mt-1 text-xs text-muted-foreground">As of {fmtDate(series.latest.timestamp)}</div>}
              {series.readings.length > 0 ? (
                <div className="mt-5">
                  <HazardChart def={def} points={series.readings} />
                </div>
              ) : (
                <p className="mt-5 rounded-md bg-surface p-3 text-sm text-muted-foreground">
                  This hazard is described by mission conditions rather than a sensor time series, so no chart is shown.
                </p>
              )}
            </>
          )}
        </section>

        <aside className="space-y-4">
          <section className="surface-card p-5">
            <h3 className="font-semibold">What it is</h3>
            <p className="mt-1 text-sm text-muted-foreground">{def.description}</p>
            <h3 className="mt-4 font-semibold">Why it matters</h3>
            <p className="mt-1 text-sm text-muted-foreground">{def.whyItMatters}</p>
          </section>
          {series.context.length > 0 && (
            <section className="surface-card p-5">
              <h3 className="font-semibold">Mission context</h3>
              <dl className="mt-3 space-y-2.5 text-sm">
                {series.context.map((c) => (
                  <div key={c.label} className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">{c.label}</dt>
                    <dd className="text-right font-medium">{c.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
          <p className="flex gap-2 px-1 text-xs leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" /> Values are simulated for this demo and no safety limits are applied.
          </p>
        </aside>
      </div>
    </div>
  );
}
