import { useCallback, useEffect, useMemo, useState } from "react";
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
import { motion } from "motion/react";
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
  purple: "border-violet-100 bg-violet-50/40",
  orange: "border-amber-100 bg-amber-50/40",
  green: "border-emerald-100 bg-emerald-50/40",
  blue: "border-blue-100 bg-blue-50/40",
} as const;

function trendColor(trend: InsurerAnalyticsTrend): string {
  if (trend === "up" || trend === "down-positive") return "text-emerald-600";
  if (trend === "down") return "text-amber-600";
  return "text-slate-500";
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const chartData = data.map((value, index) => ({ index, value }));
  return (
    <div className="h-9 w-full min-w-0 mt-3">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function ScoreGauge({ score, label }: { score: number; label: string }) {
  const pct = Math.min(100, Math.max(0, score));
  return (
    <div className="flex flex-col items-center py-4">
      <div
        className="relative w-36 h-36 rounded-full flex items-center justify-center"
        style={{
          background: `conic-gradient(#2563EB ${pct * 3.6}deg, #E2E8F0 0deg)`,
        }}
      >
        <div className="w-28 h-28 rounded-full bg-white flex flex-col items-center justify-center shadow-inner">
          <span className="text-3xl font-bold text-slate-900">{score}</span>
          <span className="text-xs text-slate-500">/ 100</span>
        </div>
      </div>
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
  const [range, setRange] = useState<DateRangeValue>(defaultProviderRange);
  const [analytics, setAnalytics] = useState<InsurerAnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);

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
        row[ds.label] = ds.values[i] ?? 0;
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
  };

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
    <div className={PROVIDER_PAGE_CLASS} style={{ fontFamily: "Inter, sans-serif" }}>
      <header className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 min-w-0">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Analytics</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Deep insights to help you grow, optimize and stay ahead.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <ProviderDateRangePicker value={range} onChange={handleRangeChange} />
          <button
            type="button"
            onClick={exportReport}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border bg-white text-sm font-medium text-slate-700 hover:bg-slate-50"
            style={{ borderColor: PROVIDER_THEME.borderAlt, boxShadow: PROVIDER_THEME.shadow }}
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </header>

      {/* 5 metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 min-w-0">
        {analytics.overviewMetrics.map((metric, index) => {
          const Icon = METRIC_ICONS[metric.icon] ?? ShieldCheck;
          return (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="p-4 border bg-white min-w-0"
              style={{
                borderRadius: PROVIDER_THEME.radius,
                borderColor: PROVIDER_THEME.border,
                boxShadow: PROVIDER_THEME.shadow,
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${metric.iconColor}18` }}
                >
                  <Icon className="w-4 h-4" style={{ color: metric.iconColor }} />
                </div>
              </div>
              <p className="text-xl font-bold text-slate-900 mt-2 truncate">{metric.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{metric.title}</p>
              <p className={`text-[11px] font-medium mt-1 ${trendColor(metric.trend)}`}>
                {metric.change}
              </p>
              <MiniSparkline data={metric.sparkline} color={metric.iconColor} />
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 min-w-0">
        {/* Left column */}
        <div className="xl:col-span-8 space-y-5 min-w-0">
          {/* Interest trends */}
          <section
            className="p-5 border bg-white min-w-0"
            style={{
              borderRadius: PROVIDER_THEME.radius,
              borderColor: PROVIDER_THEME.border,
              boxShadow: PROVIDER_THEME.shadow,
            }}
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
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={interestChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} width={32} />
                    <Tooltip />
                    {analytics.interestTrends.datasets.map((ds) => (
                      <Line
                        key={ds.label}
                        type="monotone"
                        dataKey={ds.label}
                        stroke={ds.color}
                        strokeWidth={2}
                        dot={false}
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
            <div
              className="mt-4 flex flex-wrap items-center gap-2 p-3 rounded-xl border"
              style={{ backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" }}
            >
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
              <p className="text-xs text-slate-700 flex-1 min-w-0">
                {analytics.interestTrends.insightBanner.text}
              </p>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 shrink-0">
                {analytics.interestTrends.insightBanner.badge}
              </span>
            </div>
          </section>

          {/* Funnel */}
          <section
            className="p-5 border bg-white min-w-0"
            style={{
              borderRadius: PROVIDER_THEME.radius,
              borderColor: PROVIDER_THEME.border,
              boxShadow: PROVIDER_THEME.shadow,
            }}
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
                    <div
                      className="h-9 rounded-lg flex items-center px-3 text-xs font-medium text-white transition-all mx-auto"
                      style={{
                        width: `${widthPct}%`,
                        backgroundColor: `hsl(${220 - index * 12}, 75%, ${48 + index * 4}%)`,
                        minWidth: 120,
                      }}
                    >
                      {index === analytics.funnel.steps.length - 1 ? "Purchase" : ""}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Segments table */}
          <section
            className="p-5 border bg-white min-w-0 overflow-hidden"
            style={{
              borderRadius: PROVIDER_THEME.radius,
              borderColor: PROVIDER_THEME.border,
              boxShadow: PROVIDER_THEME.shadow,
            }}
          >
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
          <section
            className="p-5 border bg-white min-w-0"
            style={{
              borderRadius: PROVIDER_THEME.radius,
              borderColor: PROVIDER_THEME.border,
              boxShadow: PROVIDER_THEME.shadow,
            }}
          >
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

          <section
            className="p-5 border bg-white min-w-0"
            style={{
              borderRadius: PROVIDER_THEME.radius,
              borderColor: PROVIDER_THEME.border,
              boxShadow: PROVIDER_THEME.shadow,
            }}
          >
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
                  <XAxis dataKey="label" tick={{ fontSize: 9 }} />
                  <Tooltip formatter={(v: number) => [`Rs ${(v * 1000).toLocaleString()}`, "Revenue"]} />
                  <Area type="monotone" dataKey="revenue" stroke="#2563EB" fill="url(#revGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section
            className="p-5 border bg-white min-w-0"
            style={{
              borderRadius: PROVIDER_THEME.radius,
              borderColor: PROVIDER_THEME.border,
              boxShadow: PROVIDER_THEME.shadow,
            }}
          >
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

          <section
            className="p-5 border bg-white min-w-0"
            style={{
              borderRadius: PROVIDER_THEME.radius,
              borderColor: PROVIDER_THEME.border,
              boxShadow: PROVIDER_THEME.shadow,
            }}
          >
            <h2 className="text-base font-bold text-slate-900">Competitiveness Overview</h2>
            <p className="text-xs text-slate-500">Your position in the market</p>
            <ScoreGauge
              score={analytics.competitiveness.score}
              label={analytics.competitiveness.label}
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
            <p
              className="text-xs text-slate-600 mt-4 p-3 rounded-xl"
              style={{ backgroundColor: "#F8FAFC" }}
            >
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
    </div>
  );
}
