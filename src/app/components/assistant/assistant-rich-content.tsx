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

function sanitizeJsonText(raw: string): string {
  return raw
    .trim()
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'");
}

function parseJsonBlock(raw: string): unknown {
  const trimmed = sanitizeJsonText(raw);
  try {
    return JSON.parse(trimmed);
  } catch {
    const objectMatch = trimmed.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      try {
        return JSON.parse(objectMatch[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^\d.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function normalizeChartPayload(payload: ChartPayload & Record<string, unknown>): ChartPayload | null {
  if (payload.chart && typeof payload.chart === "object") {
    return normalizeChartPayload(payload.chart as ChartPayload & Record<string, unknown>);
  }

  let labels = Array.isArray(payload.labels) ? payload.labels.map(String) : undefined;
  let values = Array.isArray(payload.values) ? payload.values.map(toNumber) : undefined;

  if ((!labels || !values) && Array.isArray(payload.data)) {
    const rows = payload.data as Array<Record<string, unknown>>;
    labels = rows.map((row) => String(row.label ?? row.name ?? row.category ?? ""));
    values = rows.map((row) => toNumber(row.value ?? row.amount ?? row.premium ?? row.count));
  }

  if ((!labels || !values) && Array.isArray(payload.datasets)) {
    const dataset = payload.datasets[0] as Record<string, unknown> | undefined;
    if (dataset) {
      if (!labels && Array.isArray(dataset.labels)) {
        labels = dataset.labels.map(String);
      }
      if (!values) {
        if (Array.isArray(dataset.values)) {
          values = dataset.values.map(toNumber);
        } else if (Array.isArray(dataset.data)) {
          values = dataset.data.map(toNumber);
        }
      }
    }
  }

  if ((!labels || !values) && Array.isArray(payload.series)) {
    const series = payload.series[0] as Record<string, unknown> | undefined;
    if (series) {
      if (!labels && Array.isArray(series.labels)) {
        labels = series.labels.map(String);
      }
      if (!values) {
        if (Array.isArray(series.values)) {
          values = series.values.map(toNumber);
        } else if (Array.isArray(series.data)) {
          values = series.data.map(toNumber);
        }
      }
    }
  }

  if ((!labels || !values) && payload.x && payload.y) {
    if (Array.isArray(payload.x)) labels = payload.x.map(String);
    if (Array.isArray(payload.y)) values = payload.y.map(toNumber);
  }

  if (!labels?.length || !values?.length) return null;

  const chartType = payload.type;
  const type =
    chartType === "line" || chartType === "pie" || chartType === "bar" ? chartType : "bar";

  return {
    type,
    title: typeof payload.title === "string" ? payload.title : undefined,
    labels,
    values,
    colors: Array.isArray(payload.colors) ? payload.colors.map(String) : undefined,
  };
}

function normalizeStatsPayload(payload: StatsPayload & Record<string, unknown>): StatsPayload | null {
  if (Array.isArray(payload.items)) {
    return { type: "stats", items: payload.items as StatsPayload["items"] };
  }
  if (Array.isArray(payload.stats)) {
    return { type: "stats", items: payload.stats as StatsPayload["items"] };
  }
  return null;
}

function normalizeComparePayload(
  payload: ComparePayload & Record<string, unknown>,
): ComparePayload | null {
  if (Array.isArray(payload.items)) {
    return { type: "compare", items: payload.items as ComparePayload["items"] };
  }
  if (Array.isArray(payload.cards)) {
    return { type: "compare", items: payload.cards as ComparePayload["items"] };
  }
  if (Array.isArray(payload.policies)) {
    return { type: "compare", items: payload.policies as ComparePayload["items"] };
  }
  return null;
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
    <div className="my-4 overflow-hidden rounded-xl border border-border/70 bg-popover p-3 shadow-sm">
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
          className="rounded-xl border border-border/70 bg-popover px-3 py-3 shadow-sm"
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
          className="rounded-xl border border-border/70 bg-popover px-4 py-3 shadow-sm"
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
    const payload = parsed as ChartPayload & StatsPayload & ComparePayload & Record<string, unknown>;

    if (lang === "stats" || payload.type === "stats") {
      const stats = normalizeStatsPayload(payload);
      if (stats) return <AssistantStatsBlock payload={stats} />;
    }
    if (lang === "compare" || payload.type === "compare") {
      const compare = normalizeComparePayload(payload);
      if (compare) return <AssistantCompareBlock payload={compare} />;
    }
    if (lang === "chart" || lang === "json" || payload.type === "bar" || payload.type === "line" || payload.type === "pie") {
      const chart = normalizeChartPayload(payload);
      if (chart) return <AssistantChartBlock payload={chart} />;
    }
    if (payload.labels || payload.values || payload.data) {
      const chart = normalizeChartPayload(payload);
      if (chart) return <AssistantChartBlock payload={chart} />;
    }
    if (payload.items && payload.type !== "stats" && payload.type !== "compare") {
      const compare = normalizeComparePayload(payload);
      if (compare) return <AssistantCompareBlock payload={compare} />;
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
