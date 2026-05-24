import { Loader2 } from "lucide-react";
import { policyStatusDistribution, roleDistribution } from "@/lib/admin-utils";
import { useAdmin } from "./admin-context";

interface AdminReportsPageProps {
  title?: string;
}

export function AdminReportsPage({ title = "Platform reports" }: AdminReportsPageProps) {
  const { analytics, loading } = useAdmin();

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const roles = roleDistribution(analytics);
  const policies = policyStatusDistribution(analytics);
  const maxRole = Math.max(...roles.map((item) => item.count), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">{title}</h1>
        <p className="text-muted-foreground">Live metrics from your ClearClever database</p>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="text-sm text-muted-foreground mb-1">Total users</div>
          <div className="text-3xl font-bold">{analytics?.users.total ?? 0}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="text-sm text-muted-foreground mb-1">Active users</div>
          <div className="text-3xl font-bold">{analytics?.users.active ?? 0}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="text-sm text-muted-foreground mb-1">Total leads</div>
          <div className="text-3xl font-bold">{analytics?.leads.total ?? 0}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="text-sm text-muted-foreground mb-1">New leads</div>
          <div className="text-3xl font-bold">{analytics?.leads.new ?? 0}</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-4">Users by role</h3>
          {roles.length === 0 ? (
            <p className="text-sm text-muted-foreground">No user data yet.</p>
          ) : (
            <div className="space-y-4">
              {roles.map((item) => (
                <div key={item.role}>
                  <div className="flex items-center justify-between mb-2 text-sm">
                    <span className="font-medium">{item.role}</span>
                    <span className="text-muted-foreground">
                      {item.count} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${(item.count / maxRole) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-4">Policies by status</h3>
          {policies.length === 0 ? (
            <p className="text-sm text-muted-foreground">No policy data yet.</p>
          ) : (
            <div className="space-y-4">
              {policies.map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-2 text-sm">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-muted-foreground">
                      {item.count} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-secondary transition-all"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
