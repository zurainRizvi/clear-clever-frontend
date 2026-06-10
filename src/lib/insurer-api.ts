import { apiRequest } from "./api";
import type { ClaimIntelligenceReport } from "./claim-intelligence-types";
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

export interface InsurerCustomerPurchaseSummary {
  id: string;
  status: string;
  completedAt?: string;
  createdAt: string;
  policy?: {
    id: string;
    slug: string;
    name: string;
    category: string;
    premiumMonthlyPkr?: number;
    premiumYearlyPkr?: number;
  };
}

export interface InsurerCustomerDemographics {
  gender?: string;
  ageBand?: string;
  province?: string;
  district?: string;
  kycStatus: string;
  kycScore?: number;
}

export interface InsurerCustomerGroup {
  seeker: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
  };
  demographics?: InsurerCustomerDemographics;
  leads: InsurerLeadSummary[];
  purchases: InsurerCustomerPurchaseSummary[];
  isNew: boolean;
  latestActivityAt: string;
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
    email: string;
    category: string;
    time: string;
    status: "Hot" | "Warm";
    isNew: boolean;
    leadCount: number;
    purchaseCount: number;
    preview: string;
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

export interface InsurerAnalyticsMetric {
  title: string;
  value: string;
  change: string;
  trend: InsurerAnalyticsTrend;
  icon: string;
  iconColor: string;
  definition: string;
  whyItMatters: string;
  sparkline: number[];
}

export interface InsurerAnalyticsPayload {
  dateRange: { from: string; to: string; label: string };
  overviewMetrics: InsurerAnalyticsMetric[];
  interestTrends: {
    title: string;
    definition: string;
    xAxis: string[];
    datasets: Array<{ key: string; label: string; color: string; values: number[] }>;
    sideLegend: Array<{ label: string; percentage: string; trend: string }>;
    insightBanner: { text: string; badge: string };
  };
  funnel: {
    title: string;
    definition: string;
    steps: Array<{ name: string; users: number; conversion?: string; dropOff?: number }>;
  };
  leadSources: Array<{ source: string; label: string; count: number; sharePct: number }>;
  customerSegments: Array<{
    segment: string;
    category: string;
    seekers: number;
    leads: number;
    purchaseRate: string;
    purchaseRatePct: number;
    opportunity: "High" | "Medium" | "Low";
  }>;
  smartInsights: Array<{
    icon: string;
    title: string;
    description: string;
    evidence: string;
    suggestion: string;
    theme: "purple" | "orange" | "green" | "blue";
  }>;
  revenue: {
    title: string;
    definition: string;
    totalRevenue: string;
    totalRevenuePkr: number;
    growth: string;
    trend: "up" | "down" | "neutral";
    chartValues: number[];
    xAxis: string[];
  };
  policyPerformance: Array<{
    policy: string;
    recommended: number;
    saved: number;
    checkouts: number;
    sold: number;
    premiumPkr: number;
    premiumFormatted: string;
    purchaseRatePct: number;
    purchaseRate: string;
  }>;
  operations: Array<{
    metric: string;
    value: string;
    status: "Strong" | "Needs attention";
    definition: string;
    whyItMatters: string;
  }>;
  usersByRegion: {
    title: string;
    subtitle: string;
    totalUsers: number;
    mappedUsers: number;
    coverageNote?: string;
    audience: "all" | "purchasers" | "leads";
    regionFilter: string | null;
    regions: Array<{
      slug: string;
      label: string;
      color: string;
      userCount: number;
    }>;
  };
  audienceUsers: Array<{
    userId: string;
    name: string;
    category: string;
    lastStage: string;
    purchased: boolean;
  }>;
  customerDemographics: {
    title: string;
    subtitle: string;
    totalPurchasers: number;
    kycVerifiedCount: number;
    kycVerifiedRate: string;
    kycVerifiedRatePct: number;
    gender: { male: number; female: number; unknown: number };
    ageBuckets: {
      under18: number;
      age18to25: number;
      age26to35: number;
      age36to50: number;
      age50plus: number;
      unknown: number;
    };
    adultRate: string;
    adultRatePct: number;
    expiredCnicCount: number;
    topDistricts: Array<{ district: string; province: string; count: number }>;
    topProvinces: Array<{ province: string; count: number }>;
    verificationQuality: {
      avgKycScore: number;
      avgKycScoreFormatted: string;
      documentReadableRate: string;
      documentReadableRatePct: number;
    };
  };
}

export async function fetchInsurerAnalytics(params?: {
  from?: string;
  to?: string;
  audience?: "all" | "purchasers" | "leads";
  region?: string;
}): Promise<{ analytics: InsurerAnalyticsPayload }> {
  const search = new URLSearchParams();
  if (params?.from) search.set("from", params.from);
  if (params?.to) search.set("to", params.to);
  if (params?.audience) search.set("audience", params.audience);
  if (params?.region) search.set("region", params.region);
  const query = search.toString();
  return apiRequest(`/api/insurer/analytics${query ? `?${query}` : ""}`, { auth: true });
}

export async function createInsurerProfile(body: {
  companyName: string;
  slug: string;
  contactPhone: string;
  description?: string;
  websiteUrl?: string;
}): Promise<{ profile: InsurerProfile; policiesCreated: number }> {
  return apiRequest("/api/insurer/profile", {
    method: "POST",
    auth: true,
    body: JSON.stringify(body),
  });
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
  customers: InsurerCustomerGroup[];
}> {
  return apiRequest("/api/insurer/leads", { auth: true });
}

export async function revokeInsurerPurchase(purchaseId: string): Promise<{
  purchase: { id: string; status: string };
}> {
  return apiRequest(`/api/insurer/purchases/${purchaseId}/revoke`, {
    method: "PATCH",
    auth: true,
  });
}

export async function terminateInsurerPurchase(purchaseId: string): Promise<{
  purchase: { id: string; status: string };
}> {
  return apiRequest(`/api/insurer/purchases/${purchaseId}/terminate`, {
    method: "PATCH",
    auth: true,
  });
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

export type InsurerClaimStatus =
  | "submitted"
  | "in_review"
  | "needs_info"
  | "approved"
  | "rejected";

export type MlRiskLevel = "low" | "medium" | "high";

export interface ClaimMlRisk {
  score: number;
  level: MlRiskLevel;
  approvalProbability: number;
  topFactors: string[];
  modelVersion: string;
}

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
  mlRisk?: ClaimMlRisk;
  intelligenceReport?: ClaimIntelligenceReport;
  attachments?: {
    fileName: string;
    mimeType: string;
    dataBase64: string;
    uploadedAt: string;
  }[];
  insurerComment?: {
    text: string;
    createdAt: string;
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
  options?: { revert?: boolean; comment?: string }
): Promise<{ claim: InsurerClaimSummary }> {
  return apiRequest(`/api/insurer/claims/${claimId}`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify({
      status,
      revert: options?.revert,
      comment: options?.comment,
    }),
  });
}
