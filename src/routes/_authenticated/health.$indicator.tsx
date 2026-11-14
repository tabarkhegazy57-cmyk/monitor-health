import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CalendarX2, Info, PersonStanding, PlugZap } from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/common/empty-state";
import { FutureFeatureButton } from "@/components/common/future-feature";
import { PageHeader } from "@/components/common/page-header";
import { SimulatedBadge } from "@/components/common/simulated-badge";
import { INDICATOR_ICONS } from "@/components/health/indicator-icon";
import { LogReadingDialog } from "@/components/health/log-reading-dialog";
import { TrendChart } from "@/components/health/trend-chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getBodyRegion } from "@/data/body-regions";
import { getIndicator, INDICATORS, isIndicatorId } from "@/data/indicators";
import { daysAgoOf } from "@/data/mock/clock";
import { useSession } from "@/features/auth/use-session";
import { fmtDateTime, fmtNumber, fmtReadingUnit, fmtReadingValue } from "@/lib/format";
import { mean } from "@/lib/stats";
import { seriesQuery } from "@/services/queries";
import type { IndicatorId } from "@/types/domain";

export const Route = createFileRoute("/_authenticated/health/$indicator")({
  beforeLoad: ({ params }) => {
    if (!isIndicatorId(params.indicator)) throw notFound();
  },
  loader: ({ context: { queryClient, session }, params }) =>
    queryClient.ensureQueryData(seriesQuery(session, params.indicator as IndicatorId)),
  head: ({ params }) => {
    const def = getIndicator(params.indicator);
    const name = def?.name ?? "Indicator";
    return {
      meta: [
        { title: `${name} — ASTRA CARE` },
        { name: "description", content: `${name} history, trend chart and readings in ASTRA CARE.` },
        { property: "og:title", content: `${name} — ASTRA CARE` },
        { property: "og:description", content: `Simulated ${name.toLowerCase()} readings for one astronaut.` },
      ],
    };
  },
  notFoundComponent: () => (
    <EmptyState
      icon={Info}
      title="Indicator not found"
      description="ASTRA CARE monitors six indicators. Choose one from Health monitoring."
      action={
        <Button asChild>
          <Link to="/health">Health monitoring</Link>
        </Button>
      }
    />
  ),
  component: IndicatorPage,
});

const RANGES = [7, 14, 30] as const;

