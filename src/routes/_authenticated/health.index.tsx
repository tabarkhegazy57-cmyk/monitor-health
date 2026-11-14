import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Activity } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { SimulatedBadge } from "@/components/common/simulated-badge";
import { IndicatorCard } from "@/components/health/indicator-card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HISTORY_DAYS } from "@/data/mock/clock";
import { useSession } from "@/features/auth/use-session";
import { healthQuery } from "@/services/queries";
import type { IndicatorSeries } from "@/types/domain";

export const Route = createFileRoute("/_authenticated/health/")({
  head: () => ({
    meta: [
      { title: "Health monitoring — ASTRA CARE" },
      { name: "description", content: "Heart rate, blood pressure, blood sugar, temperature, sleep and mood readings." },
      { property: "og:title", content: "Health monitoring — ASTRA CARE" },
      { property: "og:description", content: "Six personal health indicators with history and trends." },
    ],
  }),
  loader: ({ context: { queryClient, session } }) => queryClient.ensureQueryData(healthQuery(session)),
  component: HealthPage,
});

type Filter = "all" | "complete" | "gaps";

function hasGaps(s: IndicatorSeries) {
  return s.status === "unavailable" || s.readings.filter((r) => r.source === "simulated").length < HISTORY_DAYS;
}

function HealthPage() {
  const session = useSession();
  const { data: series } = useSuspenseQuery(healthQuery(session));
  const [filter, setFilter] = useState<Filter>("all");
  const shown = series.filter((s) => (filter === "all" ? true : filter === "gaps" ? hasGaps(s) : !hasGaps(s)));

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow={
          <>
            Personal health <SimulatedBadge />
          </>
        }
        title="Health monitoring"
        description="Six indicators recorded through the mission. Open any indicator to see its history, trend and readings."
      />
      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)} className="mb-5">
        <TabsList>
          <TabsTrigger value="all">All ({series.length})</TabsTrigger>
          <TabsTrigger value="complete">Complete history</TabsTrigger>
          <TabsTrigger value="gaps">Gaps or unavailable</TabsTrigger>
        </TabsList>
      </Tabs>
      {shown.length === 0 ? (
        <EmptyState icon={Activity} title="Nothing in this view" description="No indicators match this filter for your profile." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((s) => (
            <IndicatorCard key={s.indicatorId} series={s} />
          ))}
        </div>
      )}
      <p className="mt-6 text-xs text-muted-foreground">
        ASTRA CARE shows readings and how they change over time. It doesn't apply medical reference ranges or make
        diagnoses.
      </p>
    </div>
  );
}
