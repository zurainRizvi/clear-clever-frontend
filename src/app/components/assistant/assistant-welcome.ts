import type { UserRole } from "@/lib/types";

export function getAssistantWelcomeMessage(input: {
  isAuthenticated: boolean;
  role: UserRole | null;
  fullName?: string;
}): string {
  if (!input.isAuthenticated) {
    return [
      "Hello! I'm your **ClearClever Assistant**.",
      "",
      "I can explain how ClearClever compares **home, auto, life, and pet** insurance in Pakistan, how our recommendation scoring works, and what to expect when you purchase through an insurer partner.",
      "",
      "**Sign in** when you're ready — I'll then answer using your questionnaire, recommendations, purchases, and claims.",
    ].join("\n");
  }

  const firstName = input.fullName?.trim().split(/\s+/)[0];

  if (input.role === "user") {
    return [
      firstName ? `Hello, **${input.fullName}**!` : "Hello!",
      "",
      "I'm your ClearClever Assistant. I can explain your **policy recommendations**, compare providers using your questionnaire answers, and help with **purchases** or **claims** on your account.",
      "",
      "Try a suggestion below, attach a policy document or photo, or ask anything in your own words.",
    ].join("\n");
  }

  if (input.role === "insurer") {
    return [
      firstName ? `Hello, **${input.fullName}**!` : "Hello!",
      "",
      "I'm here to help with your **insurer dashboard** — policies, leads, approvals, and performance on ClearClever.",
      "",
      "Ask about your portfolio, recent leads, or how seekers discover your products.",
    ].join("\n");
  }

  if (input.role === "superadmin") {
    return [
      firstName ? `Hello, **${input.fullName}**!` : "Hello!",
      "",
      "You're in **superadmin** mode. I can help with platform-wide analytics, user management, approvals, support volume, and operational questions.",
      "",
      "Ask anything you need to run ClearClever.",
    ].join("\n");
  }

  if (input.role === "admin") {
    return [
      firstName ? `Hello, **${input.fullName}**!` : "Hello!",
      "",
      "I'm your ClearClever admin assistant. I can summarize **platform metrics**, pending policy approvals, and support inquiries.",
      "",
      "What would you like to review?",
    ].join("\n");
  }

  return "Hello! How can I help you with ClearClever today?";
}

export function getAssistantSessionKey(input: {
  isAuthenticated: boolean;
  userId?: string;
  role?: string | null;
}): string {
  if (!input.isAuthenticated) {
    return "guest:anonymous";
  }
  return `auth:${input.userId ?? "unknown"}:${input.role ?? "unknown"}`;
}
