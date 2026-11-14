import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("size-9", className)} aria-hidden>
      <rect width="40" height="40" rx="10" className="fill-primary" />
      <ellipse cx="20" cy="20" rx="14" ry="6" transform="rotate(-28 20 20)" className="fill-none stroke-mint" strokeWidth="1.4" opacity="0.9" />
      <path d="M20 12.5v15M12.5 20h15" className="stroke-primary-foreground" strokeWidth="3.2" strokeLinecap="round" />
      <circle cx="31.2" cy="13.6" r="2.1" className="fill-coral" />
    </svg>
  );
}

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      {!compact && (
        <div className="leading-none">
          <div className="font-display text-[1.05rem] font-bold tracking-tight text-teal-deep">
            ASTRA <span className="text-primary">CARE</span>
          </div>
          <div className="mt-1 text-[0.62rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Crew health monitor
          </div>
        </div>
      )}
    </div>
  );
}
