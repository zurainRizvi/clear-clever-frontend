import { useCallback, useEffect, useState } from "react";
import { Activity, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { fetchHealth, type HealthStatus, type InfrastructureServiceStatus } from "@/lib/admin-api";

const REFRESH_MS = 30_000;

function statusTone(ok: boolean) {
  return ok ? "text-success" : "text-destructive";
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

export function AdminHealthPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const data = await fetchHealth();
      setHealth(data);
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
  const allOk =
    infra?.render.ok &&
    infra?.vercel.ok &&
    infra?.mongodb.ok &&
    infra?.brevo.ok;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">System health</h1>
          <p className="text-muted-foreground">
            Live probes for Render API, Vercel frontend, MongoDB Atlas, and Brevo email
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
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Infrastructure probe data unavailable.</p>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-4">Diagnostics</h3>
          <div className="space-y-3 text-sm">
            {health?.email?.error ? (
              <p className="p-3 bg-destructive/5 border border-destructive/20 rounded-xl text-destructive">
                Email error: {health.email.error}
              </p>
            ) : null}
            {health?.email?.hint ? (
              <p className="p-3 bg-accent/30 rounded-xl text-muted-foreground">{health.email.hint}</p>
            ) : null}
            {health?.email?.renderFreeTierNote ? (
              <p className="p-3 bg-warning/5 border border-warning/20 rounded-xl text-muted-foreground">
                {health.email.renderFreeTierNote}
              </p>
            ) : null}
            {!health?.email?.error && !health?.email?.hint && !health?.email?.renderFreeTierNote ? (
              <p className="text-muted-foreground">No additional diagnostics reported.</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
