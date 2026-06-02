import type { UserRole } from "@/lib/types";
import type { LucideIcon } from "lucide-react";
import { FileText, ShieldCheck, Star, BarChart3, Users, HelpCircle } from "lucide-react";

export type SuggestionChip = {
  id: string;
  text: string;
  prompt: string;
  icon: LucideIcon;
};

export function getAssistantSuggestions(input: {
  role: UserRole | null;
  isAuthenticated: boolean;
  category?: string | null;
}): SuggestionChip[] {
  if (!input.isAuthenticated) {
    return [
      {
        id: "compare",
        text: "Compare top providers",
        prompt: "How does ClearClever compare insurance providers in Pakistan?",
        icon: ShieldCheck,
      },
      {
        id: "how",
        text: "How recommendations work",
        prompt: "How does ClearClever score and recommend policies?",
        icon: HelpCircle,
      },
      {
        id: "categories",
        text: "Insurance categories",
        prompt: "What insurance categories does ClearClever support?",
        icon: FileText,
      },
    ];
  }

  if (input.role === "user") {
    const cat = input.category ?? "home";
    return [
      {
        id: "top",
        text: "Compare top providers",
        prompt: "Based on my profile, which insurance providers are the best match for me?",
        icon: ShieldCheck,
      },
      {
        id: "recs",
        text: "Show my recommendations",
        prompt: "Summarize my top policy recommendations from my questionnaire.",
        icon: FileText,
      },
      {
        id: "cat",
        text: `Best for ${cat} insurance`,
        prompt: `What are my best ${cat} insurance options and why?`,
        icon: Star,
      },
    ];
  }

  if (input.role === "insurer") {
    return [
      {
        id: "leads",
        text: "Summarize my leads",
        prompt: "Summarize my recent leads and their status.",
        icon: Users,
      },
      {
        id: "policies",
        text: "My policy portfolio",
        prompt: "Give me an overview of my policies on ClearClever.",
        icon: FileText,
      },
      {
        id: "pending",
        text: "Pending approvals",
        prompt: "How many of my policies are pending approval?",
        icon: ShieldCheck,
      },
    ];
  }

  if (input.role === "superadmin") {
    return [
      {
        id: "platform",
        text: "Platform overview",
        prompt: "Give me a platform health and usage overview.",
        icon: BarChart3,
      },
      {
        id: "users",
        text: "User breakdown",
        prompt: "Break down users by role and what actions I should prioritize.",
        icon: Users,
      },
      {
        id: "approvals",
        text: "Pending approvals",
        prompt: "What policy approvals are pending and what should I review first?",
        icon: ShieldCheck,
      },
    ];
  }

  return [
    {
      id: "analytics",
      text: "Platform analytics",
      prompt: "Summarize current platform metrics for admin review.",
      icon: BarChart3,
    },
    {
      id: "support",
      text: "Support inquiries",
      prompt: "How many open support inquiries do we have?",
      icon: HelpCircle,
    },
    {
      id: "approvals",
      text: "Policy approvals",
      prompt: "What is the status of pending policy approvals?",
      icon: ShieldCheck,
    },
  ];
}
