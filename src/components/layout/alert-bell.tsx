import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, CheckCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "@/features/auth/use-session";
import { fmtDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { api } from "@/services/api";
import { alertsQuery, keys } from "@/services/queries";

export function AlertBell() {
  const session = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: alerts = [] } = useQuery(alertsQuery(session));
  const unread = alerts.filter((a) => !a.read);
  const markAll = useMutation({
    mutationFn: () => api.alerts.markAllRead(session.token),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.alerts(session) }),
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`Alerts, ${unread.length} unread`}>
          <Bell className="size-[1.15rem]" />
          {unread.length > 0 && (
            <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-coral px-1 text-[0.6rem] font-semibold leading-4 text-coral-foreground">
              {unread.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span className="font-display">Notifications</span>
          <span className="text-xs font-normal text-coral-ink">Simulated</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {alerts.slice(0, 5).map((a) => (
          <DropdownMenuItem
            key={a.id}
            className="flex cursor-pointer flex-col items-start gap-0.5 py-2"
            onSelect={() => navigate({ to: "/alerts", search: { alert: a.id } })}
          >
            <span className="flex w-full items-start gap-2">
              <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", a.read ? "bg-transparent" : "bg-coral")} />
              <span className={cn("text-sm leading-snug", !a.read && "font-medium")}>{a.title}</span>
            </span>
            <span className="pl-3.5 text-xs text-muted-foreground">{fmtDateTime(a.createdAt)}</span>
          </DropdownMenuItem>
        ))}
        {alerts.length === 0 && <div className="px-2 py-6 text-center text-sm text-muted-foreground">No alerts</div>}
        <DropdownMenuSeparator />
        <div className="flex items-center justify-between gap-2 p-1">
          <Button
            variant="ghost"
            size="sm"
            disabled={unread.length === 0 || markAll.isPending}
            onClick={() => markAll.mutate()}
          >
            <CheckCheck /> Mark all read
          </Button>
          <Button asChild variant="soft" size="sm">
            <Link to="/alerts" search={{}}>View all</Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
