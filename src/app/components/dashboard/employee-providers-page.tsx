import { Link } from "react-router";
import { Loader2, Shield } from "lucide-react";
import { useAdmin } from "./admin-context";

export function EmployeeProvidersPage() {
  const { insurerRows, providerSummaries, loading } = useAdmin();

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
        <h1 className="text-3xl font-bold mb-1">Insurance providers</h1>
        <p className="text-muted-foreground">Insurer accounts and pending policy submissions</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {insurerRows.length === 0 ? (
          <p className="md:col-span-2 py-10 text-center text-muted-foreground">
            No insurer accounts found yet.
          </p>
        ) : (
          insurerRows.map((provider) => (
            <div
              key={provider.id}
              className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold mb-1">{provider.name}</h3>
                  <p className="text-sm text-muted-foreground">{provider.email}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    provider.verification === "Verified"
                      ? "bg-success/10 text-success"
                      : "bg-warning/10 text-warning"
                  }`}
                >
                  {provider.verification}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground mb-1">Account status</div>
                  <div className="font-semibold">{provider.status}</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Pending policies</div>
                  <div className="font-semibold">{provider.pendingPolicies}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {providerSummaries.length > 0 ? (
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Pending submissions by insurer
          </h3>
          <div className="space-y-3">
            {providerSummaries.map((summary) => (
              <div
                key={summary.slug}
                className="flex items-center justify-between p-3 bg-accent/30 rounded-xl"
              >
                <span className="font-medium">{summary.name}</span>
                <span className="text-sm text-muted-foreground">
                  {summary.pendingPolicies} pending · {summary.status}
                </span>
              </div>
            ))}
          </div>
          <Link
            to="/employee-dashboard/approvals"
            className="inline-block mt-4 text-sm text-primary hover:underline"
          >
            Review pending approvals →
          </Link>
        </div>
      ) : null}
    </div>
  );
}
