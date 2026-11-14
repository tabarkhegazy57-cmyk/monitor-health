import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, BellOff, CheckCheck, HeartPulse, Mail, MailOpen, Orbit, Search, Settings2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { SimulatedBadge } from "@/components/common/simulated-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getHazard } from "@/data/hazards";
import { getIndicator } from "@/data/indicators";
import { useSession } from "@/features/auth/use-session";
import { fmtDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { api } from "@/services/api";
import { alertsQuery, keys } from "@/services/queries";
import type { Alert, AlertCategory } from "@/types/domain";

type Filter = "all" | "unread" | AlertCategory;
const FILTERS: Filter[] = ["all", "unread", "health", "environment", "system"];

export const Route = createFileRoute("/_authenticated/alerts")({
  validateSearch: (s: Record<string, unknown>): { alert?: string | undefined; filter?: Filter | undefined } => ({
    alert: typeof s["alert"] === "string" ? s["alert"] : undefined,
    filter: FILTERS.includes(s["filter"] as Filter) && s["filter"] !== "all" ? (s["filter"] as Filter) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Alerts — ASTRA CARE" },
      { name: "description", content: "Your notification center with health, environment and system alerts." },
      { property: "og:title", content: "Alerts — ASTRA CARE" },
      { property: "og:description", content: "Simulated alert history with read and unread states." },
    ],
  }),
  loader: ({ context: { queryClient, session } }) => queryClient.ensureQueryData(alertsQuery(session)),
  component: AlertsPage,
});

const CATEGORY_META: Record<AlertCategory, { label: string; icon: typeof HeartPulse }> = {
  health: { label: "Health", icon: HeartPulse },
  environment: { label: "Environment", icon: Orbit },
  system: { label: "System", icon: Settings2 },
};

function AlertsPage() {
  const session = useSession();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/alerts" });
  const queryClient = useQueryClient();
  const { data: alerts } = useSuspenseQuery(alertsQuery(session));
  const [q, setQ] = useState("");
  const filter = search.filter ?? "all";

  const setRead = useMutation({
    mutationFn: ({ id, read }: { id: string; read: boolean }) => api.alerts.setRead(session.token, id, read),
    onMutate: async ({ id, read }) => {
      await queryClient.cancelQueries({ queryKey: keys.alerts(session) });
      queryClient.setQueryData<Alert[]>(keys.alerts(session), (old) => old?.map((a) => (a.id === id ? { ...a, read } : a)));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: keys.alerts(session) }),
  });
  const markAll = useMutation({
    mutationFn: () => api.alerts.markAllRead(session.token),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: keys.alerts(session) });
      toast.success("All alerts marked as read");
    },
  });

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return alerts.filter((a) => {
      if (filter === "unread" && a.read) return false;
      if (filter !== "all" && filter !== "unread" && a.category !== filter) return false;
      if (term && !`${a.title} ${a.message}`.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [alerts, filter, q]);

  const open = alerts.find((a) => a.id === search.alert);
  const unread = alerts.filter((a) => !a.read).length;

  // Opening an alert marks it as read.
  useEffect(() => {
    if (open && !open.read) setRead.mutate({ id: open.id, read: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open?.id]);

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow={
          <>
            Notification center <SimulatedBadge />
          </>
        }
        title="Alerts"
        description="Simulated notices about your readings, mission environment and the system. Real alerts would be marked differently."
        actions={
          <Button variant="subtle" disabled={unread === 0 || markAll.isPending} onClick={() => markAll.mutate()}>
            <CheckCheck /> Mark all read
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Tabs value={filter} onValueChange={(v) => navigate({ search: (p) => ({ ...p, filter: v === "all" ? undefined : (v as Filter) }) })}>
          <TabsList className="h-auto flex-wrap">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread ({unread})</TabsTrigger>
            <TabsTrigger value="health">Health</TabsTrigger>
            <TabsTrigger value="environment">Environment</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative md:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search alerts" className="bg-card pl-9" aria-label="Search alerts" />
        </div>
      </div>

      {shown.length === 0 ? (
        <EmptyState
          icon={BellOff}
          title={q ? "No alerts match your search" : "Nothing here"}
          description={q ? "Try another word or clear the search." : "There are no alerts in this view."}
          action={
            q ? (
              <Button variant="outline" onClick={() => setQ("")}>
                Clear search
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className="surface-card divide-y overflow-hidden">
          {shown.map((a) => {
            const meta = CATEGORY_META[a.category];
            return (
              <li key={a.id} className={cn("group flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-surface sm:px-5", !a.read && "bg-accent/25")}>
                <span className={cn("mt-2 size-2 shrink-0 rounded-full", a.read ? "bg-transparent" : "bg-coral")} aria-hidden />
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
                  <meta.icon className="size-4" aria-hidden />
                </span>
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => navigate({ search: (p) => ({ ...p, alert: a.id }) })}
                >
                  <span className={cn("block text-sm", !a.read && "font-semibold")}>{a.title}</span>
                  <span className="mt-0.5 line-clamp-1 block text-sm text-muted-foreground">{a.message}</span>
                  <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {meta.label} · {fmtDateTime(a.createdAt)}
                    <span className="sr-only">{a.read ? "Read" : "Unread"}</span>
                  </span>
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={a.read ? "Mark as unread" : "Mark as read"}
                  title={a.read ? "Mark as unread" : "Mark as read"}
                  onClick={() => setRead.mutate({ id: a.id, read: !a.read })}
                >
                  {a.read ? <Mail /> : <MailOpen />}
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <Sheet open={!!open} onOpenChange={(o) => !o && navigate({ search: (p) => ({ ...p, alert: undefined }) })}>
        <SheetContent className="w-full sm:max-w-md">
          {open && (
            <>
              <SheetHeader className="text-left">
                <div className="flex items-center gap-2">
                  <SimulatedBadge label="Simulated alert" />
                  <span className="text-xs text-muted-foreground">{CATEGORY_META[open.category].label}</span>
                </div>
                <SheetTitle className="font-display text-xl">{open.title}</SheetTitle>
                <SheetDescription>{fmtDateTime(open.createdAt)}</SheetDescription>
              </SheetHeader>
              <p className="mt-6 text-sm leading-relaxed">{open.message}</p>
              <div className="mt-6 space-y-2">
                {open.indicatorId && (
                  <Button asChild variant="soft" className="w-full justify-between">
                    <Link to="/health/$indicator" params={{ indicator: open.indicatorId }}>
                      Open {getIndicator(open.indicatorId)?.name} <ArrowRight />
                    </Link>
                  </Button>
                )}
                {open.hazardId && (
                  <Button asChild variant="soft" className="w-full justify-between">
                    <Link to="/environment" search={{ hazard: open.hazardId }}>
                      Open {getHazard(open.hazardId)?.name} <ArrowRight />
                    </Link>
                  </Button>
                )}
                <Button variant="outline" className="w-full" onClick={() => setRead.mutate({ id: open.id, read: !open.read })}>
                  {open.read ? <Mail /> : <MailOpen />} Mark as {open.read ? "unread" : "read"}
                </Button>
              </div>
              <p className="mt-6 text-xs text-muted-foreground">Alert ID <span className="font-mono">{open.id}</span></p>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
