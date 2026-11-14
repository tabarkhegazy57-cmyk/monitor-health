import { FlaskConical } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function SimulatedBadge({ className, label = "Simulated" }: { className?: string; label?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="simulated" className={cn("cursor-help", className)} tabIndex={0}>
          <FlaskConical className="size-3" aria-hidden />
          {label}
        </Badge>
      </TooltipTrigger>
      <TooltipContent className="max-w-60">
        Generated demo data for this prototype. Not from a real sensor, crew member or AI model.
      </TooltipContent>
    </Tooltip>
  );
}
