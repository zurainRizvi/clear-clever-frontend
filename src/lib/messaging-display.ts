import type { ConversationSummary } from "./messaging-api";

export function titleForConversation(
  conversation: ConversationSummary,
  currentUserId?: string
) {
  if (conversation.displayTitle?.trim()) {
    return conversation.displayTitle.trim();
  }
  if (conversation.insurer?.companyName && conversation.type === "user_insurer") {
    return conversation.insurer.companyName;
  }
  const other = conversation.participants.find(
    (participant) =>
      participant.id !== currentUserId &&
      participant.role !== "admin" &&
      participant.role !== "superadmin"
  );
  if (other) return other.fullName;
  if (conversation.type === "user_support") return "ClearClever Support";
  if (conversation.type === "insurer_support") return "Provider Support";
  if (conversation.type === "internal_admin") return "Internal Staff Chat";
  return conversation.subject ?? "Conversation";
}
