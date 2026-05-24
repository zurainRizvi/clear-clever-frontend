import { Link } from "react-router";
import { Clock, Loader2, Shield, Users } from "lucide-react";
import { motion } from "motion/react";
import { useAdmin } from "./admin-context";
import { policyStatusDistribution, roleDistribution } from "@/lib/admin-utils";

export function EmployeeDashboardHome() {
  const { pendingPolicies, users, analytics, loading } = useAdmin();

  const stats = [
    {
      label: "Pending approvals",
      value: String(pendingPolicies.length),
      trend: "Policies awaiting review",
    },
    {
      label: "Total users",
      value: String(analytics?.users.total ?? users.length),
      trend: `${analytics?.users.active ?? 0} active · ${analytics?.users.inactive ?? 0} inactive`,
    },
    {
      label: "Approved policies",
      value: String(analytics?.policies.approved ?? 0),
      trend: `${analytics?.policies.total ?? 0} total policies`,
    },
    {
      label: "New leads",
      value: String(analytics?.leads.new ?? 0),
      trend: `${analytics?.leads.total ?? 0} total leads`,
    },
  ];

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Admin dashboard</h1>
        <p className="text-muted-foreground">Platform operations, approvals, and live metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className="bg-card border border-border rounded-xl p-6"
          >
            <div className="text-3xl font-bold mb-1">{stat.value}</div>
            <div className="text-sm text-muted-foreground mb-2">{stat.label}</div>
            <div className="text-xs text-success">{stat.trend}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Users by role</h3>
          {roles.length === 0 ? (
            <p className="text-sm text-muted-foreground">No user data yet.</p>
          ) : (
            <div className="space-y-3">
              {roles.map((item) => (
                <div key={item.role}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{item.role}</span>
                    <span className="text-muted-foreground">
                      {item.count} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${(item.count / maxRole) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link
            to="/employee-dashboard/reports"
            className="inline-block mt-4 text-sm text-primary hover:underline"
          >
            Full reports →
          </Link>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Policies by status</h3>
          {policies.length === 0 ? (
            <p className="text-sm text-muted-foreground">No policy data yet.</p>
          ) : (
            <div className="space-y-3">
              {policies.map((item) => (
                <div key={item.label} className="flex justify-between text-sm p-3 bg-accent/30 rounded-lg">
                  <span>{item.label}</span>
                  <span className="font-medium">
                    {item.count} ({item.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Link
          to="/employee-dashboard/approvals"
          className="flex items-center gap-3 p-6 bg-card border border-border rounded-xl hover:bg-accent/50 transition-all"
        >
          <div className="w-12 h-12 rounded-xl bg-warning/15 flex items-center justify-center">
            <Clock className="w-6 h-6 text-warning" />
          </div>
          <div>
            <div className="font-semibold mb-1">Review approvals</div>
            <div className="text-sm text-muted-foreground">{pendingPolicies.length} pending policies</div>
          </div>
        </Link>
        <Link
          to="/employee-dashboard/users"
          className="flex items-center gap-3 p-6 bg-card border border-border rounded-xl hover:bg-accent/50 transition-all"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <div className="font-semibold mb-1">Manage users</div>
            <div className="text-sm text-muted-foreground">{users.filter((u) => u.role !== "superadmin").length} accounts</div>
          </div>
        </Link>
        <Link
          to="/employee-dashboard/providers"
          className="flex items-center gap-3 p-6 bg-card border border-border rounded-xl hover:bg-accent/50 transition-all"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <div className="font-semibold mb-1">View providers</div>
            <div className="text-sm text-muted-foreground">Insurer accounts on the platform</div>
          </div>
        </Link>
      </div>
    </div>
  );
}