function IndicatorPage() {
  const { indicator } = Route.useParams();
  const id = indicator as IndicatorId;
  const def = getIndicator(id)!;
  const session = useSession();
  const navigate = useNavigate();
  const { data: series } = useSuspenseQuery(seriesQuery(session, id));
  const [range, setRange] = useState<(typeof RANGES)[number]>(14);
  const [showAll, setShowAll] = useState(false);
  const Icon = INDICATOR_ICONS[id];

  const inRange = useMemo(
    () => series.readings.filter((r) => r.source === "manual" || daysAgoOf(r.timestamp) < range),
    [series.readings, range],
  );
  const latest = series.readings[series.readings.length - 1];
  const tableRows = [...inRange].reverse();
  const visibleRows = showAll ? tableRows : tableRows.slice(0, 8);
  const values = inRange.map((r) => r.value);
  const unavailable = series.status === "unavailable";

  return (
    <div className="animate-fade-up">
      <Link to="/health" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Health monitoring
      </Link>
      <PageHeader
        eyebrow={
          <>
            <Icon className="size-3.5" /> Health indicator <SimulatedBadge />
          </>
        }
        title={def.name}
        description={def.description}
        actions={
          <>
            <Select value={id} onValueChange={(v) => navigate({ to: "/health/$indicator", params: { indicator: v } })}>
              <SelectTrigger className="w-48 bg-card" aria-label="Switch indicator">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INDICATORS.map((i) => (
                  <SelectItem key={i.id} value={i.id}>
                    {i.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {unavailable ? (
              <FutureFeatureButton reason="Logging is disabled while no device is paired. Device pairing will be added with real sensor integration.">
                Log entry
              </FutureFeatureButton>
            ) : (
              <LogReadingDialog def={def} />
            )}
          </>
        }
      />

      {unavailable ? (
        <EmptyState
          icon={PlugZap}
          tone="coral"
          title="No data available for this indicator"
          description={series.unavailableReason}
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <section className="surface-card p-5" aria-labelledby="trend-h">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 id="trend-h" className="text-sm font-medium text-muted-foreground">
                    Latest reading
                  </h2>
                  {latest ? (
                    <>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="font-mono text-4xl font-medium tabular">{fmtReadingValue(def, latest)}</span>
                        <span className="text-muted-foreground">{fmtReadingUnit(def, latest)}</span>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {fmtDateTime(latest.timestamp)} · {latest.source === "manual" ? "Manual entry" : series.device}
                      </div>
                    </>
                  ) : (
                    <div className="mt-1 text-sm text-muted-foreground">No readings yet</div>
                  )}
                </div>
                <Tabs value={String(range)} onValueChange={(v) => setRange(Number(v) as (typeof RANGES)[number])}>
                  <TabsList>
                    {RANGES.map((r) => (
                      <TabsTrigger key={r} value={String(r)}>
                        {r} days
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
              {inRange.length === 0 ? (
                <EmptyState icon={CalendarX2} title={`No readings in the last ${range} days`} description="Try a longer range or log an entry." />
              ) : (
                <>
                  {def.valueKind === "pressure" && (
                    <div className="mb-2 flex gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-chart-1" /> Systolic</span>
                      <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-chart-2" /> Diastolic</span>
                    </div>
                  )}
                  <TrendChart def={def} readings={inRange} />
                </>
              )}
              <dl className="mt-4 grid grid-cols-2 gap-3 border-t pt-4 text-sm sm:grid-cols-4">
                <Stat label="Readings" value={String(inRange.length)} />
                <Stat label="Average" value={values.length ? fmtNumber(mean(values), def.decimals || (def.valueKind === "scale" ? 1 : 0)) : "–"} />
                <Stat label="Lowest" value={values.length ? fmtNumber(Math.min(...values), def.decimals) : "–"} />
                <Stat label="Highest" value={values.length ? fmtNumber(Math.max(...values), def.decimals) : "–"} />
              </dl>
              {def.valueKind === "pressure" && <p className="mt-2 text-xs text-muted-foreground">Average, lowest and highest refer to systolic values.</p>}
            </section>

            <section className="surface-card overflow-hidden" aria-labelledby="readings-h">
              <div className="flex items-center justify-between px-5 py-4">
                <h2 id="readings-h" className="font-semibold">
                  Readings · last {range} days
                </h2>
                <span className="text-xs text-muted-foreground">{inRange.length} entries</span>
              </div>
              {inRange.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-5">Recorded</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead className="pr-5 text-right">Source</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleRows.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="pl-5 text-muted-foreground">
                          {fmtDateTime(r.timestamp)}
                          {r.note && <div className="text-xs text-foreground">“{r.note}”</div>}
                        </TableCell>
                        <TableCell className="font-mono tabular">
                          {fmtReadingValue(def, r)} <span className="text-muted-foreground">{fmtReadingUnit(def, r)}</span>
                        </TableCell>
                        <TableCell className="pr-5 text-right">
                          <Badge variant={r.source === "manual" ? "mint" : "muted"}>{r.source === "manual" ? "Manual" : "Simulated"}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {tableRows.length > 8 && (
                <div className="border-t px-5 py-3">
                  <Button variant="ghost" size="sm" onClick={() => setShowAll((s) => !s)}>
                    {showAll ? "Show fewer" : `Show all ${tableRows.length} readings`}
                  </Button>
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-4">
            <section className="surface-card p-5">
              <h2 className="font-semibold">About this indicator</h2>
              <dl className="mt-3 space-y-3 text-sm">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">How it's measured</dt>
                  <dd className="mt-0.5">{def.howMeasured}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Unit</dt>
                  <dd className="mt-0.5">{def.unit ?? "Five-point self-report scale (1 = very low, 5 = very good)"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Device</dt>
                  <dd className="mt-0.5">{series.device}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Why it matters in space</dt>
                  <dd className="mt-0.5 text-muted-foreground">{def.spaceContext}</dd>
                </div>
              </dl>
            </section>
            <section className="surface-card p-5">
              <h2 className="font-semibold">Body regions</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {def.bodyRegions.map((r) => (
                  <Button key={r} asChild variant="soft" size="sm">
                    <Link to="/body" search={{ region: r }}>
                      <PersonStanding /> {getBodyRegion(r).name}
                    </Link>
                  </Button>
                ))}
              </div>
            </section>
            <p className="px-1 text-xs leading-relaxed text-muted-foreground">
              No reference ranges are applied. Talk to your flight surgeon about what your readings mean for you.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-mono text-base tabular">{value}</dd>
    </div>
  );
}
