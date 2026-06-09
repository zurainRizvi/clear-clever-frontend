import { useCallback, useEffect, useState } from "react";
import { Activity, Bot, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import {
  fetchHealth,
  fetchMlOverview,
  type AdminMlOverview,
  type AssistantHealthReport,
  type HealthStatus,
  type InfrastructureServiceStatus,
} from "@/lib/admin-api";

const REFRESH_MS = 30_000;

function statusTone(ok: boolean) {
  return ok ? "text-success" : "text-destructive";
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

function ServiceRow({ service }: { service: InfrastructureServiceStatus }) {
  return (
    <div className="flex items-center justify-between p-3 bg-accent/30 rounded-xl">
      <div>
        <p className="font-medium text-sm">{service.label}</p>
        <p className="text-xs text-muted-foreground">
          {service.detail ?? (service.url ? service.url : "—")}
        </p>
      </div>
      <div className="text-right">
        <span className={`text-sm font-medium ${statusTone(service.ok)}`}>
          {service.ok ? "Operational" : "Down"}
        </span>
        {service.latencyMs > 0 ? (
          <p className="text-[10px] text-muted-foreground">{service.latencyMs}ms</p>
        ) : null}
      </div>
    </div>
  );
}

function MetricTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-accent/20 p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold mt-1">{value}</p>
      {sub ? <p className="text-xs text-muted-foreground mt-0.5">{sub}</p> : null}
    </div>
  );
}

