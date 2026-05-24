import { apiRequest } from "./api";
import type { CategorySlug } from "./types";

export type InsurerPolicyStatus = "pending" | "approved" | "rejected";

export interface InsurerPolicySummary {
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

export async function fetchInsurerPolicies(): Promise<{
  count: number;
  policies: InsurerPolicySummary[];
}> {
  return apiRequest("/api/insurer/policies", { auth: true });
}

export async function fetchInsurerLeads(): Promise<{
  count: number;
  leads: InsurerLeadSummary[];
}> {
  return apiRequest("/api/insurer/leads", { auth: true });
}
