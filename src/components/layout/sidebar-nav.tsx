import { Link } from "@tanstack/react-router";

import { Logo, LogoMark } from "@/components/brand/logo";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { NAV_ITEMS } from "./nav-items";

export function SidebarNav({
  collapsed = false,
  unreadAlerts = 0,
  onNavigate,
}: {
  collapsed?: boolean;
  unreadAlerts?: number;
  onNavigate?: () => void;
}) {
  const groups = ["Crew member", "Mission"] as const;
  return (
    <nav aria-label="Main" className="flex h-full flex-col">
      <div className={cn("flex h-16 items-center border-b border-sidebar-border", collapsed ? "justify-center px-2" : "px-5")}>
        <Link to="/overview" onClick={onNavigate} aria-label="ASTRA CARE home">
          {collapsed ? <LogoMark /> : <Logo />}
        </Link>
      </div>
      <div className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {groups.map((group) => (
          <div key={group}>
            {!collapsed && (
              <div className="mb-2 px-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {group}
              </div>
            )}
            <ul className="space-y-0.5">
              {NAV_ITEMS.filter((i) => i.group === group).map((item) => {
                const Icon = item.icon;
                const badge = item.to === "/alerts" && unreadAlerts > 0 ? unreadAlerts : null;
                const link = (
                  <Link
                    to={item.to}
                    onClick={onNavigate}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-md px-2.5 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      collapsed && "justify-center px-0",
                    )}
                    activeProps={{
                      className:
                        "bg-sidebar-accent font-medium text-sidebar-accent-foreground before:absolute before:inset-y-1.5 before:-left-3 before:w-[3px] before:rounded-r before:bg-sidebar-primary",
                    }}
                    aria-label={collapsed ? item.label : undefined}
                  >
                    <Icon className="size-[1.1rem] shrink-0" aria-hidden />
                    {!collapsed && <span className="flex-1">{item.label}</span>}
                    {badge !== null && (
                      <span
                        className={cn(
                          "grid min-w-5 place-items-center rounded-full bg-coral px-1.5 text-[0.65rem] font-semibold text-coral-foreground",
                          collapsed && "absolute right-1 top-1 min-w-4 px-1",
                        )}
                      >
                        {badge}
                      </span>
                    )}
                  </Link>
                );
                return (
                  <li key={item.to}>
                    {collapsed ? (
                      <Tooltip>
                        <TooltipTrigger asChild>{link}</TooltipTrigger>
                        <TooltipContent side="right">{item.label}</TooltipContent>
                      </Tooltip>
                    ) : (
                      link
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      {!collapsed && (
        <div className="m-3 rounded-md border border-dashed border-coral/40 bg-coral-soft/60 p-3 text-xs leading-relaxed text-coral-ink">
          <strong className="font-semibold">Prototype.</strong> All readings, alerts and assessments are simulated. No
          real sensors, backend or AI model are connected.
        </div>
      )}
    </nav>
  );
}
