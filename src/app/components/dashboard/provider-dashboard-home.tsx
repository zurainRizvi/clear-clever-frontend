import { Link, useNavigate, useOutletContext } from "react-router";
import type { ProviderOutletContext } from "./provider-dashboard";
import {
  Bell,
  ClipboardCheck,
  Headphones,
  Loader2,
  Plus,
  ShieldCheck,
  Smile,
  Star,
  Tag,
  TrendingUp,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
} from "recharts";
import {
  fetchInsurerDashboard,
  type InsurerDashboardPayload,
  type InsurerDashboardOverviewStat,
  type InsurerSmartInsight,
} from "@/lib/insurer-api";
import { ApiError } from "@/lib/api";
import {
  defaultProviderRange,
  parseRangeFromApi,
  toRangeQuery,
  type DateRangeValue,
} from "@/lib/provider-date-range";
import { useProvider } from "./provider-context";
import { ProviderDateRangePicker } from "./provider-date-range-picker";
import { PROVIDER_PAGE_CLASS, PROVIDER_THEME } from "./provider-portal-theme";
import { toast } from "sonner";

const THEME = PROVIDER_THEME;

const INSIGHT_THEMES: Record<
  InsurerSmartInsight["theme"],
  { badge: string; chart: string; border: string }
> = {
  blue: { badge: "bg-blue-50 text-blue-700", chart: "#2563EB", border: "border-blue-100" },
  green: { badge: "bg-emerald-50 text-emerald-700", chart: "#10B981", border: "border-emerald-100" },
  purple: { badge: "bg-violet-50 text-violet-700", chart: "#8B5CF6", border: "border-violet-100" },
  orange: { badge: "bg-amber-50 text-amber-700", chart: "#F59E0B", border: "border-amber-100" },
};

