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
  displayTitle?: string;
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
  attachments?: {
    fileName: string;
    mimeType: string;
    dataUrl: string;
  }[];
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
  body: string,
  attachments?: { fileName: string; mimeType: string; dataUrl: string }[]
): Promise<{ message: ConversationMessage; conversation: ConversationSummary }> {
  return apiRequest(`/api/conversations/${conversationId}/messages`, {
    method: "POST",
    auth: true,
    body: JSON.stringify({ body, attachments }),
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

export async function updateConversationDisplayTitle(
  conversationId: string,
  displayTitle: string
): Promise<{ conversation: ConversationSummary }> {
  return apiRequest(`/api/conversations/${conversationId}`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify({ displayTitle }),
  });
}

export async function deleteConversation(conversationId: string): Promise<{ message: string }> {
  return apiRequest(`/api/conversations/${conversationId}`, {
    method: "DELETE",
    auth: true,
  });
}
