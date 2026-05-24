import type { AdminAnalytics, PendingPolicySummary } from "./admin-api";
import type { AuthUser } from "./types";
import { titleCase } from "./provider-utils";

export { titleCase };

export interface ProviderSummary {
  slug: string;
  name: string;
  pendingPolicies: number;
  status: string;
}

export interface InsurerRow {
  id: string;
  name: string;
  email: string;
  pendingPolicies: number;
  status: string;
  verification: string;
}

export interface ActivityItem {
  id: string;
  action: string;
  subject: string;
  time: string;
  sortAt: number;
  severity: "low" | "medium" | "high";
}

export function buildProviderSummaries(pendingPolicies: PendingPolicySummary[]): ProviderSummary[] {
  const bySlug = new Map<string, ProviderSummary>();
  pendingPolicies.forEach((policy) => {
    const slug = policy.insurer?.slug ?? "unknown";
    const current = bySlug.get(slug) ?? {
      slug,
      name: policy.insurer?.companyName ?? "Unknown insurer",
      pendingPolicies: 0,
      status: "Pending review",
    };
    bySlug.set(slug, { ...current, pendingPolicies: current.pendingPolicies + 1 });
  });
  return [...bySlug.values()].sort((a, b) => b.pendingPolicies - a.pendingPolicies);
}

export function buildInsurerRows(users: AuthUser[], pendingPolicies: PendingPolicySummary[]): InsurerRow[] {
  return users
    .filter((user) => user.role === "insurer")
    .map((user) => {
      const pending = pendingPolicies.filter(
        (policy) => policy.insurer?.companyName === user.fullName
      ).length;
      return {
        id: user.id,
        name: user.fullName,
        email: user.email,
        pendingPolicies: pending,
        status: user.status === "active" ? "Active" : titleCase(user.status),
        verification: user.status === "active" ? "Verified" : "Pending",
      };
    });
}

export function buildRecentActivity(
  users: AuthUser[],
  pendingPolicies: PendingPolicySummary[]
): ActivityItem[] {
  const items: ActivityItem[] = [];

  users.slice(0, 8).forEach((user) => {
    items.push({
      id: `user-${user.id}`,
      action: "User registered",
      subject: user.fullName,
      time: new Date(user.createdAt).toLocaleString(),
      sortAt: new Date(user.createdAt).getTime(),
      severity: "low",
    });
  });

  pendingPolicies.slice(0, 8).forEach((policy) => {
    items.push({
      id: `policy-${policy.id}`,
      action: "Policy submitted for review",
      subject: `${policy.name} · ${policy.insurer?.companyName ?? "Unknown insurer"}`,
      time: new Date(policy.createdAt).toLocaleString(),
      sortAt: new Date(policy.createdAt).getTime(),
      severity: "medium",
    });
  });

  return items.sort((a, b) => b.sortAt - a.sortAt).slice(0, 12);
}

export function roleDistribution(analytics: AdminAnalytics | null) {
  if (!analytics) return [];
  return Object.entries(analytics.users.byRole ?? {})
    .filter(([, count]) => count > 0)
    .map(([role, count]) => ({
      role: titleCase(role),
      count,
      percentage: analytics.users.total
        ? Math.round((count / analytics.users.total) * 100)
        : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

export function policyStatusDistribution(analytics: AdminAnalytics | null) {
  if (!analytics) return [];
  const { pending, approved, rejected } = analytics.policies;
  const total = pending + approved + rejected;
  return [
    { label: "Approved", count: approved, percentage: total ? Math.round((approved / total) * 100) : 0 },
    { label: "Pending", count: pending, percentage: total ? Math.round((pending / total) * 100) : 0 },
    { label: "Rejected", count: rejected, percentage: total ? Math.round((rejected / total) * 100) : 0 },
  ].filter((item) => item.count > 0);
}
