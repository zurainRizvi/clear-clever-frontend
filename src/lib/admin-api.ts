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
  platform?: {
    insurers: {
      total: number;
      pendingVerification: number;
      active: number;
      inactive: number;
    };
    staff: {
      admins: number;
      superadmins: number;
    };
    purchases: number;
    claims: number;
    conversations: number;
  };
}

export interface AdminInsurerRecord {
  user: AuthUser;
  profile: {
    id: string;
    companyName: string;
    slug: string;
    contactEmail: string;
    contactPhone: string;
  } | null;
  pendingPolicies: number;
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

export async function changeUserRole(
  id: string,
  role: UserRole
): Promise<{ user: AuthUser }> {
  return apiRequest(`/api/admin/users/${id}/role`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify({ role }),
  });
}

export async function deactivateUser(id: string): Promise<{ user: AuthUser }> {
  return apiRequest(`/api/admin/users/${id}/deactivate`, {
    method: "PATCH",
    auth: true,
  });
}

export async function reactivateUser(id: string): Promise<{ user: AuthUser }> {
  return apiRequest(`/api/admin/users/${id}/reactivate`, {
    method: "PATCH",
    auth: true,
  });
}

export interface HealthStatus {
  service: string;
  environment: string;
  database: {
    connected: boolean;
    readyState?: number;
    host?: string;
    name?: string;
  };
  email: {
    provider: string;
    configured: boolean;
    ready: boolean;
    error?: string;
    hint?: string;
    renderFreeTierNote?: string;
  };
  timestamp: string;
}

export async function fetchHealth(): Promise<HealthStatus> {
  return apiRequest("/api/health");
}

export async function fetchAdminInsurers(): Promise<{
  count: number;
  insurers: AdminInsurerRecord[];
}> {
  return apiRequest("/api/admin/insurers", { auth: true });
}

export async function approveInsurer(id: string): Promise<{ user: AuthUser }> {
  return apiRequest(`/api/admin/insurers/${id}/approve`, {
    method: "POST",
    auth: true,
  });
}

export async function rejectInsurer(
  id: string,
  reason?: string
): Promise<{ user: AuthUser }> {
  return apiRequest(`/api/admin/insurers/${id}/reject`, {
    method: "POST",
    auth: true,
    body: JSON.stringify({ reason }),
  });
}

export async function revokeInsurer(id: string): Promise<{ user: AuthUser }> {
  return apiRequest(`/api/admin/insurers/${id}/revoke`, {
    method: "POST",
    auth: true,
  });
}

export async function deleteInsurerPermanently(id: string): Promise<{
  deletedUserId: string;
  message: string;
}> {
  return apiRequest(`/api/admin/insurers/${id}`, {
    method: "DELETE",
    auth: true,
  });
}
