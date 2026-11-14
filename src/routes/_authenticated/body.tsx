import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Info, Pause, Play, RotateCcw, RotateCw, Undo2, ZoomIn, ZoomOut, Unlink } from "lucide-react";
import { lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { SimulatedBadge } from "@/components/common/simulated-badge";
import { INDICATOR_ICONS } from "@/components/health/indicator-icon";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { BODY_REGIONS, getBodyRegion } from "@/data/body-regions";
import { getIndicator } from "@/data/indicators";
import type { BodyViewerApi } from "@/features/body3d/types";
import { useSession } from "@/features/auth/use-session";
import { fmtDateTime, fmtReadingUnit, fmtReadingValue } from "@/lib/format";
import { cn } from "@/lib/utils";
import { healthQuery } from "@/services/queries";
import type { BodyRegionId } from "@/types/domain";

const BodyScene = lazy(() => import("@/features/body3d/body-scene"));

const REGION_IDS = BODY_REGIONS.map((r) => r.id);

export const Route = createFileRoute("/_authenticated/body")({
  validateSearch: (s: Record<string, unknown>): { region?: BodyRegionId | undefined } => ({
    region: REGION_IDS.includes(s["region"] as BodyRegionId) ? (s["region"] as BodyRegionId) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "3D body explorer — ASTRA CARE" },
      { name: "description", content: "Rotate, zoom and select body regions to see related health readings." },
      { property: "og:title", content: "3D body explorer — ASTRA CARE" },
      { property: "og:description", content: "Interactive 3D human body linked to personal health indicators." },
    ],
  }),
  loader: ({ context: { queryClient, session } }) => queryClient.ensureQueryData(healthQuery(session)),
  component: BodyPage,
});

