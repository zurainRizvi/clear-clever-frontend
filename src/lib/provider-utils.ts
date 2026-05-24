import type { InsurerLeadSummary, InsurerPolicySummary } from "./insurer-api";
import { formatPkr } from "./format";

export function titleCase(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function statusClass(status: string) {
  if (status === "approved" || status === "purchase") return "bg-success/10 text-success";
  if (status === "rejected" || status === "closed") return "bg-destructive/10 text-destructive";
  if (status === "pending" || status === "new" || status === "submitted")
    return "bg-warning/10 text-warning";
  if (status === "in_progress" || status === "in_review") return "bg-primary/10 text-primary";
  return "bg-muted text-muted-foreground";
}

export function slugifyName(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export interface PolicyRow extends InsurerPolicySummary {
  categoryLabel: string;
  statusLabel: string;
  purchaseLeads: number;
  revenuePkr: number;
  revenueLabel: string;
}

export function buildPolicyRows(
  policies: InsurerPolicySummary[],
  leads: InsurerLeadSummary[]
): PolicyRow[] {
  return policies.map((policy) => {
    const policyLeads = leads.filter(
      (lead) => lead.policy?.id === policy.id && lead.type === "purchase"
    );
    const revenuePkr = policyLeads.reduce((sum) => sum + policy.premiumYearlyPkr, 0);
    return {
      ...policy,
      categoryLabel: titleCase(policy.category),
      statusLabel: titleCase(policy.status),
      purchaseLeads: policyLeads.length,
      revenuePkr,
      revenueLabel: formatPkr(revenuePkr),
    };
  });
}

export function categoryDistribution(policies: InsurerPolicySummary[]) {
  const counts = new Map<string, number>();
  for (const policy of policies) {
    counts.set(policy.category, (counts.get(policy.category) ?? 0) + 1);
  }
  const total = policies.length || 1;
  return [...counts.entries()]
    .map(([category, count]) => ({
      category: titleCase(category),
      count,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count);
}

export function leadsByStatus(leads: InsurerLeadSummary[]) {
  const counts = new Map<string, number>();
  for (const lead of leads) {
    counts.set(lead.status, (counts.get(lead.status) ?? 0) + 1);
  }
  return [...counts.entries()].map(([status, count]) => ({
    status: titleCase(status),
    count,
  }));
}
