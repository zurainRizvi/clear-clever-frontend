import { apiRequest } from "./api";
import type {
  ClaimAttachmentPayload,
  ClaimIntelligenceReport,
} from "./claim-intelligence-types";
import type { PublicPolicy, PolicyFeatureSection } from "./types";

export type { ClaimAttachmentPayload, ClaimIntelligenceReport } from "./claim-intelligence-types";

export interface PurchaseSummary {
  id: string;
  status: string;
  affiliateSlug: string;
  answers: Record<string, unknown>;
  paymentProcessedAt?: string;
  completedAt?: string;
  createdAt: string;
  policy?: {
    id: string;
    slug: string;
    name: string;
    category: string;
    description?: string;
    premiumMonthlyPkr: number;
    premiumYearlyPkr?: number;
    coverageSummary?: string;
    features?: string[];
    featureSections?: PolicyFeatureSection[];
    deductiblePkr?: number;
    documentSummary?: {
      policyNumber: string;
      issuedAt: string;
      coverage: string;
    };
  };
  insurer?: {
    id: string;
    slug: string;
    companyName: string;
    contactEmail?: string;
    contactPhone?: string;
    pacraRating?: string;
    jcrVisRating?: string;
    operationalSince?: number;
    policyType?: "conventional" | "islamic" | "both";
  };
  claims?: ClaimSummary[];
  timeline: {
    paymentProcessed: boolean;
    completed: boolean;
    notifications: {
      id: string;
      type: string;
      title: string;
      body: string;
      read: boolean;
      createdAt: string;
    }[];
    email?: {
      id: string;
      subject: string;
      body: string;
      sentAt: string;
      status: string;
      fromInsurer?: string;
    };
    callScheduled?: {
      id: string;
      scheduleType?: "agent_call" | "survey_visit";
      scheduledAt: string;
      status: string;
      notes?: string;
      agentLabel?: string;
    };
    surveyScheduled?: {
      id: string;
      scheduleType?: "agent_call" | "survey_visit";
      scheduledAt: string;
      status: string;
      notes?: string;
      agentLabel?: string;
    };
    schedules?: Array<{
      id: string;
      scheduleType?: "agent_call" | "survey_visit";
      scheduledAt: string;
      status: string;
      notes?: string;
      agentLabel?: string;
    }>;
  };
}

export interface ClaimStoredAttachment {
  fileName: string;
  mimeType: string;
  dataBase64: string;
  uploadedAt: string;
}

export interface ClaimInsurerComment {
  text: string;
  createdAt: string;
}

export interface ClaimSummary {
  id: string;
  purchaseId: string;
  claimType: string;
  incidentDate: string;
  estimatedAmountPkr?: number;
  description: string;
  status: string;
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
  intelligenceReport?: ClaimIntelligenceReport;
  attachments?: ClaimStoredAttachment[];
  insurerComment?: ClaimInsurerComment;
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  metadata?: Record<string, unknown>;
  target?: {
    path: string;
    focusId: string;
    focusType: string;
  };
  createdAt: string;
}

export async function createPurchase(body: {
  policyId: string;
  answers: Record<string, unknown>;
}): Promise<{ purchaseId: string; redirectUrl: string; affiliateSlug: string }> {
  return apiRequest("/api/purchase", {
    method: "POST",
    auth: true,
    body: JSON.stringify(body),
  });
}

export async function fetchPurchases(): Promise<{ count: number; purchases: PurchaseSummary[] }> {
  return apiRequest("/api/purchases", { auth: true });
}

export async function fetchNotifications(): Promise<{
  count: number;
  unreadCount: number;
  notifications: AppNotification[];
}> {
  return apiRequest("/api/notifications", { auth: true });
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiRequest(`/api/notifications/${id}/read`, {
    method: "PATCH",
    auth: true,
  });
}

export async function markAllNotificationsRead(): Promise<{ modifiedCount: number }> {
  return apiRequest("/api/notifications/read-all", {
    method: "PATCH",
    auth: true,
  });
}

export async function clearNotifications(): Promise<{ deletedCount: number }> {
  return apiRequest("/api/notifications/clear", {
    method: "DELETE",
    auth: true,
  });
}

export async function rescheduleAgentCall(
  purchaseId: string,
  body: { scheduledDate: string; scheduledTime: string }
): Promise<{ purchase: PurchaseSummary }> {
  return apiRequest(`/api/purchases/${purchaseId}/call-schedule`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify(body),
  });
}

export async function fetchClaims(): Promise<{ count: number; claims: ClaimSummary[] }> {
  return apiRequest("/api/claims", { auth: true });
}

export async function createClaim(body: {
  purchaseId: string;
  claimType: string;
  incidentDate: string;
  estimatedAmountPkr?: number;
  description: string;
  intelligenceReport?: ClaimIntelligenceReport;
  attachments?: ClaimAttachmentPayload[];
}): Promise<{ claim: ClaimSummary }> {
  return apiRequest("/api/claims", {
    method: "POST",
    auth: true,
    body: JSON.stringify(body),
  });
}

export async function fetchClaim(id: string): Promise<{ claim: ClaimSummary }> {
  return apiRequest(`/api/claims/${id}`, { auth: true });
}

export async function resubmitClaim(
  id: string,
  body: {
    description?: string;
    estimatedAmountPkr?: number;
    attachments?: ClaimAttachmentPayload[];
    intelligenceReport?: ClaimIntelligenceReport;
    reuseIntelligenceReport?: boolean;
  }
): Promise<{ claim: ClaimSummary; attachmentsChanged: boolean }> {
  return apiRequest(`/api/claims/${id}/resubmit`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify(body),
  });
}

export async function analyzeClaimIntelligence(body: {
  purchaseId: string;
  claimType: string;
  description: string;
  estimatedAmountPkr?: number;
  incidentDate?: string;
  attachments: ClaimAttachmentPayload[];
}): Promise<{ intelligenceReport: ClaimIntelligenceReport }> {
  return apiRequest("/api/claims/analyze-intelligence", {
    method: "POST",
    auth: true,
    body: JSON.stringify(body),
  });
}

export async function fetchStoredQuestionnaireAnswers(category: string): Promise<{
  category: string;
  available: boolean;
  response: {
    id: string;
    answers: Record<string, unknown>;
    completedQuestionIds: string[];
    updatedAt: string;
  } | null;
}> {
  return apiRequest(`/api/recommend/answers/${category}`, { auth: true });
}

export type { PublicPolicy };
