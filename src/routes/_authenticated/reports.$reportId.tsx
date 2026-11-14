import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, FileDown, Printer } from "lucide-react";

import { FutureFeatureButton } from "@/components/common/future-feature";
import { PageHeader } from "@/components/common/page-header";
import { SimulatedBadge } from "@/components/common/simulated-badge";
import { HAZARD_ICONS, INDICATOR_ICONS } from "@/components/health/indicator-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getHazard } from "@/data/hazards";
import { getIndicator } from "@/data/indicators";
import { useSession } from "@/features/auth/use-session";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { reportQuery } from "@/services/queries";

import { REPORT_TYPE_LABELS } from "./reports.index";

export const Route = createFileRoute("/_authenticated/reports/$reportId")({
  loader: ({ context: { queryClient, session }, params }) =>
    queryClient.ensureQueryData(reportQuery(session, params.reportId)),
  head: ({ params }) => ({
    meta: [
      { title: `Report ${params.reportId} — ASTRA CARE` },
      { name: "description", content: "Detailed simulated health or environment report." },
      { property: "og:title", content: `Report ${params.reportId} — ASTRA CARE` },
      { property: "og:description", content: "Detailed simulated health or environment report." },
    ],
  }),
  component: ReportPage,
});

function ReportPage() {
  const { reportId } = Route.useParams();
  const session = useSession();
  const { data: r } = useSuspenseQuery(reportQuery(session, reportId));

  return (
    <div className="animate-fade-up">
      <Link to="/reports" className="no-print mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Reports
      </Link>
      <PageHeader
        eyebrow={
          <>
            {REPORT_TYPE_LABELS[r.type]} report · <span className="font-mono normal-case tracking-normal">{r.id}</span> <SimulatedBadge />
          </>
        }
        title={r.title}
        description={r.summary}
        actions={
          <div className="no-print flex flex-wrap gap-2">
            <Button variant="subtle" onClick={() => window.print()}>
              <Printer /> Print
            </Button>
            <FutureFeatureButton reason="PDF export will be added together with the real backend.">
              <FileDown /> Export PDF
            </FutureFeatureButton>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <article className="surface-card divide-y">
          {r.sections.map((s) => (
            <section key={s.heading} className="p-5">
              <h2 className="text-base font-semibold">{s.heading}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </section>
          ))}
        </article>
        <aside className="space-y-4">
          <section className="surface-card p-5 text-sm">
            <h2 className="font-semibold">Details</h2>
            <dl className="mt-3 space-y-2.5">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Period</dt>
                <dd className="text-right">
                  {fmtDate(r.periodStart)} – {fmtDate(r.periodEnd)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Created</dt>
                <dd className="text-right">{fmtDateTime(r.createdAt)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Source</dt>
                <dd className="text-right">{r.author}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Astronaut</dt>
                <dd className="font-mono">{session.astronautId}</dd>
              </div>
            </dl>
          </section>
          {(r.indicatorIds.length > 0 || r.hazardIds.length > 0) && (
            <section className="no-print surface-card p-5">
              <h2 className="font-semibold">Covered in this report</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {r.indicatorIds.map((id) => {
                  const Icon = INDICATOR_ICONS[id];
                  return (
                    <Link key={id} to="/health/$indicator" params={{ indicator: id }}>
                      <Badge variant="mint" className="cursor-pointer py-1 hover:bg-accent">
                        <Icon className="size-3" /> {getIndicator(id)?.shortName}
                      </Badge>
                    </Link>
                  );
                })}
                {r.hazardIds.map((id) => {
                  const Icon = HAZARD_ICONS[id];
                  return (
                    <Link key={id} to="/environment" search={{ hazard: id }}>
                      <Badge variant="mint" className="cursor-pointer py-1 hover:bg-accent">
                        <Icon className="size-3" /> {getHazard(id)?.shortName}
                      </Badge>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
          <p className="px-1 text-xs leading-relaxed text-muted-foreground">
            Generated from simulated data. This report is not a medical document.
          </p>
        </aside>
      </div>
    </div>
  );
}
