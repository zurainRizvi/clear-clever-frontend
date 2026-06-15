import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { motion, useReducedMotion } from "motion/react";
import { AnimatedNumber } from "./ml-insight-ui";

const SEGMENT_META = [
  {
    key: "included",
    label: "Included",
    color: "#10B981",
    darkColor: "#34D399",
    description: "Benefits fully covered by this policy",
  },
  {
    key: "valued",
    label: "Limits & values",
    color: "#2563EB",
    darkColor: "#60A5FA",
    description: "Covered with specific limits or monetary caps",
  },
  {
    key: "excluded",
    label: "Not included",
    color: "#94A3B8",
    darkColor: "#64748B",
    description: "Explicitly not covered under this plan",
  },
] as const;

type CoverageStats = {
  included: number;
  excluded: number;
  valued: number;
};

function CoverageTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: { name: string; value: number; description: string } }>;
}) {
  if (!active || !payload?.[0]) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-popover-foreground">{item.name}</p>
      <p className="text-muted-foreground mt-0.5">
        {item.value} feature{item.value === 1 ? "" : "s"}
      </p>
      <p className="text-muted-foreground mt-1 max-w-[180px] leading-relaxed">{item.description}</p>
    </div>
  );
}

export function CoverageBreakdownChart({ included, excluded, valued }: CoverageStats) {
  const reducedMotion = useReducedMotion();
  const total = Math.max(included + excluded + valued, 1);
  const coveredCount = included + valued;
  const coveredPct = Math.round((coveredCount / total) * 100);

  const chartData = SEGMENT_META.map((segment) => ({
    name: segment.label,
    value: segment.key === "included" ? included : segment.key === "valued" ? valued : excluded,
    color: segment.color,
    darkColor: segment.darkColor,
    description: segment.description,
  })).filter((segment) => segment.value > 0);

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
        <div className="relative mx-auto sm:mx-0 h-44 w-44 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<CoverageTooltip />} />
              <Pie
                data={chartData}
                dataKey="value"
                innerRadius={52}
                outerRadius={76}
                paddingAngle={chartData.length > 1 ? 3 : 0}
                stroke="none"
                isAnimationActive={!reducedMotion}
                animationDuration={900}
              >
                {chartData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={entry.color}
                    className="dark:opacity-90"
                    style={{ fill: entry.color }}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
            <AnimatedNumber
              value={coveredPct}
              className="text-2xl font-bold tabular-nums text-foreground leading-none"
            />
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mt-1">
              Covered
            </span>
            <span className="text-[11px] text-muted-foreground mt-0.5">
              {coveredCount} of {total} features
            </span>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Coverage at a glance</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              How this policy splits benefits into full cover, limits, and exclusions across{" "}
              {total} listed features.
            </p>
          </div>
          <div className="space-y-2">
            {SEGMENT_META.map((segment) => {
              const count =
                segment.key === "included"
                  ? included
                  : segment.key === "valued"
                    ? valued
                    : excluded;
              if (count === 0) return null;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={segment.key} className="space-y-1">
                  <div className="flex items-center justify-between text-sm gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: segment.color }}
                      />
                      <span className="font-medium text-foreground truncate">{segment.label}</span>
                    </div>
                    <span className="text-muted-foreground tabular-nums shrink-0">
                      {count} · {pct}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: segment.color }}
                      initial={{ width: reducedMotion ? `${pct}%` : "0%" }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: reducedMotion ? 0 : 0.75, ease: "easeOut" }}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {segment.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
