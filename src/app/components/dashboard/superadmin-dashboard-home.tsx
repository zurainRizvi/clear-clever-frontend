import { Link } from "react-router";
import {
  Activity,
  AlertTriangle,
  Building2,
  CheckCircle2,
  Crown,
  FileText,
  Loader2,
  Shield,
  TrendingUp,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { AnimatedPage } from "../ui/animated-page";
import { useAdmin } from "./admin-context";

export function SuperadminDashboardHome() {
  const { pendingPolicies, insurers, analytics, recentActivity, loading } = useAdmin();

  const pendingProviders = insurers.filter((row) => row.user.status === "pendingVerification");
  const activeProviders = insurers.filter((row) => row.user.status === "active");
  const platform = analytics?.platform;

  const controlStats = [
    {
      label: "Providers on platform",
      value: String(platform?.insurers.total ?? insurers.length),
      sub: `${pendingProviders.length} awaiting your approval`,
      icon: Building2,
      tone: "text-primary",
    },
    {
      label: "Platform users",
      value: String(analytics?.users.total ?? 0),
      sub: `${analytics?.users.active ?? 0} active · ${analytics?.users.inactive ?? 0} inactive`,
      icon: Users,
      tone: "text-primary",
    },
    {
      label: "Policies in catalog",
      value: String(analytics?.policies.total ?? 0),
      sub: `${analytics?.policies.pending ?? 0} need policy review`,
      icon: Shield,
      tone: "text-warning",
    },
    {
      label: "Commerce & claims",
      value: String((platform?.purchases ?? 0) + (platform?.claims ?? 0)),
      sub: `${platform?.purchases ?? 0} purchases · ${platform?.claims ?? 0} claims`,
      icon: TrendingUp,
      tone: "text-success",
    },
  ];

  const governanceLinks = [
    {
      title: "Provider approvals",
      description: `${pendingProviders.length} pending · ${activeProviders.length} active`,
      href: "/admin-dashboard/approvals",
      icon: Building2,
    },
    {
      title: "Policy review",
      description: `${pendingPolicies.length} submissions awaiting review`,
      href: "/admin-dashboard/policies",
      icon: CheckCircle2,
    },
    {
      title: "User & role control",
      description: "Assign roles, deactivate accounts",
      href: "/admin-dashboard/users",
      icon: Users,
    },
    {
      title: "Platform analytics",
      description: "Full-app metrics and provider pipeline",
      href: "/admin-dashboard/analytics",
      icon: Activity,
    },
    {
      title: "Fraud detection",
      description: "Review suspicious activity signals",
      href: "/admin-dashboard/fraud",
      icon: AlertTriangle,
    },
    {
      title: "System health",
      description: "API, database, email, and Gemini AI assistant",
      href: "/admin-dashboard/health",
      icon: Activity,
    },
    {
      title: "Audit logs",
      description: "Trace administrative actions",
      href: "/admin-dashboard/audit",
      icon: FileText,
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
    <AnimatedPage className="space-y-6">
      <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-primary/5 to-background p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 text-primary text-sm font-medium mb-3">
              <Crown className="w-4 h-4" />
              Super Admin
            </div>
            <h1 className="text-3xl font-bold mb-2 font-[Poppins]">Platform control center</h1>
            <p className="text-muted-foreground max-w-xl">
              Govern the entire ClearClever application — providers, staff roles, catalog policies,
              fraud signals, and infrastructure health. Employee admins handle day-to-day operations;
              you hold final authority.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/admin-dashboard/users?role=superadmin"
              className="px-3 py-1 bg-card border border-border rounded-full text-sm hover:border-primary/40 transition-colors"
            >
              {platform?.staff.superadmins ?? 1} super admin
            </Link>
            <Link
              to="/admin-dashboard/users?role=admin"
              className="px-3 py-1 bg-card border border-border rounded-full text-sm hover:border-primary/40 transition-colors"
            >
              {platform?.staff.admins ?? 0} platform admins
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {controlStats.map((stat, index) => {
          const Icon = stat.icon;
          const card = (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              className={`bg-card border border-border rounded-xl p-5 ${
                stat.label === "Platform users" ? "hover:border-primary/30 transition-colors" : ""
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <Icon className={`w-5 h-5 ${stat.tone}`} />
                <span className="text-2xl font-bold">{stat.value}</span>
              </div>
              <div className="text-sm font-medium">{stat.label}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.sub}</div>
            </motion.div>
          );
          if (stat.label === "Platform users") {
            return (
              <Link key={stat.label} to="/admin-dashboard/users">
                {card}
              </Link>
            );
          }
          return card;
        })}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Governance shortcuts</h2>
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {governanceLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                to={item.href}
                className="flex items-start gap-4 p-5 bg-card border border-border rounded-xl hover:border-primary/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold mb-0.5">{item.title}</div>
                  <div className="text-sm text-muted-foreground">{item.description}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-4">Recent platform activity</h3>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity yet.</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.slice(0, 6).map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-3 p-3 bg-accent/30 rounded-xl"
                >
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
            Open audit logs →
          </Link>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-4">Provider pipeline</h3>
          <div className="space-y-3 mb-4">
            <div className="flex justify-between items-center p-3 bg-warning/10 rounded-xl text-sm">
              <span>Pending approval</span>
              <span className="font-bold text-warning">{pendingProviders.length}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-success/10 rounded-xl text-sm">
              <span>Active providers</span>
              <span className="font-bold text-success">{activeProviders.length}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-xl text-sm">
              <span>Inactive / rejected</span>
              <span className="font-bold">
                {platform?.insurers.inactive ??
                  insurers.filter((row) => row.user.status === "inactive").length}
              </span>
            </div>
          </div>
          <Link
            to="/admin-dashboard/approvals"
            className="text-sm text-primary hover:underline"
          >
            Review provider applications →
          </Link>
        </div>
      </div>
    </AnimatedPage>
  );
}
