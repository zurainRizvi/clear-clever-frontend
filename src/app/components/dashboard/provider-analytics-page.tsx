import { useCallback, useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { Link } from "react-router";
import {
  AlertTriangle,
  BadgePercent,
  BrainCircuit,
  Clock3,
  Download,
  Droplets,
  Loader2,
  ShieldCheck,
  Sparkles,
  Star,
  type LucideIcon,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { AnimatedPage } from "../ui/animated-page";
import { DashboardStatsCarousel, type DashboardStatItem } from "../ui/dashboard-stats-carousel";
import { fadeUpItem } from "@/lib/motion-presets";
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
  type DotProps,
} from "recharts";
import {
  fetchInsurerAnalytics,
  type InsurerAnalyticsPayload,
  type InsurerAnalyticsTrend,
} from "@/lib/insurer-api";
import { ApiError } from "@/lib/api";
import {
  defaultProviderRange,
  parseRangeFromApi,
  toRangeQuery,
  type DateRangeValue,
} from "@/lib/provider-date-range";
import { ProviderDateRangePicker } from "./provider-date-range-picker";
import { PROVIDER_PAGE_CLASS, PROVIDER_THEME } from "./provider-portal-theme";
import { toast } from "sonner";

const METRIC_ICONS: Record<string, LucideIcon> = {
  "shield-check": ShieldCheck,
  "badge-percent": BadgePercent,
  "clock-3": Clock3,
  star: Star,
  droplets: Droplets,
};

const INSIGHT_STYLES = {
  purple:
    "border-violet-100 bg-violet-50/40 dark:border-violet-900/40 dark:bg-violet-950/30",
  orange:
    "border-amber-100 bg-amber-50/40 dark:border-amber-900/40 dark:bg-amber-950/30",
  green:
    "border-emerald-100 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/30",
  blue: "border-blue-100 bg-blue-50/40 dark:border-blue-900/40 dark:bg-blue-950/30",
} as const;

const INTEREST_DOT_OFFSETS: Record<string, number> = {
  home: -10,
  auto: -4,
  life: 4,
  pet: 10,
};

const INTEREST_LINE_DASHES: Record<string, string | undefined> = {
  home: undefined,
  auto: "5 4",
  life: "2 3",
  pet: undefined,
};

function InterestTrendDot({
  cx,
  cy,
  stroke,
  payload,
  dataKey,
}: DotProps & { dataKey?: string | number; payload?: Record<string, number> }) {
  const key = String(dataKey ?? "");
  if (cx == null || cy == null || !payload) return null;
  const value = payload[key];
  if (value == null || value <= 0) return null;

  return (
    <circle
      cx={cx + (INTEREST_DOT_OFFSETS[key] ?? 0)}
      cy={cy}
      r={4}
      fill={stroke}
      stroke="var(--popover)"
      strokeWidth={2}
    />
  );
}

function useChartColors() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  return {
    grid: isDark ? "rgba(148, 163, 184, 0.12)" : "#F1F5F9",
    axis: isDark ? "#94A3B8" : "#64748B",
    gaugeTrack: isDark ? "rgba(148, 163, 184, 0.2)" : "#E2E8F0",
    tooltipBg: isDark ? "#111827" : "#FFFFFF",
    tooltipBorder: isDark ? "rgba(255,255,255,0.12)" : "#E2E8F0",
    tooltipText: isDark ? "#F8FAFC" : "#0F172A",
  };
}

const PORTAL_CARD_CLASS = "provider-portal-card p-5 border bg-white min-w-0";

function trendColor(trend: InsurerAnalyticsTrend): string {
  if (trend === "up" || trend === "down-positive") return "text-emerald-600";
  if (trend === "down") return "text-amber-600";
  return "text-slate-500";
}

function ScoreGauge({
  score,
  label,
  trackColor,
}: {
  score: number;
  label: string;
  trackColor: string;
}) {
  const reducedMotion = useReducedMotion();
  const pct = Math.min(100, Math.max(0, score));
  return (
    <div className="flex flex-col items-center py-4">
      <motion.div
        initial={{ background: `conic-gradient(#2563EB 0deg, ${trackColor} 0deg)` }}
        animate={{ background: `conic-gradient(#2563EB ${pct * 3.6}deg, ${trackColor} 0deg)` }}
        transition={{ duration: reducedMotion ? 0 : 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-36 h-36 rounded-full flex items-center justify-center"
      >
        <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-card shadow-inner">
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: reducedMotion ? 0 : 0.4 }}
            className="text-3xl font-bold text-slate-900"
          >
            {score}
          </motion.span>
          <span className="text-xs text-slate-500">/ 100</span>
        </div>
      </motion.div>
      <p className="mt-3 font-semibold text-slate-900">{label}</p>
    </div>
  );
}

