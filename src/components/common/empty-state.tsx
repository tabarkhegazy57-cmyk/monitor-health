import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  tone = "default",
}: {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  tone?: "default" | "coral";
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-10 text-center",
        tone === "coral" ? "border-coral/40 bg-coral-soft/50" : "bg-surface",
        className,
      )}
    >
      <span
        className={cn(
          "mb-3 grid size-11 place-items-center rounded-full",
          tone === "coral" ? "bg-coral-soft text-coral-ink" : "bg-mint text-mint-foreground",
        )}
      >
        <Icon className="size-5" aria-hidden />
      </span>
      <p className="font-display text-base font-semibold">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
