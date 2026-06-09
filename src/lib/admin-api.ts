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
  starterPoliciesCount?: number;
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

export interface InfrastructureServiceStatus {
  ok: boolean;
  latencyMs: number;
  label: string;
  detail?: string;
  url?: string;
}

export interface AssistantUsageSummary {
  serverStartedAt: string;
  lastRequestAt?: string;
  totalApiCalls: number;
  successfulApiCalls: number;
  failedApiCalls: number;
  rateLimitErrors: number;
  chatApiCalls: number;
  explainApiCalls: number;
  probeApiCalls: number;
  claimIntelligenceApiCalls: number;
  kycApiCalls: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  requestsLastMinute: number;
  recentErrors: Array<{ at: string; route: string; message: string }>;
}

export interface AssistantHealthReport {
  configured: boolean;
  apiKeySet: boolean;
  ok: boolean;
  latencyMs: number;
  label: string;
  detail?: string;
  model: string;
  modelResourceName?: string;
  displayName?: string;
  modelAvailable: boolean;
  supportedGenerationMethods: string[];
  limits: {
    configuredMaxOutputTokens: number;
    modelInputTokenLimit?: number;
    modelOutputTokenLimit?: number;
    assistantRateLimitPerMin: number;
    anonymousRateLimitPerMin: number;
    geminiUpstreamRpm: number;
    maxAttachmentsPerMessage: number;
    maxBytesPerAttachment: number;
    allowedAttachmentMimeTypes: string[];
  };
  usage: AssistantUsageSummary;
  internalRateLimits: {
    activeBuckets: number;
    totalTrackedRequests: number;
  };
  diagnostics: string[];
  notes: string[];
}

export interface HealthStatus {
  service: string;
  environment: string;
  database: {
    connected: boolean;
    readyState?: number;
    host?: string;
    name?: string;
    error?: string;
  };
  email: {
    provider: string;
    configured: boolean;
    ready: boolean;
    error?: string;
    hint?: string;
    renderFreeTierNote?: string;
  };
  infrastructure?: {
    render: InfrastructureServiceStatus;
    vercel: InfrastructureServiceStatus;
    mongodb: InfrastructureServiceStatus;
    brevo: InfrastructureServiceStatus;
    gemini: InfrastructureServiceStatus;
    checkedAt: string;
    environment: string;
  };
  assistant?: AssistantHealthReport;
  timestamp: string;
}

export type FraudCategory = "account" | "claims" | "commerce" | "catalog";

export interface FraudSignal {
  id: string;
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  subject: string;
  detail: string;
  detectedAt: string;
  link?: string;
  mlScore?: number;
  mlFactors?: string[];
  mlModelVersion?: string;
}

export interface FraudMlSummary {
  averageScore: number;
  highConfidenceCount: number;
  modelVersion: string;
}

export async function fetchFraudSignals(category: FraudCategory): Promise<{
  category: FraudCategory;
  count: number;
  signals: FraudSignal[];
  mlSummary?: FraudMlSummary;
}> {
  return apiRequest(`/api/admin/fraud-signals?category=${category}`, { auth: true });
}

export async function fetchHealth(): Promise<HealthStatus> {
  return apiRequest("/api/admin/health", { auth: true });
}

export interface AdminMlOverview {
  geminiUsage: AssistantUsageSummary;
  models: {
    claimRiskLoaded: boolean;
    claimRiskVersion: string | null;
    policyRankerCategories: string[];
  };
  claims: {
    total: number;
    withIntelligenceReport: number;
    last24h: number;
  };
  questionnaires: {
    totalResponses: number;
    uniqueUsers: number;
  };
}

export async function fetchMlOverview(): Promise<AdminMlOverview> {
  return apiRequest("/api/admin/ml-overview", { auth: true });
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
