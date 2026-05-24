import type { ConversationSummary } from "./messaging-api";

export function isConversationUnread(
  conversation: ConversationSummary,
  userId: string | undefined
): boolean {
  if (!userId || !conversation.lastMessageAt) return false;
  return !conversation.readByUserIds.includes(userId);
}

export function countUnreadConversations(
  conversations: ConversationSummary[],
  userId: string | undefined
): number {
  return conversations.filter((conversation) => isConversationUnread(conversation, userId)).length;
}
