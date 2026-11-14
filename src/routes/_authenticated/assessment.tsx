import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, BrainCircuit, Clock, Cpu, ShieldAlert } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { FutureFeatureButton } from "@/components/common/future-feature";
import { PageHeader } from "@/components/common/page-header";
import { SimulatedBadge } from "@/components/common/simulated-badge";
import { INDICATOR_ICONS } from "@/components/health/indicator-icon";
import { OBSERVATION_LABELS, ObservationBadge } from "@/components/health/observation-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getIndicator } from "@/data/indicators";
import { useSession } from "@/features/auth/use-session";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { assessmentsQuery } from "@/services/queries";
import type { PatternObservation } from "@/types/domain";

export const Route = createFileRoute("/_authenticated/assessment")({
  validateSearch: (s: Record<string, unknown>): { id?: string | undefined; tab?: "findings" | "history" | undefined } => ({
    id: typeof s["id"] === "string" ? s["id"] : undefined,
    tab: s["tab"] === "history" ? "history" : s["tab"] === "findings" ? "findings" : undefined,
  }),
  head: () => ({
    meta: [
      { title: "AI health assessment — ASTRA CARE" },
      { name: "description", content: "Simulated, descriptive pattern summaries of your health readings and their history." },
      { property: "og:title", content: "AI health assessment — ASTRA CARE" },
      { property: "og:description", content: "Interface for future AI assessment outputs, shown with simulated data." },
    ],
  }),
  loader: ({ context: { queryClient, session } }) => queryClient.ensureQueryData(assessmentsQuery(session)),
  component: AssessmentPage,
});

function AssessmentPage() {
  const session = useSession();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/assessment" });
  const { data: assessments } = useSuspenseQuery(assessmentsQuery(session));
  const current = assessments.find((a) => a.id === search.id) ?? assessments[0];
  const tab = search.tab ?? "findings";
  if (!current) {
    return (
      <EmptyState
        icon={BrainCircuit}
        title="No assessments yet"
        description="Assessments will appear here once the ASTRA CARE AI model is connected."
      />
    );
  }
  const isLatest = current.id === assessments[0]?.id;
  const counts = (["stable", "changed", "varied", "insufficient-data"] as PatternObservation[]).map((o) => ({
    o,
    n: current.findings.filter((f) => f.observation === o).length,
  }));

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow={
          <>
            AI assessment <SimulatedBadge label="Simulated output" />
          </>
        }
        title="Health assessment"
        description="Descriptive patterns in your readings, compared week to week. Built to display outputs from the future ASTRA CARE AI model."
        actions={
          <FutureFeatureButton reason="Running a new assessment needs the ASTRA CARE AI model, which isn't connected to this prototype yet.">
            <BrainCircuit /> Run new assessment
          </FutureFeatureButton>
        }
      />

      <div className="mb-5 flex gap-3 rounded-lg border border-dashed border-coral/40 bg-coral-soft/60 p-4 text-sm text-coral-ink">
        <ShieldAlert className="mt-0.5 size-4 shrink-0" />
        <p>
          These outputs are simulated and describe patterns only. They are not diagnoses, risk ratings or treatment
          advice, and they have not been medically validated.
        </p>
      </div>

      <section className="surface-card p-5" aria-labelledby="ov-h">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {isLatest ? "Latest assessment" : "Past assessment"} · <span className="font-mono">{current.id}</span>
            </div>
            <h2 id="ov-h" className="mt-1 text-lg font-semibold">
              {fmtDate(current.periodStart)} – {fmtDate(current.periodEnd)}
            </h2>
          </div>
          {!isLatest && (
            <button type="button" className="text-sm font-medium text-primary hover:underline" onClick={() => navigate({ search: { tab } })}>
              Back to latest
            </button>
          )}
        </div>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">{current.overview}</p>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock className="size-3.5" /> Generated {fmtDateTime(current.createdAt)}
          </span>
          <span className="flex items-center gap-1.5">
            <Cpu className="size-3.5" /> {current.source} · {current.modelVersion}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {counts.map(({ o, n }) => (
            <div key={o} className="rounded-md bg-surface p-3">
              <div className="font-mono text-xl tabular">{n}</div>
              <div className="text-xs text-muted-foreground">{OBSERVATION_LABELS[o]}</div>
            </div>
          ))}
        </div>
      </section>

      <Tabs value={tab} onValueChange={(v) => navigate({ search: (p) => ({ ...p, tab: v as "findings" | "history" }) })} className="mt-6">
        <TabsList>
          <TabsTrigger value="findings">By indicator</TabsTrigger>
          <TabsTrigger value="history">History ({assessments.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="findings" className="mt-4">
          <div className="grid gap-3 md:grid-cols-2">
            {current.findings.map((f) => {
              const def = getIndicator(f.indicatorId)!;
              const Icon = INDICATOR_ICONS[f.indicatorId];
              return (
                <article key={f.indicatorId} className="surface-card flex flex-col p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="grid size-8 place-items-center rounded-md bg-mint text-mint-foreground">
                        <Icon className="size-4" aria-hidden />
                      </span>
                      <h3 className="font-semibold">{def.name}</h3>
                    </div>
                    <ObservationBadge observation={f.observation} />
                  </div>
                  <p className="mt-3 text-sm font-medium">{f.pattern}</p>
                  <p className="mt-1 flex-1 text-sm text-muted-foreground">{f.detail}</p>
                  <Link
                    to="/health/$indicator"
                    params={{ indicator: f.indicatorId }}
                    className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    View readings <ArrowRight className="size-3.5" />
                  </Link>
                </article>
              );
            })}
          </div>
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          <ul className="surface-card divide-y">
            {assessments.map((a, i) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => navigate({ search: { id: a.id, tab: "findings" } })}
                  className={cn(
                    "flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-5 py-4 text-left transition-colors hover:bg-surface",
                    a.id === current.id && "bg-accent/50",
                  )}
                >
                  <span className="font-mono text-xs text-muted-foreground">{a.id}</span>
                  <span className="flex-1 font-medium">
                    {fmtDate(a.periodStart)} – {fmtDate(a.periodEnd)}
                    {i === 0 && <span className="ml-2 rounded bg-mint px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase text-mint-foreground">Latest</span>}
                  </span>
                  <span className="text-xs text-muted-foreground">{fmtDateTime(a.createdAt)}</span>
                  <span className="w-full text-xs text-muted-foreground sm:w-auto">{a.source}</span>
                  <ArrowRight className="size-4 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
        </TabsContent>
      </Tabs>
    </div>
  );
}
