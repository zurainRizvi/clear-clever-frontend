import { Loader2, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import {
  clearAuditLogs,
  fetchAuditLogs,
  type AuditLogItem,
} from "@/lib/admin-api";

export function AdminAuditPage() {
  const [events, setEvents] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAuditLogs();
      setEvents(data.events);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not load audit logs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleClear = async () => {
    setClearing(true);
    try {
      const result = await clearAuditLogs();
      setEvents([]);
      setConfirmClear(false);
      toast.success(`Cleared ${result.deletedCount} audit log${result.deletedCount === 1 ? "" : "s"}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not clear audit logs");
    } finally {
      setClearing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">Audit logs</h1>
          <p className="text-muted-foreground">
            Platform events such as signups, policy submissions, and admin actions
          </p>
        </div>
        {events.length > 0 ? (
          confirmClear ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Clear all logs?</span>
              <button
                type="button"
                onClick={() => void handleClear()}
                disabled={clearing}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
              >
                {clearing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Confirm clear
              </button>
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                disabled={clearing}
                className="px-3 py-2 rounded-xl text-sm font-medium border border-border hover:bg-accent"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border border-border hover:bg-accent"
            >
              <Trash2 className="w-4 h-4" />
              Clear logs
            </button>
          )
        ) : null}
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        {events.length === 0 ? (
          <p className="py-10 text-center text-muted-foreground">No audit events yet.</p>
        ) : (
          <div className="space-y-3">
            {events.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-xl border-l-4 ${
                  item.severity === "high"
                    ? "bg-destructive/5 border-destructive"
                    : item.severity === "medium"
                      ? "bg-warning/5 border-warning"
                      : "bg-muted/50 border-muted"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold">{item.action}</div>
                    <div className="text-sm text-muted-foreground">Target: {item.subject}</div>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">{item.time}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
