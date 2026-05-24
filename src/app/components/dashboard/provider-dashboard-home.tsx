import { Link, useOutletContext } from "react-router";
import type { ProviderOutletContext } from "./provider-dashboard";
import { CheckCircle2, Loader2, Plus, ShieldCheck, TrendingUp, Users } from "lucide-react";
import { motion } from "motion/react";
import { formatPkr } from "@/lib/format";
import { useProvider } from "./provider-context";
import { statusClass } from "@/lib/provider-utils";

export function ProviderDashboardHome() {
  const { onAddPolicy, onEditPolicy } = useOutletContext<ProviderOutletContext>();
  const { policyRows, policies, leads, pendingClaimsCount, loading } = useProvider();

  const stats = [
    {
      label: "Approved policies",
      value: String(policies.filter((p) => p.status === "approved").length),
      trend: `${policies.length} total submitted`,
    },
    {
      label: "Projected revenue",
      value: formatPkr(policyRows.reduce((sum, p) => sum + p.revenuePkr, 0)),
      trend: "From completed purchase leads",
    },
    {
      label: "Customer leads",
      value: String(leads.length),
      trend: `${leads.filter((l) => l.status === "new").length} new`,
    },
    {
      label: "Policies pending approval",
      value: String(policies.filter((p) => p.status === "pending").length),
      trend: "Awaiting ClearClever admin",
    },
    {
      label: "Claims to review",
      value: String(pendingClaimsCount),
      trend: pendingClaimsCount ? "Seeker claims need your decision" : "No open claims",
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
        <h1 className="text-3xl font-bold mb-2">Provider dashboard</h1>
        <p className="text-muted-foreground">
          Manage your insurance policies and customer relationships
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
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

      <div className="bg-primary/5 border border-border rounded-xl p-6">
        <h3 className="text-xl font-semibold mb-4">Quick actions</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            type="button"
            onClick={onAddPolicy}
            className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:bg-accent/50 text-left"
          >
            <Plus className="w-5 h-5 text-primary" />
            <span className="font-medium">Add new policy</span>
          </button>
          <Link
            to="/provider-dashboard/claims"
            className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:bg-accent/50"
          >
            <ShieldCheck className="w-5 h-5 text-primary" />
            <span className="font-medium">Review claims</span>
          </Link>
          <Link
            to="/provider-dashboard/leads"
            className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:bg-accent/50"
          >
            <Users className="w-5 h-5 text-primary" />
            <span className="font-medium">View leads</span>
          </Link>
          <Link
            to="/provider-dashboard/analytics"
            className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:bg-accent/50"
          >
            <TrendingUp className="w-5 h-5 text-primary" />
            <span className="font-medium">View analytics</span>
          </Link>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">Your policies</h3>
          <button
            type="button"
            onClick={onAddPolicy}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add policy
          </button>
        </div>

        {policyRows.length === 0 ? (
          <p className="text-center text-muted-foreground py-10">
            No policies yet. Add your first policy to submit it for admin approval.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-sm text-muted-foreground">
                  <th className="text-left py-3 px-4">Policy</th>
                  <th className="text-left py-3 px-4">Category</th>
                  <th className="text-left py-3 px-4">Purchases</th>
                  <th className="text-left py-3 px-4">Revenue</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {policyRows.slice(0, 8).map((policy) => (
                  <tr key={policy.id} className="border-b border-border hover:bg-accent/30">
                    <td className="py-4 px-4 font-medium">{policy.name}</td>
                    <td className="py-4 px-4">{policy.categoryLabel}</td>
                    <td className="py-4 px-4">{policy.purchaseLeads}</td>
                    <td className="py-4 px-4">{policy.revenueLabel}</td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm inline-flex items-center gap-1 ${statusClass(policy.status)}`}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        {policy.statusLabel}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <button
                        type="button"
                        onClick={() => onEditPolicy(policy.id)}
                        className="text-sm text-primary hover:underline"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {policyRows.length > 8 ? (
          <Link
            to="/provider-dashboard/policies"
            className="inline-block mt-4 text-sm text-primary hover:underline"
          >
            View all policies →
          </Link>
        ) : null}
      </div>
    </div>
  );
}
