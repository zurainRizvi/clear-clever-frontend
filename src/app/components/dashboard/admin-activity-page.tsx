import { Activity, Loader2 } from "lucide-react";
import { useAdmin } from "./admin-context";

export function AdminActivityPage() {
  const { recentActivity, loading } = useAdmin();

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Activity logs</h1>
        <p className="text-muted-foreground">
          Recent registrations and policy submissions from live platform data
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        {recentActivity.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No recent activity yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((item) => (
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
                    <div className="text-sm text-muted-foreground">{item.subject}</div>
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
