import { apiRequest } from "./api";
import type { CategorySlug, PolicyQuestion } from "./types";

export type InsurerPolicyStatus = "pending" | "approved" | "rejected";
export type InsurerPolicyCategory = Exclude<CategorySlug, "others">;

export interface InsurerProfile {
  id: string;
  companyName: string;
  slug: string;
  contactEmail: string;
  contactPhone: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InsurerPolicySummary {
  id: string;
  slug: string;
  name: string;
  category: InsurerPolicyCategory;
  status: InsurerPolicyStatus;
  premiumMonthlyPkr: number;
  premiumYearlyPkr: number;
  rejectionReason?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InsurerPolicyDetail extends InsurerPolicySummary {
  description: string;
  coverageSummary: string;
  features: string[];
  deductiblePkr: number;
  questions: PolicyQuestion[];
}

export interface InsurerLeadSummary {
  id: string;
  type: string;
  status: string;
  seenAt?: string;
  isNew?: boolean;
  summary: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  seeker?: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
  };
  policy?: {
    id: string;
    slug: string;
    name: string;
    category: string;
  };
}

export interface InsurerPolicyInput {
  slug: string;
  name: string;
  category: InsurerPolicyCategory;
  description: string;
  premiumMonthlyPkr: number;
  premiumYearlyPkr: number;
  coverageSummary: string;
  features: string[];
  deductiblePkr: number;
  questions?: PolicyQuestion[];
}

export type InsurerDashboardTrend = "up" | "down" | "neutral";

export interface InsurerDashboardOverviewStat {
  title: string;
  value: string;
  change: string;
  trend: InsurerDashboardTrend;
  icon: string;
  iconColor: string;
}

export interface InsurerSmartInsight {
  badge: string;
  title: string;
  description: string;
  metricLabel: string;
  metricValue: string;
  theme: "blue" | "green" | "purple" | "orange";
  sparkline: number[];
  priority: number;
  actionType?: string;
}

export interface InsurerDashboardPayload {
  dateRange: { from: string; to: string; label: string };
  overviewStats: InsurerDashboardOverviewStat[];
  smartInsights: InsurerSmartInsight[];
  topPolicies: Array<{
    policyId: string;
    policy: string;
    category: string;
    match: string;
    conversion: string;
    audience: string;
    revenue: string;
    revenuePkr: number;
    trend: number[];
  }>;
  demandTrends: {
    centerLabel: string;
    segments: Array<{
      label: string;
      value: string;
      color: string;
      trend: string;
      count: number;
    }>;
    footerInsight: { label: string; text: string; badge: string };
  };
  recentLeads: Array<{
    id: string;
    name: string;
    category: string;
    time: string;
    status: "Hot" | "Warm";
  }>;
  pendingClaims: Array<{
    id: string;
    claimId: string;
    category: string;
    submitted: string;
  }>;
  badges: {
    claims: number;
    queries: number;
    support: number;
    notifications: number;
  };
}

export async function fetchInsurerDashboard(params?: {
  from?: string;
  to?: string;
}): Promise<{ dashboard: InsurerDashboardPayload }> {
  const search = new URLSearchParams();
  if (params?.from) search.set("from", params.from);
  if (params?.to) search.set("to", params.to);
  const query = search.toString();
  return apiRequest(`/api/insurer/dashboard${query ? `?${query}` : ""}`, { auth: true });
}

export type InsurerAnalyticsTrend = "up" | "down" | "neutral" | "down-positive";

export interface InsurerAnalyticsPayload {
  dateRange: { from: string; to: string; label: string };
  overviewMetrics: Array<{
    title: string;
    value: string;
    change: string;
    trend: InsurerAnalyticsTrend;
    icon: string;
    iconColor: string;
    sparkline: number[];
  }>;
  interestTrends: {
    xAxis: string[];
    datasets: Array<{ label: string; color: string; values: number[] }>;
    sideLegend: Array<{ label: string; percentage: string; trend: string }>;
    insightBanner: { text: string; badge: string };
  };
  funnel: {
    steps: Array<{ name: string; users: number; conversion?: string }>;
  };
  customerSegments: Array<{
    segment: string;
    interest: string;
    level: "High" | "Medium" | "Low";
    conversion: string;
    conversionPct: number;
  }>;
  smartInsights: Array<{
    icon: string;
    title: string;
    description: string;
    suggestion: string;
    theme: "purple" | "orange" | "green" | "blue";
  }>;
  revenue: {
    totalRevenue: string;
    totalRevenuePkr: number;
    growth: string;
    trend: "up" | "down" | "neutral";
    chartValues: number[];
    xAxis: string[];
  };
  topPolicies: Array<{ policy: string; revenue: string; conversion: string }>;
  competitiveness: {
    score: number;
    label: string;
    indicators: Array<{
      metric: string;
      status: "Strong" | "Average" | "Needs Improvement";
    }>;
    footerSuggestion: string;
  };
}

export async function fetchInsurerAnalytics(params?: {
  from?: string;
  to?: string;
}): Promise<{ analytics: InsurerAnalyticsPayload }> {
  const search = new URLSearchParams();
  if (params?.from) search.set("from", params.from);
  if (params?.to) search.set("to", params.to);
  const query = search.toString();
  return apiRequest(`/api/insurer/analytics${query ? `?${query}` : ""}`, { auth: true });
}

export async function fetchInsurerProfile(): Promise<{ profile: InsurerProfile }> {
  return apiRequest("/api/insurer/profile", { auth: true });
}

export async function updateInsurerProfile(body: {
  contactEmail?: string;
  contactPhone?: string;
  description?: string;
}): Promise<{ profile: InsurerProfile }> {
  return apiRequest("/api/insurer/profile", {
    method: "PATCH",
    auth: true,
    body: JSON.stringify(body),
  });
}

export async function fetchInsurerPolicies(): Promise<{
  count: number;
  policies: InsurerPolicySummary[];
}> {
  return apiRequest("/api/insurer/policies", { auth: true });
}

export async function fetchInsurerPolicy(
  policyId: string
): Promise<{ policy: InsurerPolicyDetail }> {
  return apiRequest(`/api/insurer/policies/${policyId}`, { auth: true });
}

export async function createInsurerPolicy(
  body: InsurerPolicyInput
): Promise<{ policy: InsurerPolicyDetail }> {
  return apiRequest("/api/insurer/policies", {
    method: "POST",
    auth: true,
    body: JSON.stringify(body),
  });
}

export async function updateInsurerPolicy(
  policyId: string,
  body: Partial<InsurerPolicyInput>
): Promise<{ policy: InsurerPolicyDetail }> {
  return apiRequest(`/api/insurer/policies/${policyId}`, {
    method: "PUT",
    auth: true,
    body: JSON.stringify(body),
  });
}

export async function fetchInsurerLeads(): Promise<{
  count: number;
  unseenNewCount: number;
  leads: InsurerLeadSummary[];
}> {
  return apiRequest("/api/insurer/leads", { auth: true });
}

export async function markInsurerLeadSeen(leadId: string): Promise<{
  lead: { id: string; seenAt: string; isNew: boolean };
}> {
  return apiRequest(`/api/insurer/leads/${leadId}/seen`, {
    method: "PATCH",
    auth: true,
  });
}

export async function deleteInsurerPolicy(policyId: string): Promise<{ policyId: string }> {
  return apiRequest(`/api/insurer/policies/${policyId}`, {
    method: "DELETE",
    auth: true,
  });
}

export type InsurerClaimStatus = "submitted" | "in_review" | "approved" | "rejected";

export interface InsurerClaimSummary {
  id: string;
  purchaseId: string;
  claimType: string;
  incidentDate: string;
  estimatedAmountPkr?: number;
  description: string;
  status: InsurerClaimStatus;
  createdAt: string;
  updatedAt: string;
  policy?: {
    id: string;
    name: string;
    category: string;
  };
  insurer?: {
    id: string;
    companyName: string;
    contactPhone?: string;
  };
  seeker?: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
  };
}

export async function fetchInsurerClaims(): Promise<{
  count: number;
  claims: InsurerClaimSummary[];
}> {
  return apiRequest("/api/insurer/claims", { auth: true });
}

export async function updateInsurerClaimStatus(
  claimId: string,
  status: Exclude<InsurerClaimStatus, "submitted">,
  options?: { revert?: boolean }
): Promise<{ claim: InsurerClaimSummary }> {
  return apiRequest(`/api/insurer/claims/${claimId}`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify({ status, revert: options?.revert }),
  });
}
