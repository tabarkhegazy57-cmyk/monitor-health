import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { FileText, Search } from "lucide-react";
import { useEffect, useState } from "react";

import { HAZARD_ICONS, INDICATOR_ICONS } from "@/components/health/indicator-icon";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { HAZARDS } from "@/data/hazards";
import { INDICATORS } from "@/data/indicators";
import { useSession } from "@/features/auth/use-session";
import { fmtDate } from "@/lib/format";
import { reportsQuery } from "@/services/queries";

import { NAV_ITEMS } from "./nav-items";

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const session = useSession();
  const reports = useQuery({ ...reportsQuery(session), enabled: open });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (fn: () => void) => {
    setOpen(false);
    fn();
  };

  return (
    <>
      <Button
        variant="subtle"
        onClick={() => setOpen(true)}
        className="h-9 w-9 justify-center px-0 text-muted-foreground sm:w-56 sm:justify-start sm:px-3"
        aria-label="Search"
      >
        <Search />
        <span className="hidden flex-1 text-left font-normal sm:inline">Search…</span>
        <kbd className="hidden rounded border bg-muted px-1.5 font-mono text-[0.65rem] sm:inline">⌘K</kbd>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0 sm:max-w-lg">
          <DialogTitle className="sr-only">Search ASTRA CARE</DialogTitle>
          <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-2.5">
            <CommandInput placeholder="Search your profile…" />
            <CommandList className="max-h-[60vh]">
              <CommandEmpty>No matches in your profile.</CommandEmpty>
              <CommandGroup heading="Pages">
                {NAV_ITEMS.map((item) => (
                  <CommandItem key={item.to} value={`page ${item.label}`} onSelect={() => go(() => navigate({ to: item.to }))}>
                    <item.icon className="mr-2 size-4" /> {item.label}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandGroup heading="Health indicators">
                {INDICATORS.map((def) => {
                  const Icon = INDICATOR_ICONS[def.id];
                  return (
                    <CommandItem
                      key={def.id}
                      value={`indicator ${def.name}`}
                      onSelect={() => go(() => navigate({ to: "/health/$indicator", params: { indicator: def.id } }))}
                    >
                      <Icon className="mr-2 size-4" /> {def.name}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
              <CommandGroup heading="Space environment">
                {HAZARDS.map((h) => {
                  const Icon = HAZARD_ICONS[h.id];
                  return (
                    <CommandItem
                      key={h.id}
                      value={`hazard ${h.name}`}
                      onSelect={() => go(() => navigate({ to: "/environment", search: { hazard: h.id } }))}
                    >
                      <Icon className="mr-2 size-4" /> {h.name}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
              {reports.data && (
                <CommandGroup heading="Reports">
                  {reports.data.map((r) => (
                    <CommandItem
                      key={r.id}
                      value={`report ${r.title} ${r.id} ${fmtDate(r.createdAt)}`}
                      onSelect={() => go(() => navigate({ to: "/reports/$reportId", params: { reportId: r.id } }))}
                    >
                      <FileText className="mr-2 size-4" /> {r.title}
                      <CommandShortcut>{fmtDate(r.createdAt)}</CommandShortcut>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