const STAT_ICONS: Record<string, LucideIcon> = {
  "clipboard-check": ClipboardCheck,
  users: Users,
  "trending-up": TrendingUp,
  wallet: Wallet,
  star: Star,
  smile: Smile,
};

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function insightActionLink(actionType?: string): string {
  switch (actionType) {
    case "review_claims":
      return "/provider-dashboard/claims";
    case "view_leads":
      return "/provider-dashboard/leads";
    case "create_policy":
      return "/provider-dashboard/policies";
    default:
      return "/provider-dashboard";
  }
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const chartData = data.map((value, index) => ({ index, value }));
  return (
    <div className="h-10 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function PolicyTrendSparkline({ data }: { data: number[] }) {
  const chartData = data.map((value, index) => ({ index, value }));
  return (
    <div className="h-8 w-16">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function DonutChartBlock({ dashboard }: { dashboard: InsurerDashboardPayload }) {
  const segments = dashboard.demandTrends.segments.filter((s) => s.count > 0);
  const chartData = segments.map((s) => ({
    name: s.label,
    value: s.count,
    color: s.color,
  }));

  if (chartData.length === 0) {
    return (
      <p className="text-sm text-slate-500 text-center py-12">No category leads in this period yet.</p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative h-52 w-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              innerRadius={62}
              outerRadius={88}
              paddingAngle={3}
              stroke="none"
            >
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-center text-xs font-medium text-slate-500 max-w-[100px] leading-snug">
            {dashboard.demandTrends.centerLabel}
          </p>
        </div>
      </div>
      <div className="w-full space-y-3">
        {segments.map((segment) => (
          <div key={segment.label} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: segment.color }}
              />
              <span className="text-slate-700">{segment.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900">{segment.value}</span>
              <span
                className={`text-xs font-medium ${
                  segment.trend.startsWith("+") ? "text-emerald-600" : "text-amber-600"
                }`}
              >
                {segment.trend}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProviderDashboardHome() {
  const { onAddPolicy } = useOutletContext<ProviderOutletContext>();
  const { profile } = useProvider();
  const navigate = useNavigate();
  const [range, setRange] = useState<DateRangeValue>(defaultProviderRange);
  const [dashboard, setDashboard] = useState<InsurerDashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async (r: DateRangeValue) => {
    setLoading(true);
    try {
      const data = await fetchInsurerDashboard(toRangeQuery(r));
      setDashboard(data.dashboard);
      setRange(parseRangeFromApi(data.dashboard.dateRange.from, data.dashboard.dateRange.to));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not load dashboard intelligence");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard(range);
  }, []);

  const companyName = profile?.companyName ?? "Provider";

  const handleInsightAction = useCallback(
    (insight: InsurerSmartInsight) => {
      if (insight.actionType === "create_policy") {
        onAddPolicy();
        return;
      }
      navigate(insightActionLink(insight.actionType));
    },
    [navigate, onAddPolicy]
  );

  const notificationCount = dashboard?.badges.notifications ?? 0;

  if (loading || !dashboard) {
    return (
      <div className="flex justify-center py-24" style={{ backgroundColor: THEME.bg }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: THEME.primary }} />
      </div>
    );
  }

  return (
    <div
      className={`${PROVIDER_PAGE_CLASS} min-h-full`}
      style={{ backgroundColor: THEME.bg, fontFamily: "Inter, sans-serif" }}
    >
      {/* Top header */}
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            {greeting()}, {companyName} 👋
          </h1>
          <p className="text-slate-500 mt-1">Here&apos;s your business overview for today.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <ProviderDateRangePicker
            value={range}
            onChange={(next) => {
              setRange(next);
              void loadDashboard(next);
            }}
          />
          <Link
            to="/provider-dashboard/messages"
            className="relative p-2.5 rounded-2xl border bg-white hover:bg-slate-50 transition-colors"
            style={{ borderColor: "#E5E7EB", boxShadow: THEME.shadow }}
          >
            <Bell className="w-5 h-5 text-slate-600" />
            {notificationCount > 0 ? (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
                {notificationCount > 9 ? "9+" : notificationCount}
              </span>
            ) : null}
          </Link>
          <button
            type="button"
            onClick={onAddPolicy}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-white text-sm font-semibold hover:opacity-95 transition-opacity"
            style={{ backgroundColor: THEME.primary, boxShadow: "0 8px 20px rgba(37,99,235,0.35)" }}
          >
            <Plus className="w-4 h-4" />
            Create Policy
          </button>
        </div>
      </motion.header>

      {/* Overview stats — 6 column grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 min-w-0">
        {dashboard.overviewStats.map((stat: InsurerDashboardOverviewStat, index) => {
          const Icon = STAT_ICONS[stat.icon] ?? TrendingUp;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -4 }}
              className="p-5 border bg-white transition-shadow hover:shadow-lg"
              style={{
                borderRadius: THEME.radius,
                borderColor: THEME.border,
                boxShadow: THEME.shadow,
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: `${stat.iconColor}18` }}
                >
                  <Icon className="w-5 h-5" style={{ color: stat.iconColor }} />
                </div>
                <span
                  className={`text-xs font-semibold ${
                    stat.trend === "up"
                      ? "text-emerald-600"
                      : stat.trend === "down"
                        ? "text-amber-600"
                        : "text-slate-500"
                  }`}
                >
                  {stat.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-sm text-slate-500 mt-1">{stat.title}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 min-w-0">
        <div className="xl:col-span-8 space-y-5 min-w-0">
          {/* Smart Business Insights */}
          <section
            className="p-6 border bg-white"
            style={{ borderRadius: THEME.radius, borderColor: THEME.border, boxShadow: THEME.shadow }}
          >
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Smart Business Insights</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Actionable recommendations to grow your business
                </p>
              </div>
              <button
                type="button"
                onClick={() => void loadDashboard(range)}
                className="text-sm font-medium shrink-0 hover:underline"
                style={{ color: THEME.primary }}
              >
                Refresh insights
              </button>
            </div>
            {dashboard.smartInsights.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">
                Insights will appear as seekers complete questionnaires and interact with your policies.
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {dashboard.smartInsights.map((insight, index) => {
                  const palette = INSIGHT_THEMES[insight.theme];
                  return (
                    <motion.button
                      key={`${insight.title}-${index}`}
                      type="button"
                      onClick={() => handleInsightAction(insight)}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + index * 0.06 }}
                      whileHover={{ y: -3 }}
                      className={`text-left p-5 rounded-[20px] border bg-white hover:shadow-md transition-all ${palette.border}`}
                    >
                      <span
                        className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-3 ${palette.badge}`}
                      >
                        {insight.badge}
                      </span>
                      <h3 className="font-semibold text-slate-900 mb-1">{insight.title}</h3>
                      <p className="text-sm text-slate-500 leading-relaxed mb-4">{insight.description}</p>
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-xs text-slate-400">{insight.metricLabel}</p>
                          <p className="text-lg font-bold text-slate-900">{insight.metricValue}</p>
                        </div>
                        <MiniSparkline data={insight.sparkline} color={palette.chart} />
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </section>

          {/* Top Performing Policies */}
          <section
            className="p-6 border bg-white overflow-hidden"
            style={{ borderRadius: THEME.radius, borderColor: THEME.border, boxShadow: THEME.shadow }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">Top Performing Policies</h2>
              <Link
                to="/provider-dashboard/policies"
                className="text-sm font-medium hover:underline"
                style={{ color: THEME.primary }}
              >
                View all policies
              </Link>
            </div>
            {dashboard.topPolicies.length === 0 ? (
              <p className="text-sm text-slate-500 py-8 text-center">
                Add approved policies and complete purchases to see performance rankings.
              </p>
            ) : (
              <div className="w-full min-w-0">
                <table className="w-full text-xs sm:text-sm table-fixed">
                  <thead>
                    <tr className="text-left text-slate-500 border-b" style={{ borderColor: THEME.border }}>
                      <th className="pb-3 px-2 font-medium">Policy Name</th>
                      <th className="pb-3 px-2 font-medium">Category</th>
                      <th className="pb-3 px-2 font-medium">Match Popularity</th>
                      <th className="pb-3 px-2 font-medium">Conversion Rate</th>
                      <th className="pb-3 px-2 font-medium">Most Interested Users</th>
                      <th className="pb-3 px-2 font-medium">Revenue (This Week)</th>
                      <th className="pb-3 px-2 font-medium">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.topPolicies.map((row) => {
                      const matchNum = parseInt(row.match, 10) || 0;
                      return (
                        <tr
                          key={row.policyId}
                          className="border-b last:border-0 hover:bg-slate-50/80"
                          style={{ borderColor: THEME.border }}
                        >
                          <td className="py-4 px-2 font-medium text-slate-900">{row.policy}</td>
                          <td className="py-4 px-2 text-slate-600">{row.category}</td>
                          <td className="py-4 px-2">
                            <div className="flex items-center gap-2 min-w-[120px]">
                              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{ width: `${matchNum}%`, backgroundColor: THEME.primary }}
                                />
                              </div>
                              <span className="text-xs font-medium text-slate-600">{row.match}</span>
                            </div>
                          </td>
                          <td className="py-4 px-2 text-slate-700">{row.conversion}</td>
                          <td className="py-4 px-2 text-slate-600">{row.audience}</td>
                          <td className="py-4 px-2 font-medium text-slate-900">{row.revenue}</td>
                          <td className="py-4 px-2">
                            <PolicyTrendSparkline data={row.trend} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Quick Actions */}
          <section
            className="p-6 border bg-white"
            style={{ borderRadius: THEME.radius, borderColor: THEME.border, boxShadow: THEME.shadow }}
          >
            <div className="mb-5">
              <h2 className="text-lg font-bold text-slate-900">Quick Actions</h2>
              <p className="text-sm text-slate-500">Shortcuts to save your time</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <QuickAction
                title="Create Policy"
                description="Add new insurance policy"
                icon={Plus}
                onClick={onAddPolicy}
              />
              <QuickAction
                title="View Leads"
                description="Browse potential customers"
                icon={Users}
                to="/provider-dashboard/leads"
              />
              <QuickAction
                title="Review Claims"
                description="Accept or reject claims"
                icon={ShieldCheck}
                to="/provider-dashboard/claims"
                badge={dashboard.badges.claims}
              />
              <QuickAction
                title="Send Offer"
                description="Create special discount"
                icon={Tag}
                to="/provider-dashboard/leads"
              />
              <QuickAction
                title="Support Center"
                description="Get help from our team"
                icon={Headphones}
                to="/provider-dashboard/support"
              />
            </div>
          </section>
        </div>

        <div className="xl:col-span-4 space-y-5 min-w-0">
          <section
            className="p-6 border bg-white"
            style={{ borderRadius: THEME.radius, borderColor: THEME.border, boxShadow: THEME.shadow }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Customer Demand Trends</h2>
              <Link
                to="/provider-dashboard/analytics"
                className="text-sm font-medium hover:underline"
                style={{ color: THEME.primary }}
              >
                View full report
              </Link>
            </div>
            <DonutChartBlock dashboard={dashboard} />
            <div
              className="mt-6 p-4 rounded-2xl border"
              style={{ backgroundColor: "#F8FAFC", borderColor: THEME.border }}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {dashboard.demandTrends.footerInsight.label}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                  {dashboard.demandTrends.footerInsight.badge}
                </span>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">
                {dashboard.demandTrends.footerInsight.text}
              </p>
            </div>
          </section>

          <section
            className="p-6 border bg-white"
            style={{ borderRadius: THEME.radius, borderColor: THEME.border, boxShadow: THEME.shadow }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Recent Leads</h2>
              <Link
                to="/provider-dashboard/leads"
                className="text-sm font-medium hover:underline"
                style={{ color: THEME.primary }}
              >
                View all leads
              </Link>
            </div>
            {dashboard.recentLeads.length === 0 ? (
              <p className="text-sm text-slate-500 py-4">No leads yet.</p>
            ) : (
              <ul className="space-y-4">
                {dashboard.recentLeads.map((lead) => (
                  <li key={lead.id} className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
                      style={{ backgroundColor: `${THEME.primary}15`, color: THEME.primary }}
                    >
                      {lead.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{lead.name}</p>
                      <p className="text-xs text-slate-500">
                        {lead.category} · {lead.time}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full shrink-0 ${
                        lead.status === "Hot"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {lead.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section
            className="p-6 border bg-white"
            style={{ borderRadius: THEME.radius, borderColor: THEME.border, boxShadow: THEME.shadow }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Pending Claims</h2>
              <Link
                to="/provider-dashboard/claims"
                className="text-sm font-medium hover:underline"
                style={{ color: THEME.primary }}
              >
                View all claims
              </Link>
            </div>
            {dashboard.pendingClaims.length === 0 ? (
              <p className="text-sm text-slate-500 py-4">No claims awaiting review.</p>
            ) : (
              <ul className="space-y-4">
                {dashboard.pendingClaims.map((claim) => (
                  <li
                    key={claim.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-2xl border"
                    style={{ borderColor: THEME.border, backgroundColor: "#F8FAFC" }}
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{claim.claimId}</p>
                      <p className="text-xs text-slate-500">
                        {claim.category} · {claim.submitted}
                      </p>
                    </div>
                    <Link
                      to="/provider-dashboard/claims"
                      className="text-xs font-semibold px-3 py-1.5 rounded-xl text-white shrink-0"
                      style={{ backgroundColor: THEME.primary }}
                    >
                      Review
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  title,
  description,
  icon: Icon,
  to,
  onClick,
  badge,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  to?: string;
  onClick?: () => void;
  badge?: number;
}) {
  const inner = (
    <>
      <div className="relative w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-slate-50">
        <Icon className="w-5 h-5 text-slate-700" />
        {badge && badge > 0 ? (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-blue-600 text-white text-[10px] font-bold">
            {badge}
          </span>
        ) : null}
      </div>
      <p className="font-semibold text-slate-900 text-sm">{title}</p>
      <p className="text-xs text-slate-500 mt-0.5">{description}</p>
    </>
  );

  const className =
    "text-left p-4 rounded-[20px] border bg-white hover:shadow-md hover:-translate-y-0.5 transition-all";
  const style = { borderColor: THEME.border, boxShadow: THEME.shadow };

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className} style={style}>
        {inner}
      </button>
    );
  }

  return (
    <Link to={to ?? "#"} className={className} style={style}>
      {inner}
    </Link>
  );
}