function AssistantPanel({ assistant }: { assistant: AssistantHealthReport }) {
  const usage = assistant.usage;

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            Gemini AI assistant
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Model: <span className="font-medium text-foreground">{assistant.displayName ?? assistant.model}</span>
            {assistant.modelResourceName ? ` · ${assistant.modelResourceName}` : ""}
          </p>
        </div>
        <span className={`text-sm font-medium ${statusTone(assistant.ok)}`}>
          {assistant.configured ? (assistant.ok ? "Operational" : "Needs attention") : "Not configured"}
        </span>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
        <MetricTile
          label="API calls (since deploy)"
          value={String(usage.totalApiCalls)}
          sub={`${usage.successfulApiCalls} ok · ${usage.failedApiCalls} failed`}
        />
        <MetricTile
          label="Tokens used"
          value={usage.totalTokens.toLocaleString()}
          sub={`${usage.totalPromptTokens.toLocaleString()} prompt · ${usage.totalCompletionTokens.toLocaleString()} completion`}
        />
        <MetricTile
          label="429 / busy errors"
          value={String(usage.rateLimitErrors)}
          sub={`${usage.requestsLastMinute} call(s) in last minute`}
        />
        <MetricTile
          label="Chat / explain / probe"
          value={`${usage.chatApiCalls} / ${usage.explainApiCalls} / ${usage.probeApiCalls}`}
        />
        <MetricTile
          label="Claim intelligence"
          value={String(usage.claimIntelligenceApiCalls ?? 0)}
          sub="Gemini structured claim analysis"
        />
        <MetricTile
          label="KYC verification"
          value={String(usage.kycApiCalls ?? 0)}
          sub="CNIC document AI checks"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4 text-sm">
        <div className="rounded-xl border border-border p-4 space-y-2">
          <p className="font-medium">Configured limits</p>
          <ul className="space-y-1 text-muted-foreground">
            <li>Max output tokens: {assistant.limits.configuredMaxOutputTokens.toLocaleString()}</li>
            <li>
              Model context:{" "}
              {assistant.limits.modelInputTokenLimit
                ? `${assistant.limits.modelInputTokenLimit.toLocaleString()} input`
                : "—"}
              {assistant.limits.modelOutputTokenLimit
                ? ` · ${assistant.limits.modelOutputTokenLimit.toLocaleString()} output`
                : ""}
            </li>
            <li>
              App rate limit: {assistant.limits.assistantRateLimitPerMin}/min signed-in ·{" "}
              {assistant.limits.anonymousRateLimitPerMin}/min guest
            </li>
            <li>
              Upstream Gemini cap: {assistant.limits.geminiUpstreamRpm}/min (all users, process-wide)
            </li>
            <li>
              Attachments: {assistant.limits.maxAttachmentsPerMessage} files · max{" "}
              {formatBytes(assistant.limits.maxBytesPerAttachment)} each
            </li>
            <li>Internal buckets active: {assistant.internalRateLimits.activeBuckets}</li>
          </ul>
        </div>
        <div className="rounded-xl border border-border p-4 space-y-2">
          <p className="font-medium">Runtime</p>
          <ul className="space-y-1 text-muted-foreground">
            <li>Server started: {new Date(usage.serverStartedAt).toLocaleString()}</li>
            <li>
              Last Gemini call:{" "}
              {usage.lastRequestAt ? new Date(usage.lastRequestAt).toLocaleString() : "None yet"}
            </li>
            <li>Probe latency: {assistant.latencyMs > 0 ? `${assistant.latencyMs}ms` : "—"}</li>
            <li>
              Methods:{" "}
              {assistant.supportedGenerationMethods.length > 0
                ? assistant.supportedGenerationMethods.join(", ")
                : "Unknown"}
            </li>
          </ul>
        </div>
      </div>

      {usage.recentErrors.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">Recent Gemini errors</p>
          {usage.recentErrors.map((item) => (
            <p
              key={`${item.at}-${item.route}`}
              className="text-xs p-3 rounded-xl bg-destructive/5 border border-destructive/20 text-destructive"
            >
              [{item.route}] {new Date(item.at).toLocaleString()} — {item.message}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function AdminHealthPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [mlOverview, setMlOverview] = useState<AdminMlOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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

  if (health?.email?.error) {
    diagnosticItems.push({ tone: "error", text: `Email error: ${health.email.error}` });
  }
  if (health?.email?.hint) {
    diagnosticItems.push({ tone: "hint", text: health.email.hint });
  }
  if (health?.email?.renderFreeTierNote) {
    diagnosticItems.push({ tone: "warning", text: health.email.renderFreeTierNote });
  }

  for (const line of assistant?.diagnostics ?? []) {
    diagnosticItems.push({ tone: "info", text: line });
  }
  for (const line of assistant?.notes ?? []) {
    diagnosticItems.push({ tone: "hint", text: line });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">System health</h1>
          <p className="text-muted-foreground">
            Live probes for Render, Vercel, MongoDB, email, and Gemini AI assistant usage
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-xl text-sm hover:bg-accent disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div
        className={`rounded-xl border p-6 ${
          allOk ? "bg-success/5 border-success/20" : "bg-warning/5 border-warning/20"
        }`}
      >
        <div className="flex items-center gap-3">
          <CheckCircle2 className={`w-6 h-6 ${allOk ? "text-success" : "text-warning"}`} />
          <div>
            <div className="font-semibold">
              {allOk ? "All infrastructure services operational" : "Some services need attention"}
            </div>
            <div className="text-sm text-muted-foreground">
              Environment: {health?.environment ?? "unknown"} · Last check:{" "}
              {infra?.checkedAt
                ? new Date(infra.checkedAt).toLocaleString()
                : health?.timestamp
                  ? new Date(health.timestamp).toLocaleString()
                  : "—"}
              <span className="ml-2 text-xs">(auto-refresh every 30s)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Infrastructure
          </h3>
          {infra ? (
            <div className="space-y-4">
              <ServiceRow service={infra.render} />
              <ServiceRow service={infra.vercel} />
              <ServiceRow service={infra.mongodb} />
              <ServiceRow service={infra.brevo} />
              <ServiceRow service={infra.gemini} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Infrastructure probe data unavailable.</p>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-4">Diagnostics</h3>
          <div className="space-y-3 text-sm">
            {diagnosticItems.length === 0 ? (
              <p className="text-muted-foreground">No additional diagnostics reported.</p>
            ) : (
              diagnosticItems.map((item, index) => (
                <p
                  key={`${item.tone}-${index}`}
                  className={`p-3 rounded-xl ${
                    item.tone === "error"
                      ? "bg-destructive/5 border border-destructive/20 text-destructive"
                      : item.tone === "warning"
                        ? "bg-warning/5 border border-warning/20 text-muted-foreground"
                        : "bg-accent/30 text-muted-foreground"
                  }`}
                >
                  {item.text}
                </p>
              ))
            )}
          </div>
        </div>
      </div>

      {assistant ? <AssistantPanel assistant={assistant} /> : null}

      {mlOverview ? (
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h3 className="text-xl font-semibold">ML platform overview</h3>
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <MetricTile
              label="Claim risk model"
              value={mlOverview.models.claimRiskLoaded ? "Loaded" : "Missing"}
              sub={mlOverview.models.claimRiskVersion ?? "No artifact"}
            />
            <MetricTile
              label="Policy ranker"
              value={mlOverview.models.policyRankerCategories.join(", ") || "None"}
              sub="Hybrid recommendation categories"
            />
            <MetricTile
              label="Claims (total / AI reports)"
              value={`${mlOverview.claims.total} / ${mlOverview.claims.withIntelligenceReport}`}
              sub={`${mlOverview.claims.last24h} in last 24h`}
            />
            <MetricTile
              label="Questionnaires"
              value={String(mlOverview.questionnaires.totalResponses)}
              sub={`${mlOverview.questionnaires.uniqueUsers} unique users`}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
