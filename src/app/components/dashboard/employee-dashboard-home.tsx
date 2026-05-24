import { Link } from "react-router";
import { Clock, Loader2, Shield, Users } from "lucide-react";
import { motion } from "motion/react";
import { useAdmin } from "./admin-context";

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
      trend: `${analytics?.users.active ?? 0} active`,
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
        <h1 className="text-3xl font-bold mb-2">Employee dashboard</h1>
        <p className="text-muted-foreground">Manage platform operations and provider submissions</p>
      </div>

      <div className="bg-warning/5 border border-warning/20 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-warning/15 flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6 text-warning" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-1">Employee permissions</h3>
            <p className="text-sm text-muted-foreground">
              You can approve or reject insurer policies, review users, and deactivate accounts.
              Destructive actions on super admin accounts require super admin approval.
            </p>
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
            <div className="text-sm text-muted-foreground">{users.length} registered users</div>
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
