import { apiRequest } from "./api";
import type { AuthUser, CategorySlug, PublicPolicy, UserRole } from "./types";
import type { InsurerPolicyStatus } from "./insurer-api";

export interface PendingPolicySummary {
  id: string;
  slug: string;
  name: string;
  category: Exclude<CategorySlug, "others">;
  status: InsurerPolicyStatus;
  premiumMonthlyPkr: number;
  premiumYearlyPkr: number;
  rejectionReason?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
  description?: string;
  insurer?: {
    companyName: string;
    slug: string;
  };
}

export interface AdminAnalytics {
  users: {
    total: number;
    active: number;
    inactive: number;
    byRole: Partial<Record<UserRole, number>>;
  };
  policies: {
    pending: number;
    approved: number;
    rejected: number;
    total: number;
  };
  leads: {
    total: number;
    new: number;
  };
}

export async function fetchPendingPolicies(): Promise<{
  count: number;
  policies: PendingPolicySummary[];
}> {
  return apiRequest("/api/admin/policies/pending", { auth: true });
}

export async function approvePolicy(id: string): Promise<{
  policy: PendingPolicySummary;
  publicPolicy?: PublicPolicy;
}> {
  return apiRequest(`/api/admin/policies/${id}/approve`, {
    method: "POST",
    auth: true,
  });
}

export async function rejectPolicy(
  id: string,
  reason?: string
): Promise<{ policy: PendingPolicySummary }> {
  return apiRequest(`/api/admin/policies/${id}/reject`, {
    method: "POST",
    auth: true,
    body: JSON.stringify({ reason }),
  });
}

export async function fetchAdminUsers(): Promise<{
  count: number;
  users: AuthUser[];
}> {
  return apiRequest("/api/admin/users", { auth: true });
}

export async function fetchAdminAnalytics(): Promise<AdminAnalytics> {
  return apiRequest("/api/admin/analytics", { auth: true });
}
