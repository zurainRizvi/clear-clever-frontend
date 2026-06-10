import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Bot,
  BrainCircuit,
  CheckCircle2,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { LayoutGroup, motion } from "motion/react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { layoutSpring } from "@/lib/motion-presets";
import {
  fetchHealth,
  fetchMlOverview,
  type AdminMlOverview,
  type AssistantHealthReport,
  type HealthStatus,
  type InfrastructureServiceStatus,
} from "@/lib/admin-api";
import { DashboardStatsCarousel, type DashboardStatItem } from "../ui/dashboard-stats-carousel";
import { LiveSparkline } from "../ui/live-sparkline";

const REFRESH_MS = 30_000;
const FB_BLUE = "#1877F2";
const FB_BLUE_LIGHT = "#E7F3FF";

type HealthTab = "infrastructure" | "assistant" | "ml";

function statusTone(ok: boolean) {
  return ok ? "text-emerald-600" : "text-red-600";
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

function HealthTabs({
  active,
  onChange,
}: {
  active: HealthTab;
  onChange: (tab: HealthTab) => void;
}) {
  const tabs: Array<{ id: HealthTab; label: string }> = [
    { id: "infrastructure", label: "Infrastructure" },
    { id: "assistant", label: "AI Assistant" },
    { id: "ml", label: "ML Intelligence" },
  ];

  return (
    <div className="overflow-x-auto scrollbar-none">
      <LayoutGroup id="admin-health-tabs">
        <div className="inline-flex gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200">
          {tabs.map((tab) => {
            const isActive = tab.id === active;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChange(tab.id)}
                className={`relative rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  isActive ? "text-white" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {isActive ? (
                  <motion.span
                    layoutId="admin-health-tab-active"
                    className="absolute inset-0 rounded-lg"
                    style={{ backgroundColor: FB_BLUE }}
                    transition={layoutSpring}
                  />
                ) : null}
                <span className="relative z-[1]">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </LayoutGroup>
    </div>
  );
}

function ServiceRow({ service }: { service: InfrastructureServiceStatus }) {
  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200">
      <div>
        <p className="font-semibold text-sm text-slate-900">{service.label}</p>
        <p className="text-xs text-slate-500 mt-0.5">
          {service.detail ?? (service.url ? service.url : "Monitoring active")}
        </p>
      </div>
      <div className="text-right">
        <span className={`text-sm font-semibold ${statusTone(service.ok)}`}>
          {service.ok ? "Operational" : "Needs attention"}
        </span>
        {service.latencyMs > 0 ? (
          <p className="text-[10px] text-slate-400 mt-0.5">{service.latencyMs}ms response</p>
        ) : null}
      </div>
    </div>
  );
}

function InsightBanner({
  title,
  description,
  badge,
  theme,
}: AdminMlOverview["insights"][number]) {
  const styles = {
    blue: "border-blue-200 bg-blue-50 text-blue-900",
    green: "border-emerald-200 bg-emerald-50 text-emerald-900",
    purple: "border-violet-200 bg-violet-50 text-violet-900",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
  } as const;

  return (
    <div className={`rounded-2xl border p-4 ${styles[theme]}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-sm">{title}</p>
          <p className="text-sm mt-1 opacity-90 leading-relaxed">{description}</p>
        </div>
        <span className="shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/70 border border-white">
          {badge}
        </span>
      </div>
    </div>
  );
}

function ModelCard({ model }: { model: AdminMlOverview["models"][number] }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h4 className="font-bold text-slate-900">{model.title}</h4>
          <p className="text-sm text-slate-500 mt-0.5">{model.subtitle}</p>
        </div>
        <span
          className={`shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full ${
            model.status === "active"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-amber-50 text-amber-700 border border-amber-200"
          }`}
        >
          {model.statusLabel}
        </span>
      </div>

      <div className="space-y-3 text-sm">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1">
            What it does
          </p>
          <p className="text-slate-700 leading-relaxed">{model.useCase}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1">
            Business value
          </p>
          <p className="text-slate-700 leading-relaxed">{model.businessValue}</p>
        </div>
        <p className="text-xs text-slate-500">
          <span className="font-semibold text-slate-600">Used in:</span> {model.whereUsed}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100">
        {model.metrics.map((metric) => (
          <div key={metric.label} className="rounded-xl bg-slate-50 px-2 py-2 text-center">
            <p className="text-[10px] uppercase tracking-wide text-slate-400">{metric.label}</p>
            <p className="text-sm font-bold text-slate-900 mt-0.5">{metric.value}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

function AssistantPanel({ assistant }: { assistant: AssistantHealthReport }) {
  const usage = assistant.usage;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Bot className="w-5 h-5" style={{ color: FB_BLUE }} />
              Gemini AI assistant
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Powers conversational support, policy explainers, claim intelligence, and CNIC
              verification across ClearClever.
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Model: {assistant.displayName ?? assistant.model}
              {assistant.modelResourceName ? ` · ${assistant.modelResourceName}` : ""}
            </p>
          </div>
          <span className={`text-sm font-semibold ${statusTone(assistant.ok)}`}>
            {assistant.configured ? (assistant.ok ? "Operational" : "Needs attention") : "Not configured"}
          </span>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {[
          {
            label: "Total AI calls",
            value: usage.totalApiCalls.toLocaleString(),
            sub: `${usage.successfulApiCalls} successful · ${usage.failedApiCalls} failed`,
            spark: usage.totalApiCalls,
          },
          {
            label: "Tokens consumed",
            value: usage.totalTokens.toLocaleString(),
            sub: `${usage.totalPromptTokens.toLocaleString()} prompt · ${usage.totalCompletionTokens.toLocaleString()} completion`,
            spark: usage.totalTokens,
          },
          {
            label: "Claim intelligence",
            value: String(usage.claimIntelligenceApiCalls ?? 0),
            sub: "Structured claim analysis for insurers",
            spark: usage.claimIntelligenceApiCalls ?? 0,
          },
          {
            label: "KYC verification",
            value: String(usage.kycApiCalls ?? 0),
            sub: "CNIC document checks for seekers",
            spark: usage.kycApiCalls ?? 0,
          },
          {
            label: "Chat / explain / probe",
            value: `${usage.chatApiCalls} / ${usage.explainApiCalls} / ${usage.probeApiCalls}`,
            sub: "Support assistant traffic split",
            spark: usage.chatApiCalls,
          },
          {
            label: "Rate limit events",
            value: String(usage.rateLimitErrors),
            sub: `${usage.requestsLastMinute} calls in the last minute`,
            spark: usage.rateLimitErrors,
          },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">{item.label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{item.value}</p>
            {item.sub ? <p className="text-xs text-slate-500 mt-1">{item.sub}</p> : null}
            <LiveSparkline seed={item.label} color={FB_BLUE} className="mt-3 h-8" height={32} />
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm space-y-2">
          <p className="font-semibold text-slate-900">Configured limits</p>
          <ul className="space-y-1 text-slate-600">
            <li>
              Max output tokens: chat{" "}
              {(assistant.limits.configuredChatMaxOutputTokens ?? assistant.limits.configuredMaxOutputTokens).toLocaleString()}{" "}
              · structured {assistant.limits.configuredMaxOutputTokens.toLocaleString()}
            </li>
            <li>
              App rate limit: {assistant.limits.assistantRateLimitPerMin}/min signed-in ·{" "}
              {assistant.limits.anonymousRateLimitPerMin}/min guest
            </li>
            <li>Upstream Gemini cap: {assistant.limits.geminiUpstreamRpm}/min</li>
            <li>
              Attachments: {assistant.limits.maxAttachmentsPerMessage} files · max{" "}
              {formatBytes(assistant.limits.maxBytesPerAttachment)} each
            </li>
          </ul>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm space-y-2">
          <p className="font-semibold text-slate-900">Runtime</p>
          <ul className="space-y-1 text-slate-600">
            <li>Server started: {new Date(usage.serverStartedAt).toLocaleString()}</li>
            <li>
              Last Gemini call:{" "}
              {usage.lastRequestAt ? new Date(usage.lastRequestAt).toLocaleString() : "None yet"}
            </li>
            <li>Health probe latency: {assistant.latencyMs > 0 ? `${assistant.latencyMs}ms` : "—"}</li>
          </ul>
        </div>
      </div>

      {usage.recentErrors.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-900">Recent Gemini errors</p>
          {usage.recentErrors.map((item) => (
            <p
              key={`${item.at}-${item.route}`}
              className="text-xs p-3 rounded-xl bg-red-50 border border-red-100 text-red-700"
            >
              [{item.route}] {new Date(item.at).toLocaleString()} — {item.message}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function MlIntelligencePanel({ ml }: { ml: AdminMlOverview }) {
  const trendData = ml.trends.labels.map((label, index) => ({
    label,
    claims: ml.trends.claimsSubmitted[index] ?? 0,
    aiReports: ml.trends.aiReportsGenerated[index] ?? 0,
    questionnaires: ml.trends.questionnaireCompletions[index] ?? 0,
  }));

  const statItems = useMemo((): DashboardStatItem[] => {
    return [
      {
        id: "models",
        icon: (
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: FB_BLUE_LIGHT }}
          >
            <BrainCircuit className="w-4 h-4" style={{ color: FB_BLUE }} />
          </div>
        ),
        value: `${ml.summary.activeModels}/${ml.summary.totalModels}`,
        label: "ML models live on platform",
        footer: <span className="text-emerald-600 font-medium">{ml.adoption.rankerCoverageLabel}</span>,
        sparkColor: FB_BLUE,
        sparkline: ml.trends.claimsSubmitted,
        cardClassName: "bg-white border-slate-200",
      },
      {
        id: "ai",
        icon: (
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-violet-50">
            <Sparkles className="w-4 h-4 text-violet-600" />
          </div>
        ),
        value: ml.adoption.aiReportRateLabel,
        label: "Claims with AI intelligence reports",
        footer: (
          <span className="text-slate-500">
            {ml.platformActivity.claimsWithAiReports} of {ml.platformActivity.claimsTotal} claims
          </span>
        ),
        sparkColor: "#8B5CF6",
        sparkline: ml.trends.aiReportsGenerated,
        cardClassName: "bg-white border-slate-200",
      },
      {
        id: "kyc",
        icon: (
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-50">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
        ),
        value: String(ml.summary.verifiedIdentities),
        label: "Verified policyholder identities",
        footer: <span className="text-slate-500">{ml.adoption.kycVerifiedRateLabel} of purchasers</span>,
        sparkColor: "#10B981",
        sparkline: ml.trends.questionnaireCompletions,
        cardClassName: "bg-white border-slate-200",
      },
      {
        id: "engagement",
        icon: (
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-50">
            <Users className="w-4 h-4 text-amber-600" />
          </div>
        ),
        value: String(ml.summary.questionnaireSeekers),
        label: "Seekers feeding ML questionnaires",
        footer: (
          <span className="text-slate-500">
            {ml.platformActivity.questionnaireResponses} total responses
          </span>
        ),
        sparkColor: "#F59E0B",
        sparkline: ml.trends.questionnaireCompletions,
        cardClassName: "bg-white border-slate-200",
      },
    ];
  }, [ml]);

  return (
    <div className="space-y-6">
      <div
        className="rounded-2xl border p-6 text-white overflow-hidden relative"
        style={{
          background: `linear-gradient(135deg, ${FB_BLUE} 0%, #0A5BD3 55%, #004BB5 100%)`,
        }}
      >
        <div className="relative z-[1]">
          <p className="text-white/80 text-xs font-semibold uppercase tracking-widest mb-2">
            ClearClever ML Platform
          </p>
          <h3 className="text-2xl font-bold tracking-tight">
            AI & machine learning powering your marketplace
          </h3>
          <p className="text-white/85 text-sm mt-2 max-w-2xl leading-relaxed">
            From personalized policy recommendations to claim fraud scoring and CNIC verification —
            every model below delivers measurable value to seekers, insurers, and platform operations.
          </p>
        </div>
        <Sparkles className="absolute right-6 top-6 w-16 h-16 text-white/10" aria-hidden />
      </div>

      <DashboardStatsCarousel items={statItems} durationSec={42} />

      <div className="grid lg:grid-cols-2 gap-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h4 className="font-bold text-slate-900 mb-1">Platform activity (7 days)</h4>
          <p className="text-xs text-slate-500 mb-4">Claims submitted vs AI reports generated</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="claimsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={FB_BLUE} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={FB_BLUE} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="aiGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#64748B" }} width={28} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="claims" name="Claims" stroke={FB_BLUE} fill="url(#claimsGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="aiReports" name="AI reports" stroke="#8B5CF6" fill="url(#aiGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h4 className="font-bold text-slate-900 mb-1">Questionnaire completions</h4>
          <p className="text-xs text-slate-500 mb-4">Signals that train recommendation & fraud models</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#64748B" }} width={28} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="questionnaires" name="Completions" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {ml.insights.map((insight) => (
          <InsightBanner key={insight.title} {...insight} />
        ))}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5" style={{ color: FB_BLUE }} />
          <h4 className="font-bold text-slate-900">Models & use cases</h4>
        </div>
        <div className="grid xl:grid-cols-2 gap-4">
          {ml.models.map((model) => (
            <ModelCard key={model.id} model={model} />
          ))}
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h4 className="font-bold text-slate-900 mb-3">Last 24 hours snapshot</h4>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "New claims", value: ml.platformActivity.claimsLast24h },
            { label: "With AI reports", value: ml.platformActivity.claimsWithAiLast24h },
            { label: "Completed purchases", value: ml.platformActivity.purchasesCompleted },
            { label: "Unique questionnaire users", value: ml.platformActivity.questionnaireUniqueUsers },
          ].map((row) => (
            <div key={row.label} className="rounded-xl bg-slate-50 border border-slate-100 p-4">
              <p className="text-[11px] uppercase tracking-wide text-slate-400">{row.label}</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{row.value.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function AdminHealthPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [mlOverview, setMlOverview] = useState<AdminMlOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<HealthTab>("ml");

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [data, ml] = await Promise.all([fetchHealth(), fetchMlOverview()]);
      setHealth(data);
      setMlOverview(ml);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not load system health");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => void load(true), REFRESH_MS);
    return () => window.clearInterval(interval);
  }, [load]);

  if (loading && !health) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: FB_BLUE }} />
      </div>
    );
  }

  const infra = health?.infrastructure;
  const assistant = health?.assistant;
  const allOk =
    infra?.render.ok &&
    infra?.vercel.ok &&
    infra?.mongodb.ok &&
    infra?.brevo.ok &&
    (!assistant?.configured || infra?.gemini.ok);

  const diagnosticItems: Array<{ tone: "error" | "hint" | "warning" | "info"; text: string }> = [];
  if (health?.email?.error) diagnosticItems.push({ tone: "error", text: `Email error: ${health.email.error}` });
  if (health?.email?.hint) diagnosticItems.push({ tone: "hint", text: health.email.hint });
  if (health?.email?.renderFreeTierNote) diagnosticItems.push({ tone: "warning", text: health.email.renderFreeTierNote });
  for (const line of assistant?.diagnostics ?? []) diagnosticItems.push({ tone: "info", text: line });
  for (const line of assistant?.notes ?? []) diagnosticItems.push({ tone: "hint", text: line });

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">System health</h1>
          <p className="text-slate-500 max-w-2xl">
            Monitor infrastructure, AI services, and machine learning models that power ClearClever
            for seekers and insurers.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium bg-white hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div
        className={`rounded-2xl border p-5 ${
          allOk ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"
        }`}
      >
        <div className="flex items-center gap-3">
          <CheckCircle2 className={`w-6 h-6 ${allOk ? "text-emerald-600" : "text-amber-600"}`} />
          <div>
            <p className="font-semibold text-slate-900">
              {allOk ? "Platform services are healthy" : "Some services need your attention"}
            </p>
            <p className="text-sm text-slate-600">
              Environment: {health?.environment ?? "unknown"} · Last check:{" "}
              {infra?.checkedAt
                ? new Date(infra.checkedAt).toLocaleString()
                : health?.timestamp
                  ? new Date(health.timestamp).toLocaleString()
                  : "—"}
              <span className="ml-2 text-xs text-slate-400">Auto-refresh every 30s</span>
            </p>
          </div>
        </div>
      </div>

      <HealthTabs active={tab} onChange={setTab} />

      {tab === "infrastructure" ? (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5" style={{ color: FB_BLUE }} />
              Infrastructure services
            </h3>
            {infra ? (
              <div className="space-y-3">
                <ServiceRow service={infra.render} />
                <ServiceRow service={infra.vercel} />
                <ServiceRow service={infra.mongodb} />
                <ServiceRow service={infra.brevo} />
                <ServiceRow service={infra.gemini} />
              </div>
            ) : (
              <p className="text-sm text-slate-500">Infrastructure probe data unavailable.</p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Diagnostics</h3>
            <div className="space-y-3 text-sm">
              {diagnosticItems.length === 0 ? (
                <p className="text-slate-500">No additional diagnostics reported.</p>
              ) : (
                diagnosticItems.map((item, index) => (
                  <p
                    key={`${item.tone}-${index}`}
                    className={`p-3 rounded-xl ${
                      item.tone === "error"
                        ? "bg-red-50 border border-red-100 text-red-700"
                        : item.tone === "warning"
                          ? "bg-amber-50 border border-amber-100 text-amber-800"
                          : "bg-slate-50 border border-slate-100 text-slate-600"
                    }`}
                  >
                    {item.text}
                  </p>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}

      {tab === "assistant" && assistant ? <AssistantPanel assistant={assistant} /> : null}

      {tab === "ml" && mlOverview ? <MlIntelligencePanel ml={mlOverview} /> : null}
    </div>
  );
}
