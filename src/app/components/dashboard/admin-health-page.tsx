import { useEffect, useState } from "react";
import { Activity, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { fetchHealth, type HealthStatus } from "@/lib/admin-api";

export function AdminHealthPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await fetchHealth();
        setHealth(data);
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Could not load system health");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const dbOk = health?.database?.connected === true;
  const emailOk = health?.email?.ready === true;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">System health</h1>
        <p className="text-muted-foreground">Live status from the ClearClever API health endpoint</p>
      </div>

      <div
        className={`rounded-xl border p-6 ${
          dbOk && emailOk ? "bg-success/5 border-success/20" : "bg-warning/5 border-warning/20"
        }`}
      >
        <div className="flex items-center gap-3">
          <CheckCircle2 className={`w-6 h-6 ${dbOk ? "text-success" : "text-warning"}`} />
          <div>
            <div className="font-semibold">
              {dbOk ? "Core services operational" : "Some services need attention"}
            </div>
            <div className="text-sm text-muted-foreground">
              Environment: {health?.environment ?? "unknown"} · Last check:{" "}
              {health?.timestamp ? new Date(health.timestamp).toLocaleString() : "—"}
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Services
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-accent/30 rounded-xl">
              <div>
                <p className="font-medium text-sm">API ({health?.service ?? "clearclever-api"})</p>
                <p className="text-xs text-muted-foreground">Render backend</p>
              </div>
              <span className="text-sm text-success font-medium">Operational</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-accent/30 rounded-xl">
              <div>
                <p className="font-medium text-sm">Database</p>
                <p className="text-xs text-muted-foreground">
                  {health?.database?.name ?? "MongoDB Atlas"}
                </p>
              </div>
              <span className={`text-sm font-medium ${dbOk ? "text-success" : "text-warning"}`}>
                {dbOk ? "Connected" : "Disconnected"}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-accent/30 rounded-xl">
              <div>
                <p className="font-medium text-sm">Email ({health?.email?.provider ?? "none"})</p>
                <p className="text-xs text-muted-foreground">
                  {health?.email?.configured ? "Configured" : "Not configured"}
                </p>
              </div>
              <span className={`text-sm font-medium ${emailOk ? "text-success" : "text-warning"}`}>
                {emailOk ? "Ready" : "Degraded"}
              </span>
            </div>
          </div>
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
