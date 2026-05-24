import { apiRequest } from "./api";
import type { UserRole } from "./types";

export type ConversationType =
  | "user_insurer"
  | "user_support"
  | "insurer_support"
  | "internal_admin";

export interface ConversationParticipant {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
}

export interface ConversationSummary {
  id: string;
  type: ConversationType;
  subject?: string;
  participantUserIds: string[];
  participants: ConversationParticipant[];
  insurer?: {
    id: string;
    slug: string;
    companyName: string;
  };
  purchaseId?: string;
  lastMessagePreview?: string;
  lastMessageAt?: string;
  readByUserIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ConversationMessage {
  id: string;
  conversationId: string;
  senderUserId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export async function fetchConversations(): Promise<{
  count: number;
  conversations: ConversationSummary[];
}> {
  return apiRequest("/api/conversations", { auth: true });
}

export async function createConversation(body: {
  type: ConversationType;
  insurerProfileId?: string;
  targetUserId?: string;
  purchaseId?: string;
  subject?: string;
  initialMessage?: string;
}): Promise<{ conversation: ConversationSummary; message?: ConversationMessage }> {
  return apiRequest("/api/conversations", {
    method: "POST",
    auth: true,
    body: JSON.stringify(body),
  });
}

export async function fetchConversationMessages(
  conversationId: string
): Promise<{ count: number; messages: ConversationMessage[] }> {
  return apiRequest(`/api/conversations/${conversationId}/messages`, { auth: true });
}

export async function sendConversationMessage(
  conversationId: string,
  body: string
): Promise<{ message: ConversationMessage; conversation: ConversationSummary }> {
  return apiRequest(`/api/conversations/${conversationId}/messages`, {
    method: "POST",
    auth: true,
    body: JSON.stringify({ body }),
  });
}

export async function markConversationRead(
  conversationId: string
): Promise<{ conversation: ConversationSummary }> {
  return apiRequest(`/api/conversations/${conversationId}/read`, {
    method: "PATCH",
    auth: true,
  });
}
