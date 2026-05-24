import { AlertTriangle } from "lucide-react";

const DEMO_ALERTS = [
  {
    id: 1,
    type: "Multiple account creation",
    user: "suspicious@email.com",
    severity: "High",
    time: "Demo alert",
    status: "Blocked",
  },
  {
    id: 2,
    type: "Unusual claim pattern",
    user: "Review queue",
    severity: "Medium",
    time: "Demo alert",
    status: "Review",
  },
  {
    id: 3,
    type: "Document verification flag",
    user: "Automated scan",
    severity: "Critical",
    time: "Demo alert",
    status: "Blocked",
  },
];

export function AdminFraudPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Fraud detection</h1>
        <p className="text-muted-foreground">
          Demo monitor for advisor presentations — not connected to live fraud APIs yet
        </p>
      </div>

      <div className="bg-warning/5 border border-warning/20 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-warning/15 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-warning" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-1">Demo fraud monitor</h3>
            <p className="text-sm text-muted-foreground">
              These sample alerts illustrate how suspicious activity would appear once a fraud
              scoring service is integrated. Approve/reject flows use real admin APIs elsewhere.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        {DEMO_ALERTS.map((alert) => (
          <div
            key={alert.id}
            className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-accent/30 rounded-xl border-l-4 border-warning"
          >
            <div className="flex-1">
              <div className="font-semibold mb-1 flex flex-wrap items-center gap-2">
                {alert.type}
                <span
                  className={`px-2 py-0.5 rounded text-xs ${
                    alert.severity === "Critical"
                      ? "bg-destructive text-destructive-foreground"
                      : alert.severity === "High"
                        ? "bg-warning text-warning-foreground"
                        : "bg-secondary/20 text-secondary"
                  }`}
                >
                  {alert.severity}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                {alert.user} · {alert.time}
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm w-fit ${
                alert.status === "Blocked"
                  ? "bg-destructive/10 text-destructive"
                  : "bg-warning/10 text-warning"
              }`}
            >
              {alert.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
