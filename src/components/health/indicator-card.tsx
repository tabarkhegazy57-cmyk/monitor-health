import { Link } from "@tanstack/react-router";
import { ChevronRight, PlugZap } from "lucide-react";

import { getIndicator } from "@/data/indicators";
import { fmtDateTime, fmtReadingUnit, fmtReadingValue } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { IndicatorSeries } from "@/types/domain";

import { INDICATOR_ICONS } from "./indicator-icon";
import { Sparkline } from "./trend-chart";

export function IndicatorCard({ series, compact = false }: { series: IndicatorSeries; compact?: boolean }) {
  const def = getIndicator(series.indicatorId)!;
  const Icon = INDICATOR_ICONS[def.id];
  const latest = series.readings[series.readings.length - 1];
  const unavailable = series.status === "unavailable";

  return (
    <Link
      to="/health/$indicator"
      params={{ indicator: def.id }}
      className="group surface-card interactive-card flex flex-col p-4"
      aria-label={`${def.name} details`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className={cn("grid size-8 place-items-center rounded-md", unavailable ? "bg-muted text-muted-foreground" : "bg-mint text-mint-foreground")}>
            <Icon className="size-4" aria-hidden />
          </span>
          <span className="text-sm font-medium text-foreground">{def.name}</span>
        </div>
        <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
      </div>

      {unavailable ? (
        <div className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
          <PlugZap className="mt-0.5 size-4 shrink-0 text-coral-ink" aria-hidden />
          <span>Unavailable · {series.device}</span>
        </div>
      ) : latest ? (
        <>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="font-mono text-2xl font-medium tabular text-foreground">{fmtReadingValue(def, latest)}</span>
            <span className="text-sm text-muted-foreground">{fmtReadingUnit(def, latest)}</span>
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {latest.source === "manual" ? "Manual entry · " : ""}
            {fmtDateTime(latest.timestamp)}
          </div>
          {!compact && (
            <div className="mt-2">
              <Sparkline readings={series.readings} />
            </div>
          )}
        </>
      ) : (
        <div className="mt-4 text-sm text-muted-foreground">No readings yet</div>
      )}
    </Link>
  );
}
