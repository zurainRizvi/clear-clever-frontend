import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Bot,
  BrainCircuit,
  CheckCircle2,
  Eye,
  Loader2,
  Mic,
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
  fetchMlRetrainReport,
  keepMlRetrainModel,
  promoteMlRetrainModel,
  type AdminMlOverview,
  type MlRetrainReport,
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
        <div className="inline-flex gap-1 rounded-xl bg-muted p-1 border border-border">
          {tabs.map((tab) => {
            const isActive = tab.id === active;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChange(tab.id)}
                className={`relative rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  isActive ? "text-white" : "text-muted-foreground hover:text-foreground"
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
  const sparkSeed = `${service.label}-${service.ok ? "ok" : "bad"}`;
  return (
    <div className="relative flex items-center justify-between p-4 bg-card rounded-xl border border-border overflow-hidden gap-4">
      {service.ok ? (
        <span
          className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"
          aria-hidden
        />
      ) : null}
      <div className="pl-2 min-w-0 flex-1">
        <p className="font-semibold text-sm text-foreground">{service.label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {service.detail ?? (service.url ? service.url : "Monitoring active")}
        </p>
        {service.ok ? (
          <div className="mt-3 max-w-[160px]">
            <LiveSparkline seed={sparkSeed} color="#10B981" className="h-8" height={32} width={140} />
          </div>
        ) : null}
      </div>
      <div className="text-right flex flex-col items-end justify-center min-h-[52px] gap-1">
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full border ${
            service.ok
              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
              : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800"
          }`}
        >
          {service.ok ? (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden />
          ) : null}
          {service.ok ? "Operational" : "Needs attention"}
        </span>
        <p className="text-[10px] text-muted-foreground tabular-nums min-w-[72px] text-right">
          {service.latencyMs > 0 ? `${service.latencyMs}ms response` : "—"}
        </p>
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
    blue: "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-200",
    green: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200",
    purple: "border-violet-200 bg-violet-50 text-violet-900 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-200",
    amber: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200",
  } as const;

  return (
    <div className={`rounded-2xl border p-4 ${styles[theme]}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-sm">{title}</p>
          <p className="text-sm mt-1 opacity-90 leading-relaxed">{description}</p>
        </div>
        <span className="shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full bg-background/70 border border-border">
          {badge}
        </span>
      </div>
    </div>
  );
}

function ModelCard({ model }: { model: AdminMlOverview["models"][number] }) {
  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h4 className="font-bold text-foreground">{model.title}</h4>
          <p className="text-sm text-muted-foreground mt-0.5">{model.subtitle}</p>
        </div>
        <span
          className={`shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full ${
            model.status === "active"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
              : "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
          }`}
        >
          {model.statusLabel}
        </span>
      </div>

      <div className="space-y-3 text-sm">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            What it does
          </p>
          <p className="text-foreground/90 leading-relaxed">{model.useCase}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Business value
          </p>
          <p className="text-foreground/90 leading-relaxed">{model.businessValue}</p>
        </div>
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground/80">Used in:</span> {model.whereUsed}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4 pt-4 border-t border-border">
        {model.metrics.map((metric) => (
          <div key={metric.label} className="rounded-xl bg-muted/40 px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{metric.label}</p>
            <p className="text-sm font-bold text-foreground mt-0.5">{metric.value}</p>
            {"description" in metric && metric.description ? (
              <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{metric.description}</p>
            ) : null}
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
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Bot className="w-5 h-5" style={{ color: FB_BLUE }} />
              Gemini AI assistant
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Powers conversational support, policy explainers, claim intelligence, and CNIC
              verification across ClearClever.
            </p>
            <p className="text-xs text-muted-foreground/80 mt-2">
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
          <div key={item.label} className="rounded-2xl border border-border bg-card p-4">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{item.label}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{item.value}</p>
            {item.sub ? <p className="text-xs text-muted-foreground mt-1">{item.sub}</p> : null}
            <LiveSparkline seed={item.label} color={FB_BLUE} className="mt-3 h-8" height={32} />
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border bg-card p-5 text-sm space-y-2">
          <p className="font-semibold text-foreground flex items-center gap-2">
            <Eye className="w-4 h-4 text-violet-600" />
            Gemini vision & attachments
          </p>
          <p className="text-xs text-muted-foreground">
            Multimodal prompts sent to {assistant.displayName ?? assistant.model} with images or PDFs.
          </p>
          {assistant.vision ? (
            <ul className="space-y-2 text-muted-foreground">
              {assistant.vision.useCases.map((item) => (
                <li key={item.route}>
                  <span className="font-medium text-foreground">{item.label}:</span> {item.description}
                </li>
              ))}
              <li>
                <span className="font-medium text-foreground">Allowed files:</span>{" "}
                {assistant.vision.supportedMimeTypes.join(", ")} · max{" "}
                {assistant.vision.maxAttachmentsPerMessage} per message ·{" "}
                {formatBytes(assistant.vision.maxBytesPerAttachment)} each
              </li>
              <li>
                <span className="font-medium text-foreground">Calls since deploy:</span>{" "}
                {assistant.vision.apiCallsSinceDeploy.chat} chat ·{" "}
                {assistant.vision.apiCallsSinceDeploy.kyc} KYC ·{" "}
                {assistant.vision.apiCallsSinceDeploy.claimIntelligence} claim intelligence
              </li>
            </ul>
          ) : null}
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 text-sm space-y-2">
          <p className="font-semibold text-foreground flex items-center gap-2">
            <Mic className="w-4 h-4 text-cyan-600" />
            Speech-to-text
          </p>
          {assistant.speechToText ? (
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">Provider:</span>{" "}
                {assistant.speechToText.provider}
              </li>
              <li>
                <span className="font-medium text-foreground">Surfaces:</span>{" "}
                {assistant.speechToText.surfaces.join(" · ")}
              </li>
              <li>
                <span className="font-medium text-foreground">Languages:</span>{" "}
                {assistant.speechToText.languages.join(" · ")}
              </li>
              <li>{assistant.speechToText.note}</li>
            </ul>
          ) : (
            <p className="text-muted-foreground">Browser speech recognition for hands-free chat input.</p>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border bg-card p-5 text-sm space-y-2">
          <p className="font-semibold text-foreground">Fair-use limits</p>
          <p className="text-xs text-muted-foreground">
            These limits protect response quality and keep AI costs predictable across ClearClever.
          </p>
          <ul className="space-y-2 text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">Response length cap:</span> up to ~
              {(assistant.limits.configuredChatMaxOutputTokens ?? assistant.limits.configuredMaxOutputTokens).toLocaleString()}{" "}
              tokens per chat reply · up to {assistant.limits.configuredMaxOutputTokens.toLocaleString()}{" "}
              for structured reports
            </li>
            <li>
              <span className="font-medium text-foreground">Fair-use throttle:</span>{" "}
              {assistant.limits.assistantRateLimitPerMin}/min for signed-in users ·{" "}
              {assistant.limits.anonymousRateLimitPerMin}/min for guests
            </li>
            <li>
              <span className="font-medium text-foreground">Google AI quota:</span> platform-wide{" "}
              {assistant.limits.geminiUpstreamRpm} Gemini calls/min
            </li>
            <li>
              <span className="font-medium text-foreground">File uploads:</span> up to{" "}
              {assistant.limits.maxAttachmentsPerMessage} images per message · max{" "}
              {formatBytes(assistant.limits.maxBytesPerAttachment)} each
            </li>
          </ul>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 text-sm space-y-2">
          <p className="font-semibold text-foreground">Runtime</p>
          <ul className="space-y-1 text-muted-foreground">
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
          <p className="text-sm font-semibold text-foreground">Recent Gemini errors</p>
          {usage.recentErrors.map((item) => (
            <p
              key={`${item.at}-${item.route}`}
              className="text-xs p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 dark:bg-red-950/30 dark:border-red-900 dark:text-red-300"
            >
              [{item.route}] {new Date(item.at).toLocaleString()} — {item.message}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function formatMetricPct(value?: number): string {
  if (value == null) return "—";
  return `${Math.round(value * 1000) / 10}%`;
}

function MlRetrainReviewPanel({
  report,
  loading,
  onPromote,
  onKeep,
  onRefresh,
}: {
  report: MlRetrainReport | null;
  loading: boolean;
  onPromote: (modelId: string) => Promise<void>;
  onKeep: (modelId: string) => Promise<void>;
  onRefresh: () => Promise<void>;
}) {
  const candidates = report?.models.filter((model) => model.hasCandidate) ?? [];

  return (
    <section className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="font-bold text-foreground">Model retrain review</h4>
          <p className="text-xs text-muted-foreground mt-1">
            Monthly jobs upload candidate models here. Review offline holdout metrics before promoting live
            scores.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void onRefresh()}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-muted/50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh report
        </button>
      </div>

      {loading && !report ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : candidates.length === 0 ? (
        <p className="text-sm text-muted-foreground rounded-xl bg-muted/30 border border-border p-4">
          No candidate models are waiting for review. Active production versions continue serving live scores.
        </p>
      ) : (
        <div className="space-y-4">
          {candidates.map((model) => (
            <div key={model.modelId} className="rounded-xl border border-border p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-foreground">{model.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Active {model.activeVersion}
                    {model.candidateVersion ? ` · Candidate ${model.candidateVersion}` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void onKeep(model.modelId)}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted/50"
                  >
                    Keep current
                  </button>
                  <button
                    type="button"
                    onClick={() => void onPromote(model.modelId)}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-white"
                    style={{ backgroundColor: FB_BLUE }}
                  >
                    Promote candidate
                  </button>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg bg-muted/30 p-3">
                  <p className="font-semibold text-foreground mb-2">Active metrics</p>
                  <p>Accuracy: {formatMetricPct(model.activeMetrics?.accuracy)}</p>
                  <p>ROC-AUC: {formatMetricPct(model.activeMetrics?.roc_auc)}</p>
                </div>
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-3">
                  <p className="font-semibold text-foreground mb-2">Candidate metrics</p>
                  <p>Accuracy: {formatMetricPct(model.candidateReport?.metrics.accuracy)}</p>
                  <p>ROC-AUC: {formatMetricPct(model.candidateReport?.metrics.roc_auc)}</p>
                  <p className="mt-1 text-muted-foreground">
                    Real data: {model.candidateReport?.realRowPct ?? 0}% · Synthetic:{" "}
                    {model.candidateReport?.syntheticRowPct ?? 0}%
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function MlIntelligencePanel({
  ml,
  retrainReport,
  retrainLoading,
  onPromoteModel,
  onKeepModel,
  onRefreshRetrain,
}: {
  ml: AdminMlOverview;
  retrainReport: MlRetrainReport | null;
  retrainLoading: boolean;
  onPromoteModel: (modelId: string) => Promise<void>;
  onKeepModel: (modelId: string) => Promise<void>;
  onRefreshRetrain: () => Promise<void>;
}) {
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
        cardClassName: "bg-card border-border",
      },
      {
        id: "ai",
        icon: (
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-violet-50 dark:bg-violet-950/40">
            <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-300" />
          </div>
        ),
        value: ml.adoption.aiReportRateLabel,
        label: "Claims with AI intelligence reports",
        footer: (
          <span className="text-muted-foreground">
            {ml.platformActivity.claimsWithAiReports} of {ml.platformActivity.claimsTotal} claims
          </span>
        ),
        sparkColor: "#8B5CF6",
        sparkline: ml.trends.aiReportsGenerated,
        cardClassName: "bg-card border-border",
      },
      {
        id: "kyc",
        icon: (
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/40">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />
          </div>
        ),
        value: String(ml.summary.verifiedIdentities),
        label: "Verified policyholder identities",
        footer: <span className="text-muted-foreground">{ml.adoption.kycVerifiedRateLabel} of purchasers</span>,
        sparkColor: "#10B981",
        sparkline: ml.trends.questionnaireCompletions,
        cardClassName: "bg-card border-border",
      },
      {
        id: "engagement",
        icon: (
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-50 dark:bg-amber-950/40">
            <Users className="w-4 h-4 text-amber-600 dark:text-amber-300" />
          </div>
        ),
        value: String(ml.summary.questionnaireSeekers),
        label: "Seekers feeding ML questionnaires",
        footer: (
          <span className="text-muted-foreground">
            {ml.platformActivity.questionnaireResponses} total responses
          </span>
        ),
        sparkColor: "#F59E0B",
        sparkline: ml.trends.questionnaireCompletions,
        cardClassName: "bg-card border-border",
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
        <section className="rounded-2xl border border-border bg-card p-5">
          <h4 className="font-bold text-foreground mb-1">Platform activity (7 days)</h4>
          <p className="text-xs text-muted-foreground mb-4">Claims submitted vs AI reports generated</p>
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

        <section className="rounded-2xl border border-border bg-card p-5">
          <h4 className="font-bold text-foreground mb-1">Questionnaire completions</h4>
          <p className="text-xs text-muted-foreground mb-4">Signals that train recommendation & fraud models</p>
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

      {ml.calibration ? (
        <section className="rounded-2xl border border-border bg-card p-5">
          <h4 className="font-bold text-foreground mb-1">Claim risk calibration (30 days)</h4>
          <p className="text-xs text-muted-foreground mb-4">
            Compares predicted high-risk rate with actual insurer rejections from production outcomes.
          </p>
          <div className="grid sm:grid-cols-3 gap-3 text-sm">
            <div className="rounded-xl bg-muted/30 border border-border p-4">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Sample size</p>
              <p className="text-2xl font-bold mt-1">{ml.calibration.sampleSize}</p>
            </div>
            <div className="rounded-xl bg-muted/30 border border-border p-4">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Predicted high risk</p>
              <p className="text-2xl font-bold mt-1">{ml.calibration.predictedHighRiskRatePct}%</p>
            </div>
            <div className="rounded-xl bg-muted/30 border border-border p-4">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Actual rejections</p>
              <p className="text-2xl font-bold mt-1">{ml.calibration.actualRejectionRatePct}%</p>
            </div>
          </div>
          {ml.retrain ? (
            <p className="text-xs text-muted-foreground mt-3">
              Last retrain:{" "}
              {ml.retrain.lastRetrainAt
                ? new Date(ml.retrain.lastRetrainAt).toLocaleString()
                : "Not yet recorded"}{" "}
              · Pending candidates: {ml.retrain.pendingCandidates}
            </p>
          ) : null}
        </section>
      ) : null}

      <MlRetrainReviewPanel
        report={retrainReport}
        loading={retrainLoading}
        onPromote={onPromoteModel}
        onKeep={onKeepModel}
        onRefresh={onRefreshRetrain}
      />

      <div className="grid sm:grid-cols-2 gap-3">
        {ml.insights.map((insight) => (
          <InsightBanner key={insight.title} {...insight} />
        ))}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5" style={{ color: FB_BLUE }} />
          <h4 className="font-bold text-foreground">Models & use cases</h4>
        </div>
        <div className="grid xl:grid-cols-2 gap-4">
          {ml.models.map((model) => (
            <ModelCard key={model.id} model={model} />
          ))}
        </div>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h4 className="font-bold text-foreground mb-3">Last 24 hours snapshot</h4>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "New claims", value: ml.platformActivity.claimsLast24h },
            { label: "With AI reports", value: ml.platformActivity.claimsWithAiLast24h },
            { label: "Completed purchases", value: ml.platformActivity.purchasesCompleted },
            { label: "Unique questionnaire users", value: ml.platformActivity.questionnaireUniqueUsers },
          ].map((row) => (
            <div key={row.label} className="rounded-xl bg-muted/40 border border-border p-4">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{row.label}</p>
              <p className="text-2xl font-bold text-foreground mt-1">{row.value.toLocaleString()}</p>
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
  const [retrainReport, setRetrainReport] = useState<MlRetrainReport | null>(null);
  const [retrainLoading, setRetrainLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<HealthTab>("infrastructure");

  const loadRetrainReport = useCallback(async () => {
    setRetrainLoading(true);
    try {
      const report = await fetchMlRetrainReport();
      setRetrainReport(report);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not load ML retrain report");
    } finally {
      setRetrainLoading(false);
    }
  }, []);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [data, ml] = await Promise.all([fetchHealth(), fetchMlOverview()]);
      setHealth(data);
      setMlOverview(ml);
      if (tab === "ml") {
        await loadRetrainReport();
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not load system health");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loadRetrainReport, tab]);

  const handlePromoteModel = useCallback(
    async (modelId: string) => {
      try {
        const result = await promoteMlRetrainModel(modelId);
        setRetrainReport(result.report);
        toast.success("Candidate model promoted");
        await load(true);
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Could not promote model");
      }
    },
    [load]
  );

  const handleKeepModel = useCallback(
    async (modelId: string) => {
      try {
        const result = await keepMlRetrainModel(modelId);
        setRetrainReport(result.report);
        toast.success("Kept current production model");
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Could not dismiss candidate");
      }
    },
    []
  );

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => void load(true), REFRESH_MS);
    return () => window.clearInterval(interval);
  }, [load]);

  useEffect(() => {
    if (tab === "ml") {
      void loadRetrainReport();
    }
  }, [tab, loadRetrainReport]);

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
          <h1 className="text-3xl font-bold text-foreground mb-1">System health</h1>
          <p className="text-muted-foreground max-w-2xl">
            Monitor infrastructure, AI services, and machine learning models that power ClearClever
            for seekers and insurers.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl text-sm font-medium bg-card hover:bg-accent disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div
        className={`rounded-2xl border p-5 ${
          allOk
            ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800"
            : "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800"
        }`}
      >
        <div className="flex items-center gap-3">
          <CheckCircle2 className={`w-6 h-6 ${allOk ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`} />
          <div>
            <p className="font-semibold text-foreground">
              {allOk ? "Platform services are healthy" : "Some services need your attention"}
            </p>
            <p className="text-sm text-muted-foreground">
              Environment: {health?.environment ?? "unknown"} · Last check:{" "}
              {infra?.checkedAt
                ? new Date(infra.checkedAt).toLocaleString()
                : health?.timestamp
                  ? new Date(health.timestamp).toLocaleString()
                  : "—"}
              <span className="ml-2 text-xs text-muted-foreground/80">Auto-refresh every 30s</span>
            </p>
          </div>
        </div>
      </div>

      <HealthTabs active={tab} onChange={setTab} />

      {tab === "infrastructure" ? (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
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
                {infra.speechToText ? <ServiceRow service={infra.speechToText} /> : null}
                {assistant && !assistant.ok && assistant.configured ? (
                  <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                    Gemini probe failed{assistant.detail ? `: ${assistant.detail}` : ""}. On localhost,
                    ensure <code className="font-mono">GEMINI_API_KEY</code> is set in{" "}
                    <code className="font-mono">clear-clever-backend/.env</code> and restart the API.
                    Free-tier quotas also reset daily on Google AI Studio.
                  </p>
                ) : null}
                {!assistant?.configured ? (
                  <p className="text-xs text-muted-foreground bg-muted/40 border border-border rounded-xl p-3">
                    Gemini is not configured. Add <code className="font-mono">GEMINI_API_KEY</code> to
                    your backend environment (Render for production, `.env` for local dev).
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Infrastructure probe data unavailable.</p>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="text-lg font-bold text-foreground mb-4">Diagnostics</h3>
            <div className="space-y-3 text-sm">
              {diagnosticItems.length === 0 ? (
                <p className="text-muted-foreground">No additional diagnostics reported.</p>
              ) : (
                diagnosticItems.map((item, index) => (
                  <p
                    key={`${item.tone}-${index}`}
                    className={`p-3 rounded-xl ${
                      item.tone === "error"
                        ? "bg-red-50 border border-red-100 text-red-700 dark:bg-red-950/30 dark:border-red-900 dark:text-red-300"
                        : item.tone === "warning"
                          ? "bg-amber-50 border border-amber-100 text-amber-800 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-200"
                          : "bg-muted/40 border border-border text-muted-foreground"
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

      {tab === "ml" && mlOverview ? (
        <MlIntelligencePanel
          ml={mlOverview}
          retrainReport={retrainReport}
          retrainLoading={retrainLoading}
          onPromoteModel={handlePromoteModel}
          onKeepModel={handleKeepModel}
          onRefreshRetrain={loadRetrainReport}
        />
      ) : null}
    </div>
  );
}
