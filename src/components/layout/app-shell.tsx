import { useQuery } from "@tanstack/react-query";
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useState, type ReactNode } from "react";

import { LogoMark } from "@/components/brand/logo";
import { SimulatedBadge } from "@/components/common/simulated-badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { useSession } from "@/features/auth/use-session";
import { cn } from "@/lib/utils";
import { alertsQuery } from "@/services/queries";

import { AlertBell } from "./alert-bell";
import { GlobalSearch } from "./global-search";
import { SidebarNav } from "./sidebar-nav";
import { UserMenu } from "./user-menu";

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const session = useSession();
  const { data: alerts = [] } = useQuery(alertsQuery(session));
  const unread = alerts.filter((a) => !a.read).length;

  return (
    <div className="min-h-screen bg-background">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden border-r border-sidebar-border bg-sidebar transition-[width] duration-200 lg:block",
          collapsed ? "w-[72px]" : "w-64",
        )}
      >
        <SidebarNav collapsed={collapsed} unreadAlerts={unread} />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 bg-sidebar p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">Main navigation for ASTRA CARE</SheetDescription>
          <SidebarNav unreadAlerts={unread} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className={cn("transition-[padding] duration-200", collapsed ? "lg:pl-[72px]" : "lg:pl-64")}>
        <header className="no-print sticky top-0 z-20 flex h-16 items-center gap-2 border-b bg-background/85 px-4 backdrop-blur-md sm:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu className="size-5" />
          </Button>
          <LogoMark className="size-8 lg:hidden" />
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:inline-flex"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen className="size-[1.15rem]" /> : <PanelLeftClose className="size-[1.15rem]" />}
          </Button>
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <SimulatedBadge label="Demo data" className="hidden md:inline-flex" />
            <GlobalSearch />
            <AlertBell />
            <UserMenu />
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1320px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
