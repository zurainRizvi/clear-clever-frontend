import { Link } from "react-router";
import {
  Activity,
  Building2,
  Crown,
  Loader2,
  MessageSquare,
  Shield,
  ShoppingBag,
  Users,
} from "lucide-react";
import { policyStatusDistribution, roleDistribution } from "@/lib/admin-utils";
import { useAdmin } from "./admin-context";

export function SuperadminReportsPage() {
  const { analytics, loading } = useAdmin();
  const platform = analytics?.platform;
  const roles = roleDistribution(analytics);
  const policies = policyStatusDistribution(analytics);
  const maxRole = Math.max(...roles.map((item) => item.count), 1);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const governanceCards = [
    {
      label: "Insurance providers",
      value: platform?.insurers.total ?? 0,
      detail: `${platform?.insurers.pendingVerification ?? 0} pending · ${platform?.insurers.active ?? 0} active`,
      icon: Building2,
      href: "/admin-dashboard/approvals",
    },
    {
      label: "Platform staff",
      value: platform?.staff.admins ?? 0,
      detail: `${platform?.staff.superadmins ?? 0} super admin`,
      icon: Crown,
      href: "/admin-dashboard/users",
    },
    {
      label: "Purchases",
      value: platform?.purchases ?? 0,
      detail: "Completed and in-progress flows",
      icon: ShoppingBag,
      href: "/admin-dashboard/analytics",
    },
    {
      label: "Claims",
      value: platform?.claims ?? 0,
      detail: "Across all insurers",
      icon: Shield,
      href: "/admin-dashboard/fraud",
    },
    {
      label: "Audit events",
      value: platform?.conversations ?? 0,
      detail: "Platform activity and engagement",
      icon: MessageSquare,
      href: "/admin-dashboard/audit",
    },
    {
      label: "Total users",
      value: analytics?.users.total ?? 0,
      detail: `${analytics?.users.active ?? 0} active accounts`,
      icon: Users,
      href: "/admin-dashboard/users",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-primary/25 bg-gradient-to-br from-primary/10 via-background to-background p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-1">Platform analytics</h1>
            <p className="text-muted-foreground max-w-2xl">
              Full-app visibility for Super Admin: provider pipeline, staff accounts, commerce volume,
              and engagement signals. Employee admins see a smaller operational subset on Reports.
            </p>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {governanceCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              to={card.href}
              className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <Icon className="w-5 h-5 text-primary" />
                <span className="text-2xl font-bold">{card.value}</span>
              </div>
              <div className="font-medium text-sm">{card.label}</div>
              <div className="text-xs text-muted-foreground mt-1">{card.detail}</div>
            </Link>
          );
        })}
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-sm text-muted-foreground">Pending policies</div>
          <div className="text-3xl font-bold mt-1">{analytics?.policies.pending ?? 0}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-sm text-muted-foreground">Approved policies</div>
          <div className="text-3xl font-bold mt-1">{analytics?.policies.approved ?? 0}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-sm text-muted-foreground">Total leads</div>
          <div className="text-3xl font-bold mt-1">{analytics?.leads.total ?? 0}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-sm text-muted-foreground">Inactive users</div>
          <div className="text-3xl font-bold mt-1">{analytics?.users.inactive ?? 0}</div>
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

      {platform ? (
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Provider pipeline</h3>
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <div className="p-4 bg-warning/10 rounded-xl">
              <div className="text-muted-foreground">Awaiting approval</div>
              <div className="text-2xl font-bold text-warning mt-1">
                {platform.insurers.pendingVerification}
              </div>
            </div>
            <div className="p-4 bg-success/10 rounded-xl">
              <div className="text-muted-foreground">Active on platform</div>
              <div className="text-2xl font-bold text-success mt-1">{platform.insurers.active}</div>
            </div>
            <div className="p-4 bg-destructive/10 rounded-xl">
              <div className="text-muted-foreground">Rejected / removed</div>
              <div className="text-2xl font-bold text-destructive mt-1">
                {platform.insurers.inactive}
              </div>
            </div>
          </div>
          <Link
            to="/admin-dashboard/approvals"
            className="inline-block mt-4 text-sm text-primary hover:underline"
          >
            Manage provider approvals →
          </Link>
        </div>
      ) : null}
    </div>
  );
}
