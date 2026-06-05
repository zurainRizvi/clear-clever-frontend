import type { ConversationSummary } from "./messaging-api";
import type { UserRole } from "./types";

function participantLabel(
  participant: ConversationSummary["participants"][number] | undefined,
  fallback: string
) {
  if (!participant) return fallback;
  const preferred = participant.fullName?.trim();
  if (preferred) return preferred;
  const emailName = participant.email?.split("@")[0]?.trim();
  if (emailName) return emailName;
  return participant.role === "insurer" ? "Insurer" : "Policy Seeker";
}

function defaultTitleForUserInsurer(
  conversation: ConversationSummary,
  viewerRole?: UserRole
) {
  const seeker = conversation.participants.find((participant) => participant.role === "user");
  const seekerName = participantLabel(seeker, "Policy Seeker");
  const insurerName = conversation.insurer?.companyName ?? "Insurer";

  if (viewerRole === "user") return insurerName;
  if (viewerRole === "insurer") return seekerName;
  if (viewerRole === "admin" || viewerRole === "superadmin") {
    return `${seekerName} · ${insurerName}`;
  }

  return insurerName;
}

export function titleForConversation(
  conversation: ConversationSummary,
  currentUserId?: string,
  viewerRole?: UserRole
) {
  if (conversation.displayTitleOverride?.trim()) {
    return conversation.displayTitleOverride.trim();
  }
  if (conversation.displayTitle?.trim()) {
    return conversation.displayTitle.trim();
  }
  if (conversation.type === "user_insurer") {
    return defaultTitleForUserInsurer(conversation, viewerRole);
  }
  const other = conversation.participants.find(
    (participant) =>
      participant.id !== currentUserId &&
      participant.role !== "admin" &&
      participant.role !== "superadmin"
  );
  if (other) {
    return participantLabel(other, other.role === "insurer" ? "Insurer" : "Policy Seeker");
  }
  if (conversation.type === "user_support") return "ClearClever Support";
  if (conversation.type === "insurer_support") return "Provider Support";
  if (conversation.type === "internal_admin") return "Internal Staff Chat";
  return conversation.subject ?? "Conversation";
}

export function subtitleForConversation(
  conversation: ConversationSummary,
  currentUserId?: string
) {
  if (conversation.type === "user_insurer") {
    const seeker = conversation.participants.find((participant) => participant.role === "user");
    const insurerName = conversation.insurer?.companyName ?? "Insurer";
    if (seeker) {
      return `${seeker.fullName || seeker.email} · ${insurerName}`;
    }
    return insurerName;
  }
  if (conversation.type === "user_support") {
    const seeker = conversation.participants.find((participant) => participant.role === "user");
    return seeker ? seeker.email : "Policy seeker support";
  }
  if (conversation.type === "insurer_support") {
    const insurer = conversation.participants.find((participant) => participant.role === "insurer");
    return insurer ? insurer.email : "Insurer support";
  }
  const other = conversation.participants.find((participant) => participant.id !== currentUserId);
  return other?.email ?? conversation.type.replace(/_/g, " ");
}
