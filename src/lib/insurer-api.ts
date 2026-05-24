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
  leads: InsurerLeadSummary[];
}> {
  return apiRequest("/api/insurer/leads", { auth: true });
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
  status: Exclude<InsurerClaimStatus, "submitted">
): Promise<{ claim: InsurerClaimSummary }> {
  return apiRequest(`/api/insurer/claims/${claimId}`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify({ status }),
  });
}
