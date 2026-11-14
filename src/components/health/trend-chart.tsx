import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";

import { MOOD_LABELS } from "@/data/indicators";
import { fmtDateTime, fmtDayMonth, fmtReadingUnit, fmtReadingValue } from "@/lib/format";
import type { IndicatorDefinition, Reading } from "@/types/domain";

interface Point {
  t: string;
  label: string;
  value: number;
  secondary?: number | undefined;
  source: Reading["source"];
}

function ChartTooltip({ active, payload, def }: TooltipProps<number, string> & { def: IndicatorDefinition }) {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload as Point | undefined;
  if (!p) return null;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-raised">
      <div className="text-muted-foreground">{fmtDateTime(p.t)}</div>
      <div className="mt-0.5 font-mono text-sm font-medium tabular text-foreground">
        {fmtReadingValue(def, p)} <span className="text-muted-foreground">{fmtReadingUnit(def, p)}</span>
      </div>
      <div className="mt-0.5 text-[0.65rem] uppercase tracking-wide text-coral-ink">
        {p.source === "manual" ? "Manual entry" : "Simulated"}
      </div>
    </div>
  );
}

const axis = { fontSize: 11, fill: "var(--color-muted-foreground)" };

export function TrendChart({
  def,
  readings,
  height = 280,
}: {
  def: IndicatorDefinition;
  readings: Reading[];
  height?: number;
}) {
  const data: Point[] = readings.map((r) => ({
    t: r.timestamp,
    label: fmtDayMonth(r.timestamp),
    value: r.value,
    secondary: r.secondary,
    source: r.source,
  }));

  // Recharts only detects axes passed as direct children or arrays, not fragments.
  const common = [
    <CartesianGrid key="grid" stroke="var(--color-border)" strokeDasharray="3 4" vertical={false} />,
    <XAxis key="x" dataKey="label" tick={axis} tickLine={false} axisLine={false} minTickGap={24} />,
    def.valueKind === "scale" ? (
      <YAxis
        key="y"
        domain={[1, 5]}
        ticks={[1, 2, 3, 4, 5]}
        tick={axis}
        tickLine={false}
        axisLine={false}
        width={70}
        tickFormatter={(v: number) => MOOD_LABELS[v] ?? String(v)}
      />
    ) : (
      <YAxis key="y" domain={["auto", "auto"]} tick={axis} tickLine={false} axisLine={false} width={44} />
    ),
    <Tooltip key="tt" content={<ChartTooltip def={def} />} cursor={{ stroke: "var(--color-ring)", strokeDasharray: "3 3" }} />,
  ];

  return (
    <div style={{ height }} role="img" aria-label={`${def.name} trend chart with ${readings.length} readings`}>
      <ResponsiveContainer width="100%" height="100%">
        {def.valueKind === "pressure" ? (
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            {common}
            <Line type="monotone" dataKey="value" name="Systolic" stroke="var(--color-chart-1)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} animationDuration={600} />
            <Line type="monotone" dataKey="secondary" name="Diastolic" stroke="var(--color-chart-2)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} animationDuration={600} />
          </LineChart>
        ) : (
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={`fill-${def.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.22} />
                <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
              </linearGradient>
            </defs>
            {common}
            <Area
              type={def.valueKind === "scale" ? "stepAfter" : "monotone"}
              dataKey="value"
              stroke="var(--color-chart-1)"
              strokeWidth={2}
              fill={`url(#fill-${def.id})`}
              dot={def.valueKind === "scale" ? { r: 2.5, fill: "var(--color-chart-1)" } : false}
              activeDot={{ r: 4 }}
              animationDuration={600}
            />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

export function Sparkline({ readings, height = 36 }: { readings: Reading[]; height?: number }) {
  const data = readings.slice(-14).map((r) => ({ v: r.value }));
  if (data.length < 2) return <div style={{ height }} />;
  return (
    <div style={{ height }} aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 2, bottom: 4, left: 2 }}>
          <YAxis hide domain={["dataMin", "dataMax"]} />
          <Line type="monotone" dataKey="v" stroke="var(--color-chart-1)" strokeWidth={1.6} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