function BodyPage() {
  const { region } = Route.useSearch();
  const navigate = useNavigate({ from: "/body" });
  const session = useSession();
  const { data: series } = useSuspenseQuery(healthQuery(session));
  const viewer = useRef<BodyViewerApi | null>(null);
  const [autoRotate, setAutoRotate] = useState(false);
  const selected = region ?? null;

  const select = useCallback(
    (id: BodyRegionId | null) => {
      void navigate({ search: id ? { region: id } : {}, replace: true });
    },
    [navigate],
  );

  useEffect(() => {
    viewer.current?.focus(selected);
  }, [selected]);

  const onApi = useCallback(
    (api: BodyViewerApi) => {
      viewer.current = api;
      if (selected) api.focus(selected);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const info = selected ? getBodyRegion(selected) : null;

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Body explorer"
        title="3D body explorer"
        description="Drag to rotate, scroll or pinch to zoom, and select a region to see the readings linked to it."
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="surface-card relative overflow-hidden" aria-label="3D body model">
          <div className="relative h-[460px] bg-brand-panel sm:h-[560px]">
            <div className="absolute inset-0 bg-starfield opacity-50" aria-hidden />
            <Suspense fallback={<Skeleton className="absolute inset-6 rounded-lg" />}>
              <BodyScene selected={selected} onSelect={select} autoRotate={autoRotate} onApi={onApi} />
            </Suspense>

            <div className="pointer-events-none absolute left-4 top-4 rounded-md border bg-card/90 px-2.5 py-1.5 text-xs text-muted-foreground backdrop-blur">
              {info ? (
                <span>
                  Selected: <strong className="font-medium text-foreground">{info.name}</strong>
                </span>
              ) : (
                "Select a region on the model"
              )}
            </div>

            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-lg border bg-card/95 p-1 shadow-raised backdrop-blur">
              <ViewerButton label="Rotate left" onClick={() => viewer.current?.rotate(-1)}>
                <RotateCcw />
              </ViewerButton>
              <ViewerButton label="Rotate right" onClick={() => viewer.current?.rotate(1)}>
                <RotateCw />
              </ViewerButton>
              <span className="mx-0.5 h-5 w-px bg-border" />
              <ViewerButton label="Zoom in" onClick={() => viewer.current?.zoomIn()}>
                <ZoomIn />
              </ViewerButton>
              <ViewerButton label="Zoom out" onClick={() => viewer.current?.zoomOut()}>
                <ZoomOut />
              </ViewerButton>
              <span className="mx-0.5 h-5 w-px bg-border" />
              <ViewerButton label={autoRotate ? "Stop turntable" : "Start turntable"} pressed={autoRotate} onClick={() => setAutoRotate((a) => !a)}>
                {autoRotate ? <Pause /> : <Play />}
              </ViewerButton>
              <ViewerButton
                label="Reset view"
                onClick={() => {
                  setAutoRotate(false);
                  select(null);
                  viewer.current?.reset();
                }}
              >
                <Undo2 />
              </ViewerButton>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 border-t p-3" role="group" aria-label="Body regions">
            {BODY_REGIONS.map((r) => (
              <Button
                key={r.id}
                size="sm"
                variant={selected === r.id ? "default" : "subtle"}
                aria-pressed={selected === r.id}
                onClick={() => select(selected === r.id ? null : r.id)}
              >
                {r.name}
              </Button>
            ))}
          </div>
        </section>

        <aside className="space-y-4" aria-live="polite">
          {info ? (
            <section className="surface-card p-5">
              <div className="text-xs font-medium uppercase tracking-[0.12em] text-primary">Selected region</div>
              <h2 className="mt-1 text-xl font-semibold">{info.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{info.description}</p>

              <div className="mt-5 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Linked readings</h3>
                <SimulatedBadge />
              </div>
              {info.indicatorIds.length === 0 ? (
                <EmptyState icon={Unlink} className="mt-3 py-6" title="No linked indicators" description="None of the six monitored indicators are associated with this region yet." />
              ) : (
                <ul className="mt-3 space-y-2">
                  {info.indicatorIds.map((id) => {
                    const def = getIndicator(id)!;
                    const s = series.find((x) => x.indicatorId === id)!;
                    const latest = s.readings[s.readings.length - 1];
                    const Icon = INDICATOR_ICONS[id];
                    return (
                      <li key={id}>
                        <Link
                          to="/health/$indicator"
                          params={{ indicator: id }}
                          className="group flex items-center gap-3 rounded-md border p-3 transition-colors hover:border-ring/40 hover:bg-surface"
                        >
                          <span className="grid size-8 place-items-center rounded-md bg-mint text-mint-foreground">
                            <Icon className="size-4" aria-hidden />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-medium">{def.name}</span>
                            <span className="block text-xs text-muted-foreground">
                              {s.status === "unavailable" ? "Unavailable" : latest ? fmtDateTime(latest.timestamp) : "No readings"}
                            </span>
                          </span>
                          {latest && (
                            <span className="text-right font-mono text-sm tabular">
                              {fmtReadingValue(def, latest)}{" "}
                              <span className="text-xs text-muted-foreground">{def.valueKind === "scale" ? "/ 5" : fmtReadingUnit(def)}</span>
                            </span>
                          )}
                          <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
              <div className="mt-5 rounded-md bg-surface p-3 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">In space: </span>
                {info.spaceNote}
              </div>
            </section>
          ) : (
            <section className="surface-card p-5">
              <h2 className="text-lg font-semibold">Choose a region</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Click the model or use the region buttons. Each region shows the indicators associated with it and their latest simulated readings.
              </p>
              <ul className="mt-4 space-y-1">
                {BODY_REGIONS.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => select(r.id)}
                      className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-surface"
                    >
                      <span>{r.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {r.indicatorIds.length} indicator{r.indicatorIds.length === 1 ? "" : "s"}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <p className="flex gap-2 px-1 text-xs leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            The 3D figure is a visual guide for navigating your data. It does not measure or display your actual body or health status.
          </p>
        </aside>
      </div>
    </div>
  );
}

function ViewerButton({
  label,
  onClick,
  children,
  pressed,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  pressed?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={label}
          aria-pressed={pressed}
          onClick={onClick}
          className={cn("size-9", pressed && "bg-accent text-accent-foreground")}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
