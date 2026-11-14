import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BellRing, BrainCircuit, CalendarDays, FileText, PersonStanding, Radio, Rocket, UsersRound } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { SimulatedBadge } from "@/components/common/simulated-badge";
import { hazardValue } from "@/components/environment/hazard-value";
import { IndicatorCard } from "@/components/health/indicator-card";
import { HAZARD_ICONS } from "@/components/health/indicator-icon";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getHazard } from "@/data/hazards";
import { useSession } from "@/features/auth/use-session";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { alertsQuery, hazardsQuery, healthQuery, profileQuery } from "@/services/queries";

export const Route = createFileRoute("/_authenticated/overview")({
  head: () => ({
    meta: [
      { title: "Mission overview — ASTRA CARE" },
      { name: "description", content: "Your astronaut profile, mission status, latest health readings and recent alerts." },
      { property: "og:title", content: "Mission overview — ASTRA CARE" },
      { property: "og:description", content: "Personal astronaut dashboard with mission and health overview." },
    ],
  }),
  loader: ({ context: { queryClient, session } }) =>
    Promise.all([
      queryClient.ensureQueryData(profileQuery(session)),
      queryClient.ensureQueryData(healthQuery(session)),
      queryClient.ensureQueryData(hazardsQuery(session)),
      queryClient.ensureQueryData(alertsQuery(session)),
    ]),
  component: OverviewPage,
});

