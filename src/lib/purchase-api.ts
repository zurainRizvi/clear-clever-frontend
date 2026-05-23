import { apiRequest } from "./api";
import type { PublicPolicy } from "./types";

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
    premiumMonthlyPkr: number;
  };
  insurer?: {
    id: string;
    slug: string;
    companyName: string;
    contactPhone?: string;
  };
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
      scheduledAt: string;
      status: string;
      notes?: string;
    };
  };
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  metadata?: Record<string, unknown>;
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

export type { PublicPolicy };
