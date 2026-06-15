import { Shield, User } from "lucide-react";
import { InsurerAvatar } from "./insurer-avatar";
import type { ConversationParticipant, ConversationSummary } from "@/lib/messaging-api";
import type { UserRole } from "@/lib/types";

function initialsFromName(name: string): string {
  return (
    name
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}

export function ConversationListAvatar({
  conversation,
  viewerRole,
  size = "md",
}: {
  conversation: ConversationSummary;
  viewerRole?: UserRole | null;
  size?: "sm" | "md";
}) {
  const sizeClass = size === "sm" ? "w-9 h-9" : "w-10 h-10";

  if (conversation.type.includes("support")) {
    return (
      <div
        className={`${sizeClass} rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0`}
      >
        <Shield className="w-5 h-5" aria-hidden />
      </div>
    );
  }

  if (conversation.type === "user_insurer" && viewerRole === "insurer") {
    const peer = conversation.participants.find((participant) => participant.role === "user");
    return (
      <UserPhotoAvatar
        photoUrl={peer?.profilePhotoDataUrl}
        name={peer?.fullName ?? "Policyholder"}
        sizeClass={sizeClass}
      />
    );
  }

  if (conversation.insurer?.companyName) {
    return <InsurerAvatar companyName={conversation.insurer.companyName} size={size === "sm" ? "sm" : "md"} />;
  }

  const peer = conversation.participants.find((participant) => participant.role === "user");
  return (
    <UserPhotoAvatar
      photoUrl={peer?.profilePhotoDataUrl}
      name={peer?.fullName ?? "User"}
      sizeClass={sizeClass}
    />
  );
}

export function MessageSenderAvatar({
  senderParticipant,
  conversation,
  mine,
}: {
  senderParticipant?: ConversationParticipant;
  conversation: ConversationSummary | null;
  mine: boolean;
}) {
  if (mine) {
    return (
      <UserPhotoAvatar
        photoUrl={senderParticipant?.profilePhotoDataUrl}
        name={senderParticipant?.fullName ?? "You"}
        sizeClass="w-8 h-8"
      />
    );
  }

  if (senderParticipant?.role === "insurer" || conversation?.insurer?.companyName) {
    return (
      <InsurerAvatar
        companyName={conversation?.insurer?.companyName ?? senderParticipant?.fullName}
        size="sm"
        className="w-8 h-8"
      />
    );
  }

  if (conversation?.type.includes("support")) {
    return (
      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <Shield className="w-4 h-4" aria-hidden />
      </div>
    );
  }

  return (
    <UserPhotoAvatar
      photoUrl={senderParticipant?.profilePhotoDataUrl}
      name={senderParticipant?.fullName ?? "User"}
      sizeClass="w-8 h-8"
    />
  );
}

function UserPhotoAvatar({
  photoUrl,
  name,
  sizeClass,
}: {
  photoUrl?: string;
  name: string;
  sizeClass: string;
}) {
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        className={`${sizeClass} rounded-full object-cover shrink-0 border border-border`}
      />
    );
  }

  const initials = initialsFromName(name);
  return (
    <div
      className={`${sizeClass} rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-border`}
      title={name}
    >
      {initials !== "?" ? (
        <span className="text-[10px] font-semibold text-primary">{initials}</span>
      ) : (
        <User className="w-4 h-4 text-primary" aria-hidden />
      )}
    </div>
  );
}