function OverviewPage() {
  const session = useSession();
  const { data: profile } = useSuspenseQuery(profileQuery(session));
  const { data: series } = useSuspenseQuery(healthQuery(session));
  const { data: hazards } = useSuspenseQuery(hazardsQuery(session));
  const { data: alerts } = useSuspenseQuery(alertsQuery(session));
  const { astronaut, mission } = profile;
  const progress = Math.round((mission.missionDay / mission.plannedDurationDays) * 100);
  const firstName = astronaut.name.split(" ")[0];

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow={
          <>
            Mission overview <SimulatedBadge />
          </>
        }
        title={`Welcome back, ${firstName}`}
        description="Your latest simulated readings, mission status and the hazards tracked for your flight."
        actions={
          <Button asChild variant="subtle">
            <Link to="/reports">
              <FileText /> Reports
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        {/* Profile */}
        <section className="surface-card relative overflow-hidden p-5" aria-labelledby="profile-h">
          <div className="absolute inset-0 bg-starfield opacity-40" aria-hidden />
          <div className="relative flex items-start gap-4">
            <span className="grid size-14 shrink-0 place-items-center rounded-full bg-primary font-display text-lg font-semibold text-primary-foreground">
              {astronaut.initials}
            </span>
            <div className="min-w-0">
              <h2 id="profile-h" className="text-lg font-semibold">
                {astronaut.name}
              </h2>
              <p className="text-sm text-muted-foreground">{astronaut.role}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <span className="rounded bg-mint px-2 py-0.5 font-mono text-mint-foreground">{astronaut.id}</span>
                <span className="rounded bg-muted px-2 py-0.5 text-muted-foreground">{astronaut.agency}</span>
              </div>
            </div>
          </div>
          <p className="relative mt-4 text-sm leading-relaxed text-muted-foreground">{astronaut.bio}</p>
        </section>

        {/* Mission */}
        <section className="surface-card p-5" aria-labelledby="mission-h">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Mission</div>
              <h2 id="mission-h" className="mt-0.5 text-lg font-semibold">
                {mission.name}
              </h2>
              <p className="text-sm text-muted-foreground">{mission.vehicle}</p>
            </div>
            <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">{mission.phase}</span>
          </div>
          <div className="mt-4">
            <div className="mb-1.5 flex items-baseline justify-between text-sm">
              <span>
                Day <span className="font-mono font-medium">{mission.missionDay}</span> of{" "}
                <span className="font-mono">{mission.plannedDurationDays}</span>
              </span>
              <span className="font-mono text-xs text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2 bg-muted [&>div]:bg-primary" aria-label="Mission progress" />
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            {[
              { icon: Rocket, label: "Launch", value: fmtDate(mission.launchDate) },
              { icon: UsersRound, label: "Crew", value: `${mission.crewSize} people` },
              { icon: Radio, label: "Signal delay", value: mission.commDelaySeconds === null ? "Real-time" : `${mission.commDelaySeconds} s` },
              { icon: CalendarDays, label: "Remaining", value: `${mission.plannedDurationDays - mission.missionDay} days` },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-md bg-surface p-2.5">
                <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Icon className="size-3.5" aria-hidden /> {label}
                </dt>
                <dd className="mt-0.5 font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      {/* Latest health */}
      <section className="mt-8" aria-labelledby="health-h">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="health-h" className="text-lg font-semibold">
            Latest health readings
          </h2>
          <Link to="/health" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            All indicators <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {series.map((s) => (
            <IndicatorCard key={s.indicatorId} series={s} />
          ))}
        </div>
      </section>

      <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {/* Environment */}
        <section className="surface-card p-5" aria-labelledby="env-h">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 id="env-h" className="text-lg font-semibold">
                Space environment
              </h2>
              <p className="text-sm text-muted-foreground">Mission hazards, kept separate from your health data.</p>
            </div>
            <Link to="/environment" search={{}} className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:flex">
              Details <ArrowRight className="size-4" />
            </Link>
          </div>
          <ul className="divide-y">
            {hazards.map((h) => {
              const def = getHazard(h.hazardId)!;
              const Icon = HAZARD_ICONS[def.id];
              const v = hazardValue(def, h);
              return (
                <li key={h.hazardId}>
                  <Link
                    to="/environment"
                    search={{ hazard: def.id }}
                    className="-mx-2 flex items-center gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-surface"
                  >
                    <span className="grid size-8 place-items-center rounded-md bg-accent text-accent-foreground">
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <span className="flex-1 text-sm font-medium">{def.name}</span>
                    {v ? (
                      <span className="text-right font-mono text-sm tabular">
                        {v.value} <span className="text-xs text-muted-foreground">{v.unit}</span>
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">No data feed</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Alerts */}
        <section className="surface-card p-5" aria-labelledby="alerts-h">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="alerts-h" className="text-lg font-semibold">
              Recent alerts
            </h2>
            <Link to="/alerts" search={{}} className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              View all <ArrowRight className="size-4" />
            </Link>
          </div>
          {alerts.length === 0 ? (
            <EmptyState icon={BellRing} title="No alerts" />
          ) : (
            <ul className="space-y-1">
              {alerts.slice(0, 4).map((a) => (
                <li key={a.id}>
                  <Link
                    to="/alerts"
                    search={{ alert: a.id }}
                    className="-mx-2 flex gap-3 rounded-md px-2 py-2 transition-colors hover:bg-surface"
                  >
                    <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", a.read ? "bg-border" : "bg-coral")} aria-label={a.read ? "Read" : "Unread"} />
                    <span className="min-w-0">
                      <span className={cn("block text-sm leading-snug", !a.read && "font-medium")}>{a.title}</span>
                      <span className="text-xs text-muted-foreground">{fmtDateTime(a.createdAt)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Quick links */}
      <section className="mt-8 grid gap-3 sm:grid-cols-3" aria-label="Quick links">
        {[
          { to: "/body" as const, icon: PersonStanding, title: "3D body explorer", text: "See which readings relate to each body region." },
          { to: "/assessment" as const, icon: BrainCircuit, title: "AI assessment", text: "Descriptive patterns in your simulated readings." },
          { to: "/reports" as const, icon: FileText, title: "Reports", text: "Daily, weekly and environment summaries." },
        ].map(({ to, icon: Icon, title, text }) => (
          <Link key={to} to={to} className="surface-card interactive-card group flex items-start gap-3 p-4">
            <span className="grid size-9 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
              <Icon className="size-4" aria-hidden />
            </span>
            <span>
              <span className="flex items-center gap-1 font-medium">
                {title} <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
              <span className="text-sm text-muted-foreground">{text}</span>
            </span>
          </Link>
        ))}
      </section>
    </div>
  );
}
