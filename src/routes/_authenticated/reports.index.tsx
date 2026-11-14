import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FileSearch, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { SimulatedBadge } from "@/components/common/simulated-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSession } from "@/features/auth/use-session";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { reportsQuery } from "@/services/queries";
import type { ReportType } from "@/types/domain";

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  daily: "Daily",
  weekly: "Weekly",
  environment: "Environment",
  assessment: "Assessment",
};

export const Route = createFileRoute("/_authenticated/reports/")({
  head: () => ({
    meta: [
      { title: "Reports — ASTRA CARE" },
      { name: "description", content: "Your daily, weekly, environment and assessment report history." },
      { property: "og:title", content: "Reports — ASTRA CARE" },
      { property: "og:description", content: "Simulated health and environment report history." },
    ],
  }),
  loader: ({ context: { queryClient, session } }) => queryClient.ensureQueryData(reportsQuery(session)),
  component: ReportsPage,
});

function ReportsPage() {
  const session = useSession();
  const { data: reports } = useSuspenseQuery(reportsQuery(session));
  const [type, setType] = useState<"all" | ReportType>("all");
  const [q, setQ] = useState("");

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return reports.filter(
      (r) =>
        (type === "all" || r.type === type) &&
        (!term || `${r.title} ${r.summary} ${r.id}`.toLowerCase().includes(term)),
    );
  }, [reports, type, q]);

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow={
          <>
            Report history <SimulatedBadge />
          </>
        }
        title="Reports"
        description="Summaries generated from your simulated readings and mission environment."
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search reports" className="bg-card pl-9" aria-label="Search reports" />
        </div>
        <Select value={type} onValueChange={(v) => setType(v as "all" | ReportType)}>
          <SelectTrigger className="bg-card sm:w-48" aria-label="Filter by type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {(Object.keys(REPORT_TYPE_LABELS) as ReportType[]).map((t) => (
              <SelectItem key={t} value={t}>
                {REPORT_TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {shown.length === 0 ? (
        <EmptyState
          icon={FileSearch}
          title="No reports found"
          description="Try a different search or type."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setQ("");
                setType("all");
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-3">
          {shown.map((r) => (
            <li key={r.id}>
              <Link
                to="/reports/$reportId"
                params={{ reportId: r.id }}
                className="surface-card interactive-card group flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-5 sm:px-5"
              >
                <div className="flex items-center gap-2 sm:w-40 sm:flex-col sm:items-start sm:gap-1">
                  <Badge variant="mint">{REPORT_TYPE_LABELS[r.type]}</Badge>
                  <span className="font-mono text-xs text-muted-foreground">{r.id}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{r.title}</div>
                  <div className="line-clamp-1 text-sm text-muted-foreground">{r.summary}</div>
                </div>
                <div className="text-xs text-muted-foreground sm:text-right">
                  <div>
                    {fmtDate(r.periodStart)} – {fmtDate(r.periodEnd)}
                  </div>
                  <div>Created {fmtDateTime(r.createdAt)}</div>
                </div>
                <ArrowRight className="hidden size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 sm:block" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
