import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useTheme } from "next-themes";
import { Link } from "react-router";
import {
  AlertTriangle,
  BadgePercent,
  BrainCircuit,
  HelpCircle,
  Inbox,
  Loader2,
  ShoppingBag,
  Sparkles,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { motion } from "motion/react";
import { AnimatedPage } from "../ui/animated-page";
import { DashboardStatsCarousel, type DashboardStatItem } from "../ui/dashboard-stats-carousel";
import { fadeUpItem } from "@/lib/motion-presets";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
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
  loadStoredProviderRange,
  parseRangeFromApi,
  saveStoredProviderRange,
  toRangeQuery,
  type DateRangeValue,
} from "@/lib/provider-date-range";
import { ProviderDateRangePicker } from "./provider-date-range-picker";
import { CustomerDemographicsSection } from "./customer-demographics-charts";
import { PakistanUsersByRegion } from "./pakistan-users-by-region";
import { AudienceTracePanel } from "./audience-trace-panel";
import { RegionMapFilters, type RegionMapAudience } from "./region-map-filters";
import { PROVIDER_PAGE_CLASS, PROVIDER_THEME } from "./provider-portal-theme";
import { toast } from "sonner";
import { compressChartSeries, maxSeriesValue } from "@/lib/chart-series";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

const METRIC_ICONS: Record<string, LucideIcon> = {
  users: Users,
  inbox: Inbox,
  "badge-percent": BadgePercent,
  "shopping-bag": ShoppingBag,
  wallet: Wallet,
};

const DEMAND_SOURCE_COLORS = ["#2563EB", "#8B5CF6", "#06B6D4", "#F59E0B", "#10B981", "#EC4899"];

const INSIGHT_STYLES = {
  purple:
    "border-violet-100 bg-violet-50/40 dark:border-violet-900/40 dark:bg-violet-950/30",
  orange:
    "border-amber-100 bg-amber-50/40 dark:border-amber-900/40 dark:bg-amber-950/30",
  green:
    "border-emerald-100 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/30",
  blue: "border-blue-100 bg-blue-50/40 dark:border-blue-900/40 dark:bg-blue-950/30",
} as const;

