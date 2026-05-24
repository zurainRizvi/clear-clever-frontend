import { Link } from "react-router";
import { CheckCircle2, Clock, Loader2, Shield, Users } from "lucide-react";
import { motion } from "motion/react";
import { useAdmin } from "./admin-context";

export function SuperadminDashboardHome() {
  const { pendingPolicies, users, analytics, insurerRows, recentActivity, loading } = useAdmin();

  const stats = [
    {
      label: "Total users",
      value: String(analytics?.users.total ?? users.length),
      trend: `${analytics?.users.active ?? 0} active`,
    },
    {
      label: "Approved policies",
      value: String(analytics?.policies.approved ?? 0),
      trend: `${analytics?.policies.pending ?? 0} pending`,
    },
    {
      label: "Total leads",
      value: String(analytics?.leads.total ?? 0),
      trend: `${analytics?.leads.new ?? 0} new`,
    },
    {
      label: "Insurer accounts",
      value: String(insurerRows.length),
      trend: `${pendingPolicies.length} policies awaiting review`,
    },
  ];

  if (loading) {
    return (
      <motion.div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Super admin dashboard</h1>
        <p className="text-muted-foreground">Monitor and manage the entire ClearClever platform</p>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-1">Super admin access</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Full administrative privileges including role changes, account deactivation, and
              platform configuration.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-success/10 text-success rounded-full text-sm">
                Full data access
              </span>
              <span className="px-3 py-1 bg-success/10 text-success rounded-full text-sm">
                Role management
              </span>
              <span className="px-3 py-1 bg-success/10 text-success rounded-full text-sm">
                System health
              </span>
            </div>
          </div>
        </div>
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
          <h3 className="text-xl font-semibold mb-4">Recent activity</h3>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity yet.</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.slice(0, 6).map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-3 p-3 bg-accent/30 rounded-xl">
                  <div>
                    <div className="font-medium text-sm">{item.action}</div>
                    <div className="text-xs text-muted-foreground">{item.subject}</div>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">{item.time}</div>
                </div>
              ))}
            </div>
          )}
          <Link
            to="/admin-dashboard/audit"
            className="inline-block mt-4 text-sm text-primary hover:underline"
          >
            View audit logs →
          </Link>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-4">Quick actions</h3>
          <div className="grid gap-3">
            <Link
              to="/admin-dashboard/approvals"
              className="flex items-center gap-3 p-4 bg-accent/30 rounded-xl hover:bg-accent/50"
            >
              <Clock className="w-5 h-5 text-warning" />
              <span>{pendingPolicies.length} pending provider approvals</span>
            </Link>
            <Link
              to="/admin-dashboard/users"
              className="flex items-center gap-3 p-4 bg-accent/30 rounded-xl hover:bg-accent/50"
            >
              <Users className="w-5 h-5 text-primary" />
              <span>Manage {users.length} platform users</span>
            </Link>
            <Link
              to="/admin-dashboard/health"
              className="flex items-center gap-3 p-4 bg-accent/30 rounded-xl hover:bg-accent/50"
            >
              <CheckCircle2 className="w-5 h-5 text-success" />
              <span>Check system health</span>
            </Link>
          </div>
        </div>
      </div>

      {insurerRows.length > 0 ? (
        <div className="bg-card border border-border rounded-xl p-6 overflow-x-auto">
          <h3 className="text-xl font-semibold mb-4">Insurance providers</h3>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-sm text-muted-foreground">
                <th className="text-left py-3 px-4">Provider</th>
                <th className="text-left py-3 px-4">Email</th>
                <th className="text-left py-3 px-4">Pending policies</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Verification</th>
              </tr>
            </thead>
            <tbody>
              {insurerRows.map((provider) => (
                <tr key={provider.id} className="border-b border-border hover:bg-accent/30">
                  <td className="py-4 px-4 font-medium">{provider.name}</td>
                  <td className="py-4 px-4 text-muted-foreground">{provider.email}</td>
                  <td className="py-4 px-4">{provider.pendingPolicies}</td>
                  <td className="py-4 px-4">{provider.status}</td>
                  <td className="py-4 px-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm inline-flex items-center gap-1 ${
                        provider.verification === "Verified"
                          ? "bg-success/10 text-success"
                          : "bg-warning/10 text-warning"
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      {provider.verification}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