function statusPill(status: string) {
  if (status === "Strong") return "bg-emerald-50 text-emerald-700";
  if (status === "Average") return "bg-amber-50 text-amber-700";
  return "bg-red-50 text-red-600";
}

export function ProviderAnalyticsPage() {
  const chartColors = useChartColors();
  const [range, setRange] = useState<DateRangeValue>(defaultProviderRange);
  const [analytics, setAnalytics] = useState<InsurerAnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportFlash, setExportFlash] = useState(false);

  const cardStyle = {
    borderRadius: PROVIDER_THEME.radius,
    borderColor: PROVIDER_THEME.border,
    boxShadow: PROVIDER_THEME.shadow,
  };

  const load = useCallback(async (r: DateRangeValue) => {
    setLoading(true);
    try {
      const q = toRangeQuery(r);
      const data = await fetchInsurerAnalytics(q);
      setAnalytics(data.analytics);
      setRange(parseRangeFromApi(data.analytics.dateRange.from, data.analytics.dateRange.to));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not load analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(range);
  }, []);

  const handleRangeChange = (next: DateRangeValue) => {
    setRange(next);
    void load(next);
  };

  const interestChartData = useMemo(() => {
    if (!analytics) return [];
    return analytics.interestTrends.xAxis.map((label, i) => {
      const row: Record<string, string | number> = { label };
      for (const ds of analytics.interestTrends.datasets) {
        row[ds.key] = ds.values[i] ?? 0;
      }
      return row;
    });
  }, [analytics]);

  const revenueChartData = useMemo(() => {
    if (!analytics) return [];
    return analytics.revenue.xAxis.map((label, i) => ({
      label,
      revenue: analytics.revenue.chartValues[i] ?? 0,
    }));
  }, [analytics]);

  const exportReport = () => {
    if (!analytics) return;
    const blob = new Blob([JSON.stringify(analytics, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clearclever-analytics-${analytics.dateRange.from}-${analytics.dateRange.to}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Analytics report exported");
    setExportFlash(true);
    window.setTimeout(() => setExportFlash(false), 600);
  };

  const metricItems = useMemo((): DashboardStatItem[] => {
    if (!analytics) return [];
    return analytics.overviewMetrics.map((metric) => {
      const Icon = METRIC_ICONS[metric.icon] ?? ShieldCheck;
      return {
        id: metric.title,
        icon: (
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${metric.iconColor}18` }}
          >
            <Icon className="w-4 h-4" style={{ color: metric.iconColor }} />
          </div>
        ),
        value: <span className="text-slate-900">{metric.value}</span>,
        label: metric.title,
        footer: (
          <span className={`font-medium ${trendColor(metric.trend)}`}>{metric.change}</span>
        ),
        sparkColor: metric.iconColor,
        sparkline: metric.sparkline,
        cardClassName: "provider-portal-card bg-white border min-w-0",
        cardStyle: cardStyle,
      };
    });
  }, [analytics, cardStyle]);

  if (loading && !analytics) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: PROVIDER_THEME.primary }} />
      </div>
    );
  }

  if (!analytics) {
    return (
      <p className="text-center text-slate-500 py-20">Analytics could not be loaded.</p>
    );
  }

  const maxFunnel = Math.max(...analytics.funnel.steps.map((s) => s.users), 1);

  return (
    <AnimatedPage className={PROVIDER_PAGE_CLASS} style={{ fontFamily: "Inter, sans-serif" }}>
      <header className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 min-w-0">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Analytics</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Deep insights to help you grow, optimize and stay ahead.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <ProviderDateRangePicker value={range} onChange={handleRangeChange} />
          <motion.button
            type="button"
            onClick={exportReport}
            animate={exportFlash ? { scale: [1, 1.05, 1], backgroundColor: ["#FFFFFF", "#EFF6FF", "#FFFFFF"] } : {}}
            transition={{ duration: 0.5 }}
            className="provider-portal-card inline-flex items-center gap-2 rounded-2xl border bg-card px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-accent"
            style={{ borderColor: PROVIDER_THEME.borderAlt, boxShadow: PROVIDER_THEME.shadow }}
          >
            <Download className="w-4 h-4" />
            Export Report
          </motion.button>
        </div>
      </header>

      <DashboardStatsCarousel items={metricItems} />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 min-w-0">
        {/* Left column */}
        <div className="xl:col-span-8 space-y-5 min-w-0">
          {/* Interest trends */}
          <motion.section
            variants={fadeUpItem}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.1 }}
            className={PORTAL_CARD_CLASS}
            style={cardStyle}
          >
            <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Customer Interest Trends</h2>
                <p className="text-xs text-slate-500">How customer interests are changing over time</p>
              </div>
              <Link
                to="/provider-dashboard/leads"
                className="text-xs font-medium shrink-0"
                style={{ color: PROVIDER_THEME.primary }}
              >
                View full report
              </Link>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_180px] gap-4 min-w-0">
              <div className="h-52 min-w-0 w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <LineChart data={interestChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fill: chartColors.axis }}
                      axisLine={false}
                      tickLine={false}
                      interval="preserveStartEnd"
                      minTickGap={16}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: chartColors.axis }}
                      width={32}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                      domain={[0, (max: number) => Math.max(Math.ceil(max * 1.15), 1)]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: chartColors.tooltipBg,
                        borderColor: chartColors.tooltipBorder,
                        color: chartColors.tooltipText,
                        borderRadius: 12,
                      }}
                      labelStyle={{ color: chartColors.tooltipText }}
                      formatter={(value: number, name: string) => {
                        const dataset = analytics.interestTrends.datasets.find(
                          (item) => item.key === name
                        );
                        return [value, dataset?.label ?? name];
                      }}
                    />
                    {analytics.interestTrends.datasets.map((ds) => (
                      <Line
                        key={ds.key}
                        type="monotone"
                        dataKey={ds.key}
                        name={ds.label}
                        stroke={ds.color}
                        strokeWidth={2.5}
                        strokeDasharray={INTEREST_LINE_DASHES[ds.key]}
                        dot={<InterestTrendDot dataKey={ds.key} />}
                        activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--popover)" }}
                        connectNulls
                        isAnimationActive={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2.5 min-w-0">
                {analytics.interestTrends.sideLegend.map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-xs gap-2">
                    <span className="text-slate-600 truncate">{item.label}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="font-semibold">{item.percentage}</span>
                      <span
                        className={
                          item.trend.startsWith("+") ? "text-emerald-600" : "text-amber-600"
                        }
                      >
                        {item.trend}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="provider-insight-banner mt-4 flex flex-wrap items-center gap-2 rounded-xl border p-3 bg-blue-50 border-blue-100 dark:bg-blue-950/30 dark:border-blue-900/40">
              <Sparkles className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400" />
              <p className="text-xs text-slate-700 flex-1 min-w-0">
                {analytics.interestTrends.insightBanner.text}
              </p>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 shrink-0">
                {analytics.interestTrends.insightBanner.badge}
              </span>
            </div>
          </motion.section>

          {/* Funnel */}
          <motion.section
            variants={fadeUpItem}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.18 }}
            className={PORTAL_CARD_CLASS}
            style={cardStyle}
          >
            <h2 className="text-base font-bold text-slate-900">Funnel Analytics</h2>
            <p className="text-xs text-slate-500 mb-4">
              Track user journey from discovery to purchase (your leads & questionnaires)
            </p>
            <div className="space-y-2 max-w-lg mx-auto">
              {analytics.funnel.steps.map((step, index) => {
                const widthPct = Math.max(28, Math.round((step.users / maxFunnel) * 100));
                return (
                  <div key={step.name} className="min-w-0">
                    <div className="flex justify-between text-xs mb-1 gap-2">
                      <span className="font-medium text-slate-800 truncate">{step.name}</span>
                      <span className="text-slate-500 shrink-0">
                        {step.users.toLocaleString()}
                        {step.conversion ? ` · ${step.conversion}` : ""}
                      </span>
                    </div>
                    <motion.div
                      initial={false}
                      animate={{ width: `${widthPct}%`, opacity: 1 }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      className="h-9 rounded-lg flex items-center px-3 text-xs font-medium text-white mx-auto"
                      style={{
                        backgroundColor: `hsl(${220 - index * 12}, 75%, ${48 + index * 4}%)`,
                        minWidth: 120,
                      }}
                    >
                      {index === analytics.funnel.steps.length - 1 ? "Purchase" : ""}
                    </motion.div>
                  </div>
                );
              })}
            </div>
          </motion.section>

          {/* Segments table */}
          <section className={`${PORTAL_CARD_CLASS} overflow-hidden`} style={cardStyle}>
            <h2 className="text-base font-bold text-slate-900">Customer Segments Insight</h2>
            <p className="text-xs text-slate-500 mb-4">
              Segments inferred from questionnaire answers and lead behavior
            </p>
            {analytics.customerSegments.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">No segment data in this period.</p>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b">
                      <th className="pb-2 pr-2 font-medium">Segment</th>
                      <th className="pb-2 pr-2 font-medium">Top Interest</th>
                      <th className="pb-2 pr-2 font-medium">Level</th>
                      <th className="pb-2 font-medium">Conversion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.customerSegments.map((row) => (
                      <tr key={row.segment} className="border-b last:border-0">
                        <td className="py-3 pr-2 font-medium text-slate-900">{row.segment}</td>
                        <td className="py-3 pr-2 text-slate-600">{row.interest}</td>
                        <td className="py-3 pr-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                              row.level === "High"
                                ? "bg-emerald-50 text-emerald-700"
                                : row.level === "Medium"
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {row.level}
                          </span>
                        </td>
                        <td className="py-3 font-medium">{row.conversion}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* Right column */}
        <div className="xl:col-span-4 space-y-5 min-w-0">
          <section className={PORTAL_CARD_CLASS} style={cardStyle}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-slate-900">Smart Business Insights</h2>
              <Link
                to="/provider-dashboard"
                className="text-xs font-medium"
                style={{ color: PROVIDER_THEME.primary }}
              >
                Dashboard
              </Link>
            </div>
            <div className="space-y-3">
              {analytics.smartInsights.map((insight) => (
                <div
                  key={insight.title}
                  className={`p-3 rounded-2xl border ${INSIGHT_STYLES[insight.theme]}`}
                >
                  <div className="flex items-start gap-2">
                    {insight.theme === "purple" ? (
                      <BrainCircuit className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
                    ) : insight.theme === "orange" ? (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-slate-900">{insight.title}</p>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{insight.description}</p>
                      <p className="text-xs font-medium mt-2" style={{ color: PROVIDER_THEME.primary }}>
                        {insight.suggestion}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={PORTAL_CARD_CLASS} style={cardStyle}>
            <h2 className="text-base font-bold text-slate-900">Revenue Overview</h2>
            <p className="text-xs text-slate-500">This period</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">{analytics.revenue.totalRevenue}</p>
            <p
              className={`text-xs font-medium mt-1 ${trendColor(analytics.revenue.trend === "up" ? "up" : analytics.revenue.trend === "down" ? "down" : "neutral")}`}
            >
              {analytics.revenue.growth}
            </p>
            <div className="h-36 mt-3 min-w-0 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChartData}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563EB" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 9, fill: chartColors.axis }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: chartColors.axis }} width={28} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v: number) => [`Rs ${(v * 1000).toLocaleString()}`, "Revenue"]} />
                  <Area type="monotone" dataKey="revenue" stroke="#2563EB" fill="url(#revGrad)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className={PORTAL_CARD_CLASS} style={cardStyle}>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-base font-bold text-slate-900">Top Performing Policies</h2>
              <Link
                to="/provider-dashboard/policies"
                className="text-xs font-medium"
                style={{ color: PROVIDER_THEME.primary }}
              >
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {analytics.topPolicies.length === 0 ? (
                <p className="text-xs text-slate-500">No purchase revenue in this period.</p>
              ) : (
                analytics.topPolicies.map((row) => (
                  <div
                    key={row.policy}
                    className="flex justify-between gap-2 text-xs border-b pb-2 last:border-0"
                  >
                    <span className="font-medium text-slate-800 truncate">{row.policy}</span>
                    <div className="text-right shrink-0">
                      <p className="font-semibold">{row.revenue}</p>
                      <p className="text-slate-500">{row.conversion}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className={PORTAL_CARD_CLASS} style={cardStyle}>
            <h2 className="text-base font-bold text-slate-900">Competitiveness Overview</h2>
            <p className="text-xs text-slate-500">Your position in the market</p>
            <ScoreGauge
              score={analytics.competitiveness.score}
              label={analytics.competitiveness.label}
              trackColor={chartColors.gaugeTrack}
            />
            <ul className="space-y-2 mt-2">
              {analytics.competitiveness.indicators.map((item) => (
                <li key={item.metric} className="flex justify-between items-center text-xs gap-2">
                  <span className="text-slate-600">{item.metric}</span>
                  <span className={`px-2 py-0.5 rounded-full font-semibold ${statusPill(item.status)}`}>
                    {item.status}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600 dark:bg-muted/40 dark:text-muted-foreground">
              {analytics.competitiveness.footerSuggestion}
            </p>
          </section>
        </div>
      </div>

      {loading ? (
        <div className="fixed inset-0 bg-white/40 flex items-center justify-center pointer-events-none">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      ) : null}
    </AnimatedPage>
  );
}
