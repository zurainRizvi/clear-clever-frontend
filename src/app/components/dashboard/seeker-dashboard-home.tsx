import { Link } from "react-router";
import {
  Shield,
  TrendingUp,
  CheckCircle2,
  Clock,
  MessageSquare,
  FileText,
} from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../auth-context";

const stats = [
  {
    label: "Active Policies",
    value: "3",
    icon: Shield,
    trend: "+1 this month",
    colorClass: "text-primary bg-primary/10",
  },
  {
    label: "Total Savings",
    value: "₨45,000",
    icon: TrendingUp,
    trend: "+15% vs market",
    colorClass: "text-success bg-success/10",
  },
  {
    label: "Pending Claims",
    value: "1",
    icon: Clock,
    trend: "In review",
    colorClass: "text-warning bg-warning/10",
  },
  {
    label: "Insurance Score",
    value: "85/100",
    icon: CheckCircle2,
    trend: "Excellent",
    colorClass: "text-primary bg-primary/10",
  },
];

export function SeekerDashboardHome() {
  const { userName } = useAuth();
  const firstName = userName?.split(" ")[0] ?? "there";

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Welcome back, {firstName}</h1>
        <p className="text-muted-foreground">Here&apos;s an overview of your insurance portfolio</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${stat.colorClass}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-3xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground mb-2">{stat.label}</div>
              <div className="text-xs text-success">{stat.trend}</div>
            </motion.div>
          );
        })}
      </div>

      <div className="bg-primary/5 border border-border rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold mb-2">Recommended for your profile</h3>
            <p className="text-muted-foreground mb-4">
              Based on your current coverage, we suggest reviewing life insurance to protect your
              family&apos;s future. Compare transparent premiums from trusted Pakistani insurers.
            </p>
            <Link
              to="/dashboard/compare"
              className="inline-flex px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all text-sm font-medium"
            >
              Explore recommendations
            </Link>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-4">Active policies</h3>
          <div className="space-y-4">
            {[
              { name: "Auto Insurance — Comprehensive", provider: "TPL Insurance", amount: "₨18,000/year" },
              { name: "Home Insurance — Shield", provider: "Jubilee", amount: "₨35,000/year" },
              { name: "Life Insurance — Family", provider: "Adamjee", amount: "₨22,000/year" },
            ].map((policy) => (
              <div
                key={policy.name}
                className="flex items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg"
              >
                <div>
                  <div className="font-medium text-sm">{policy.name}</div>
                  <div className="text-xs text-muted-foreground">{policy.provider}</div>
                </div>
                <div className="text-right text-sm font-medium">{policy.amount}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-4">Recent activity</h3>
          <div className="space-y-3">
            {[
              {
                action: "Comparison ready",
                detail: "Auto policies matched your profile",
                time: "2h ago",
                icon: FileText,
              },
              {
                action: "Policy saved",
                detail: "TPL Auto Comprehensive",
                time: "1d ago",
                icon: Shield,
              },
              {
                action: "Message received",
                detail: "Response from your insurer",
                time: "3d ago",
                icon: MessageSquare,
              },
            ].map((activity) => {
              const Icon = activity.icon;
              return (
                <div key={activity.action} className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50">
                  <Icon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{activity.action}</div>
                    <div className="text-xs text-muted-foreground">{activity.detail}</div>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
