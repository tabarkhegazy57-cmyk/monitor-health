import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ChevronDown, LayoutDashboard, LogOut } from "lucide-react";

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
import { useSignOut } from "@/features/auth/use-sign-out";
import { profileQuery } from "@/services/queries";

export function UserMenu() {
  const session = useSession();
  const navigate = useNavigate();
  const signOut = useSignOut();
  const { data } = useQuery(profileQuery(session));
  const a = data?.astronaut;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-10 gap-2 px-1.5 sm:px-2" aria-label="Account menu">
          <span className="grid size-8 place-items-center rounded-full bg-primary font-display text-xs font-semibold text-primary-foreground">
            {a?.initials ?? "··"}
          </span>
          <span className="hidden text-left leading-tight md:block">
            <span className="block text-sm font-medium">{a?.name ?? "Loading…"}</span>
            <span className="block font-mono text-[0.68rem] text-muted-foreground">{session.astronautId}</span>
          </span>
          <ChevronDown className="hidden size-4 text-muted-foreground md:block" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <div className="font-display text-sm font-semibold">{a?.name}</div>
          <div className="text-xs text-muted-foreground">
            {a?.rank} · <span className="font-mono">{session.astronautId}</span>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{data?.mission.name}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate({ to: "/overview" })}>
          <LayoutDashboard /> Mission overview
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void signOut()} className="text-coral-ink focus:text-coral-ink">
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
