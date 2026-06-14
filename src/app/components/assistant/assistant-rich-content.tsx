import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../ui/chart";
import { cn } from "../ui/utils";

type ChartPayload = {
  type?: "bar" | "line" | "pie";
  title?: string;
  labels?: string[];
  values?: number[];
  colors?: string[];
};

type StatsPayload = {
  type: "stats";
  items?: Array<{ label: string; value: string; hint?: string }>;
};

type ComparePayload = {
  type: "compare";
  items?: Array<{
    title: string;
    subtitle?: string;
    highlights?: string[];
    badge?: string;
  }>;
};

const DEFAULT_COLORS = ["#2563EB", "#06B6D4", "#8B5CF6", "#F59E0B", "#10B981"];

function parseJsonBlock(raw: string): unknown {
  try {
    return JSON.parse(raw.trim());
  } catch {
    return null;
  }
}

function AssistantChartBlock({ payload }: { payload: ChartPayload }) {
  const labels = payload.labels ?? [];
  const values = payload.values ?? [];
  const chartType = payload.type ?? "bar";
  const colors = payload.colors ?? DEFAULT_COLORS;

  const data = labels.map((label, index) => ({
    label,
    value: values[index] ?? 0,
  }));

  if (data.length === 0) return null;

  const chartConfig = Object.fromEntries(
    data.map((row, index) => [
      row.label,
      { label: row.label, color: colors[index % colors.length] },
    ]),
  );

  return (
    <div className="my-4 overflow-hidden rounded-xl border border-border/70 bg-card/80 p-3 shadow-sm">
      {payload.title ? (
        <p className="mb-3 text-sm font-semibold text-foreground">{payload.title}</p>
      ) : null}
      <ChartContainer config={chartConfig} className="aspect-[16/9] min-h-[180px] w-full">
        {chartType === "line" ? (
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
            <YAxis tickLine={false} axisLine={false} fontSize={11} width={40} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={colors[0]}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        ) : chartType === "pie" ? (
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie data={data} dataKey="value" nameKey="label" innerRadius={42} outerRadius={72}>
              {data.map((row, index) => (
                <Cell key={row.label} fill={colors[index % colors.length]} />
              ))}
            </Pie>
          </PieChart>
        ) : (
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
            <YAxis tickLine={false} axisLine={false} fontSize={11} width={40} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {data.map((row, index) => (
                <Cell key={row.label} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        )}
      </ChartContainer>
    </div>
  );
}

function AssistantStatsBlock({ payload }: { payload: StatsPayload }) {
  const items = payload.items ?? [];
  if (items.length === 0) return null;

  return (
    <div className="my-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-border/70 bg-gradient-to-br from-card to-muted/40 px-3 py-3 shadow-sm"
        >
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {item.label}
          </p>
          <p className="mt-1 text-lg font-bold text-foreground">{item.value}</p>
          {item.hint ? <p className="text-xs text-muted-foreground">{item.hint}</p> : null}
        </div>
      ))}
    </div>
  );
}

function AssistantCompareBlock({ payload }: { payload: ComparePayload }) {
  const items = payload.items ?? [];
  if (items.length === 0) return null;

  return (
    <div className="my-4 grid gap-2 sm:grid-cols-2">
      {items.map((item) => (
        <div
          key={item.title}
          className="rounded-xl border border-border/70 bg-card px-4 py-3 shadow-sm"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-foreground">{item.title}</p>
              {item.subtitle ? (
                <p className="text-xs text-muted-foreground">{item.subtitle}</p>
              ) : null}
            </div>
            {item.badge ? (
              <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                {item.badge}
              </span>
            ) : null}
          </div>
          {item.highlights && item.highlights.length > 0 ? (
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              {item.highlights.map((line) => (
                <li key={line} className="flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-primary" />
                  {line}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function AssistantRichCodeBlock({
  language,
  code,
}: {
  language?: string;
  code: string;
}) {
  const lang = (language ?? "").toLowerCase();
  const parsed = parseJsonBlock(code);

  if (parsed && typeof parsed === "object") {
    const payload = parsed as ChartPayload & StatsPayload & ComparePayload;

    if (lang === "stats" || payload.type === "stats") {
      return <AssistantStatsBlock payload={payload as StatsPayload} />;
    }
    if (lang === "compare" || payload.type === "compare") {
      return <AssistantCompareBlock payload={payload as ComparePayload} />;
    }
    if (lang === "chart" || payload.labels || payload.values) {
      return <AssistantChartBlock payload={payload as ChartPayload} />;
    }
  }

  return (
    <pre
      className={cn(
        "my-3 overflow-x-auto rounded-lg border border-border/60 bg-muted/50 p-3 text-xs",
      )}
    >
      <code>{code}</code>
    </pre>
  );
}