function useChartColors() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  return {
    grid: isDark ? "rgba(148, 163, 184, 0.12)" : "#F1F5F9",
    axis: isDark ? "#94A3B8" : "#64748B",
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

function SectionHeader({
  title,
  definition,
  subtitle,
  action,
}: {
  title: string;
  definition?: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          {definition ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="text-slate-400 cursor-help inline-flex"
                  aria-label={`About ${title}`}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs bg-popover text-popover-foreground border border-border">
                {definition}
              </TooltipContent>
            </Tooltip>
          ) : null}
        </div>
        {subtitle ? <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

function opsStatusPill(status: string) {
  if (status === "Strong") return "bg-emerald-50 text-emerald-700";
  return "bg-amber-50 text-amber-700";
}

function opportunityPill(level: string) {
  if (level === "High") return "bg-emerald-50 text-emerald-700";
  if (level === "Medium") return "bg-amber-50 text-amber-700";
  return "bg-slate-100 text-slate-600";
}

const REGION_MAP_AUDIENCE_KEY = "clearclever.providerAnalyticsRegionAudience";
const REGION_MAP_REGION_KEY = "clearclever.providerAnalyticsRegionFilter";

function loadStoredRegionAudience(): RegionMapAudience {
  if (typeof window === "undefined") return "all";
  const stored = window.localStorage.getItem(REGION_MAP_AUDIENCE_KEY);
  if (stored === "purchasers") return "purchasers";
  if (stored === "leads") return "leads";
  return "all";
}

function saveStoredRegionAudience(audience: RegionMapAudience) {
  window.localStorage.setItem(REGION_MAP_AUDIENCE_KEY, audience);
}

function loadStoredRegionFilter(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REGION_MAP_REGION_KEY);
}

function saveStoredRegionFilter(region: string | null) {
  if (region) {
    window.localStorage.setItem(REGION_MAP_REGION_KEY, region);
  } else {
    window.localStorage.removeItem(REGION_MAP_REGION_KEY);
  }
}

export function ProviderAnalyticsPage() {
  const chartColors = useChartColors();
  const [range, setRange] = useState<DateRangeValue>(loadStoredProviderRange);
  const [audience, setAudience] = useState<RegionMapAudience>(loadStoredRegionAudience);
  const [regionFilter, setRegionFilter] = useState<string | null>(loadStoredRegionFilter);
  const [analytics, setAnalytics] = useState<InsurerAnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportFlash, setExportFlash] = useState(false);

  const cardStyle = {
    borderRadius: PROVIDER_THEME.radius,
    borderColor: PROVIDER_THEME.border,
    boxShadow: PROVIDER_THEME.shadow,
  };

  const load = useCallback(
    async (r: DateRangeValue, nextAudience: RegionMapAudience, nextRegion: string | null) => {
      setLoading(true);
      try {
        const q = toRangeQuery(r);
        const data = await fetchInsurerAnalytics({
          ...q,
          audience: nextAudience,
          region: nextRegion ?? undefined,
        });
        setAnalytics(data.analytics);
        setRange(parseRangeFromApi(data.analytics.dateRange.from, data.analytics.dateRange.to));
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Could not load analytics");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void load(loadStoredProviderRange(), loadStoredRegionAudience(), loadStoredRegionFilter());
  }, []);

  const handleRangeChange = (next: DateRangeValue) => {
    setRange(next);
    saveStoredProviderRange(next);
    void load(next, audience, regionFilter);
  };

  const handleAudienceChange = (next: RegionMapAudience) => {
    setAudience(next);
    saveStoredRegionAudience(next);
    void load(range, next, regionFilter);
  };

  const handleRegionChange = (next: string | null) => {
    setRegionFilter(next);
    saveStoredRegionFilter(next);
    void load(range, audience, next);
  };

  const interestChartData = useMemo(() => {
    if (!analytics) return [];
    const rawSeries: Record<string, number[]> = {};
    for (const ds of analytics.interestTrends.datasets) {
      rawSeries[ds.key] = ds.values;
    }
    const compressed = compressChartSeries(analytics.interestTrends.xAxis, rawSeries, 60);
    return compressed.xAxis.map((label, i) => {
      const row: Record<string, string | number> = { label };
      for (const ds of analytics.interestTrends.datasets) {
        row[ds.key] = compressed.series[ds.key]?.[i] ?? 0;
      }
      return row;
    });
  }, [analytics]);

  const interestYMax = useMemo(() => {
    if (!analytics) return 1;
    const keys = analytics.interestTrends.datasets.map((ds) => ds.key);
    return Math.max(Math.ceil(maxSeriesValue(interestChartData, keys) * 1.15), 1);
  }, [analytics, interestChartData]);

  const revenueChartData = useMemo(() => {
    if (!analytics) return [];
    const compressed = compressChartSeries(analytics.revenue.xAxis, {
      revenue: analytics.revenue.chartValues,
    });
    return compressed.xAxis.map((label, i) => ({
      label,
      revenue: compressed.series.revenue?.[i] ?? 0,
    }));
  }, [analytics]);

  const revenueYMax = useMemo(() => {
    return Math.max(Math.ceil(maxSeriesValue(revenueChartData, ["revenue"]) * 1.15), 1);
  }, [revenueChartData]);

  const leadSourceChartData = useMemo(() => {
    if (!analytics) return [];
    return analytics.leadSources.map((row) => ({
      label: row.label,
      count: row.count,
      sharePct: row.sharePct,
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
      const Icon = METRIC_ICONS[metric.icon] ?? Users;
      return {
        id: metric.title,
        icon: (
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${metric.iconColor}18` }}
            title={`${metric.definition}\n\nWhy it matters: ${metric.whyItMatters}`}
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
            Real seeker behavior on ClearClever — every metric comes from leads, questionnaires, and purchases.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <ProviderDateRangePicker value={range} onChange={handleRangeChange} />
          <motion.button
            type="button"
            onClick={exportReport}
            animate={exportFlash ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 0.5 }}
            className="provider-portal-card inline-flex items-center gap-2 rounded-2xl border bg-card px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-accent"
            style={{ borderColor: PROVIDER_THEME.borderAlt, boxShadow: PROVIDER_THEME.shadow }}
          >
            Export Report
          </motion.button>
        </div>
      </header>

      <DashboardStatsCarousel items={metricItems} />
      <p className="text-xs text-muted-foreground -mt-3">
        KPIs below reflect activity in {analytics.dateRange.label ?? "the selected period"}.
      </p>

      <PakistanUsersByRegion
        data={analytics.usersByRegion}
        cardStyle={cardStyle}
        filters={
          <RegionMapFilters
            range={range}
            onRangeChange={handleRangeChange}
            audience={audience}
            onAudienceChange={handleAudienceChange}
            region={regionFilter}
            onRegionChange={handleRegionChange}
          />
        }
      />

      {analytics.usersByRegion.coverageNote ? (
        <p className="text-xs text-muted-foreground -mt-3">{analytics.usersByRegion.coverageNote}</p>
      ) : null}

      {analytics.audienceUsers ? (
        <AudienceTracePanel users={analytics.audienceUsers} cardStyle={cardStyle} />
      ) : null}

      {analytics.customerDemographics && analytics.customerDemographics.totalPurchasers > 0 && (
        <CustomerDemographicsSection
          data={analytics.customerDemographics}
          cardStyle={cardStyle}
        />
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 min-w-0">
        <div className="xl:col-span-8 space-y-5 min-w-0">
          <motion.section
            variants={fadeUpItem}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.1 }}
            className={PORTAL_CARD_CLASS}
            style={cardStyle}
          >
            <SectionHeader
              title={analytics.interestTrends.title}
              definition={analytics.interestTrends.definition}
              action={
                <Link
                  to="/provider-dashboard/leads"
                  className="text-xs font-medium shrink-0"
                  style={{ color: PROVIDER_THEME.primary }}
                >
                  View leads
                </Link>
              }
            />
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_180px] gap-4 min-w-0">
              <div className="min-w-0 w-full space-y-3">
                <div className="h-64 min-w-0 w-full">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart data={interestChartData} margin={{ top: 8, right: 12, left: 4, bottom: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fill: chartColors.axis }}
                      axisLine={false}
                      tickLine={false}
                      interval="preserveStartEnd"
                      minTickGap={24}
                      padding={{ left: 8, right: 8 }}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: chartColors.axis }}
                      width={32}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                      domain={[0, interestYMax]}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: chartColors.tooltipBg,
                        borderColor: chartColors.tooltipBorder,
                        color: chartColors.tooltipText,
                        borderRadius: 12,
                      }}
                      formatter={(value: number, name: string) => {
                        const dataset = analytics.interestTrends.datasets.find(
                          (item) => item.key === name
                        );
                        return [value, dataset?.label ?? name];
                      }}
                    />
                    {analytics.interestTrends.datasets.map((ds, index, arr) => (
                      <Bar
                        key={ds.key}
                        dataKey={ds.key}
                        name={ds.label}
                        stackId="leads"
                        fill={ds.color}
                        radius={
                          index === arr.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]
                        }
                        isAnimationActive={false}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-2">
                  {analytics.interestTrends.datasets.map((ds) => (
                    <span
                      key={ds.key}
                      className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-muted-foreground"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-sm shrink-0"
                        style={{ backgroundColor: ds.color }}
                      />
                      {ds.label}
                    </span>
                  ))}
                </div>
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

          <motion.section
            variants={fadeUpItem}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.14 }}
            className={PORTAL_CARD_CLASS}
            style={cardStyle}
          >
            <SectionHeader
              title={analytics.funnel.title}
              definition={analytics.funnel.definition}
            />
            <div className="space-y-3 max-w-lg mx-auto">
              {analytics.funnel.steps.map((step, index) => {
                const widthPct = Math.max(28, Math.round((step.users / maxFunnel) * 100));
                const stepNum = index + 1;
                return (
                  <div key={step.name} className="min-w-0">
                    <div className="flex justify-between text-xs mb-1 gap-2">
                      <span className="font-medium text-slate-800 dark:text-foreground min-w-0">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold mr-1.5 shrink-0">
                          {stepNum}
                        </span>
                        <span className="truncate">{step.name}</span>
                      </span>
                      <span className="text-slate-500 dark:text-muted-foreground shrink-0 text-right">
                        {step.users.toLocaleString()} seeker{step.users === 1 ? "" : "s"}
                        {step.conversion ? ` · ${step.conversion} continued` : ""}
                        {step.dropOff != null && step.dropOff > 0
                          ? ` · ${step.dropOff} stopped here`
                          : ""}
                      </span>
                    </div>
                    <motion.div
                      initial={false}
                      animate={{ width: `${widthPct}%`, opacity: 1 }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      className="h-9 rounded-lg flex items-center px-3 text-xs font-medium text-white mx-auto"
                      style={{
                        backgroundColor: `hsl(${220 - index * 10}, 75%, ${48 + index * 3}%)`,
                        minWidth: 120,
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </motion.section>

          <section className={`${PORTAL_CARD_CLASS} overflow-hidden`} style={cardStyle}>
            <SectionHeader
              title="Where demand comes from"
              definition="Lead events grouped by how seekers interacted — recommendations, saves, messages, checkout, and purchases."
            />
            {leadSourceChartData.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">No lead activity in this period.</p>
            ) : (
              <div
                className="min-w-0 rounded-xl border border-slate-100 dark:border-border bg-gradient-to-br from-slate-50/60 to-white dark:from-muted/15 dark:to-card p-3"
                style={{ height: Math.min(280, Math.max(140, leadSourceChartData.length * 44 + 32)) }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={leadSourceChartData} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: chartColors.axis }} allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="label"
                      width={108}
                      tick={{ fontSize: 10, fill: chartColors.axis }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <RechartsTooltip
                      formatter={(value: number, _name, item) => [
                        `${value} (${item.payload.sharePct}%)`,
                        "Leads",
                      ]}
                      contentStyle={{
                        backgroundColor: chartColors.tooltipBg,
                        borderColor: chartColors.tooltipBorder,
                        borderRadius: 12,
                      }}
                    />
                    <Bar dataKey="count" barSize={20} maxBarSize={24} radius={[0, 8, 8, 0]} isAnimationActive={false}>
                      {leadSourceChartData.map((entry, index) => (
                        <Cell
                          key={entry.label}
                          fill={DEMAND_SOURCE_COLORS[index % DEMAND_SOURCE_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          <section className={`${PORTAL_CARD_CLASS} overflow-hidden`} style={cardStyle}>
            <SectionHeader
              title="Audience segments"
              definition="Segments inferred from questionnaire answers, with purchase rate per unique seeker."
            />
            {analytics.customerSegments.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">No segment data in this period.</p>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b">
                      <th className="pb-2 pr-2 font-medium">Segment</th>
                      <th className="pb-2 pr-2 font-medium">Category</th>
                      <th className="pb-2 pr-2 font-medium">Seekers</th>
                      <th className="pb-2 pr-2 font-medium">Leads</th>
                      <th className="pb-2 pr-2 font-medium">Purchase rate</th>
                      <th className="pb-2 font-medium">Opportunity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.customerSegments.map((row) => (
                      <tr key={row.segment} className="border-b last:border-0">
                        <td className="py-3 pr-2 font-medium text-slate-900">{row.segment}</td>
                        <td className="py-3 pr-2 text-slate-600">{row.category}</td>
                        <td className="py-3 pr-2">{row.seekers}</td>
                        <td className="py-3 pr-2">{row.leads}</td>
                        <td className="py-3 pr-2 font-medium">{row.purchaseRate}</td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${opportunityPill(row.opportunity)}`}
                          >
                            {row.opportunity}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className={`${PORTAL_CARD_CLASS} overflow-hidden`} style={cardStyle}>
            <SectionHeader
              title="Policy performance"
              definition="Per-policy funnel from recommendations through to sold — purchase rate = sold ÷ (recommended + saved + checkout)."
              action={
                <Link
                  to="/provider-dashboard/policies"
                  className="text-xs font-medium"
                  style={{ color: PROVIDER_THEME.primary }}
                >
                  View policies
                </Link>
              }
            />
            {analytics.policyPerformance.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">No policy activity in this period.</p>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-slate-500 border-b">
                      <th className="pb-2 pr-2 font-medium">Policy</th>
                      <th className="pb-2 pr-1 font-medium">Rec.</th>
                      <th className="pb-2 pr-1 font-medium">Saved</th>
                      <th className="pb-2 pr-1 font-medium">Checkout</th>
                      <th className="pb-2 pr-1 font-medium">Sold</th>
                      <th className="pb-2 pr-2 font-medium">Premium</th>
                      <th className="pb-2 font-medium">Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.policyPerformance.map((row) => (
                      <tr key={row.policy} className="border-b last:border-0">
                        <td className="py-2.5 pr-2 font-medium text-slate-900 max-w-[140px] truncate">
                          {row.policy}
                        </td>
                        <td className="py-2.5 pr-1">{row.recommended}</td>
                        <td className="py-2.5 pr-1">{row.saved}</td>
                        <td className="py-2.5 pr-1">{row.checkouts}</td>
                        <td className="py-2.5 pr-1 font-semibold">{row.sold}</td>
                        <td className="py-2.5 pr-2 whitespace-nowrap">{row.premiumFormatted}</td>
                        <td className="py-2.5">{row.purchaseRate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <div className="xl:col-span-4 space-y-5 min-w-0">
          <section className={PORTAL_CARD_CLASS} style={cardStyle}>
            <SectionHeader title="Recommended actions" subtitle="Data-backed next steps for your team" />
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
                      <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-slate-900">{insight.title}</p>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{insight.description}</p>
                      <p className="text-[11px] text-slate-500 mt-1">{insight.evidence}</p>
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
            <SectionHeader
              title={analytics.revenue.title}
              definition={analytics.revenue.definition}
              subtitle="This period"
            />
            <p className="text-2xl font-bold text-slate-900">{analytics.revenue.totalRevenue}</p>
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
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 9, fill: chartColors.axis }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                    minTickGap={12}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: chartColors.axis }}
                    width={28}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                    domain={[0, revenueYMax]}
                  />
                  <RechartsTooltip formatter={(v: number) => [`Rs ${(v * 1000).toLocaleString()}`, "Premium"]} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#2563EB"
                    strokeWidth={2}
                    fill="url(#revGrad)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className={PORTAL_CARD_CLASS} style={cardStyle}>
            <SectionHeader
              title="Operations snapshot"
              definition="Follow-up and service metrics you control on ClearClever."
            />
            <ul className="space-y-4">
              {analytics.operations.map((item) => (
                <li key={item.metric} className="border-b last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <p className="text-xs font-semibold text-slate-800">{item.metric}</p>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${opsStatusPill(item.status)}`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-900 leading-snug">{item.value}</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.whyItMatters}</p>
                </li>
              ))}
            </ul>
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
