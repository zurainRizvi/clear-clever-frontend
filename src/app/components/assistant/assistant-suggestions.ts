import type { UserRole } from "@/lib/types";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  FileText,
  HelpCircle,
  LayoutGrid,
  PieChart,
  ShieldCheck,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";

export type SuggestionChip = {
  id: string;
  text: string;
  prompt: string;
  icon: LucideIcon;
};

/** Instructs Gemini to emit renderable visual blocks (see assistantPrompts.ts). */
const CHART_BLOCK =
  "Include a ```chart fenced JSON block (bar, line, or pie) using only data allowed for this audience.";
const STATS_BLOCK =
  "Include a ```stats fenced JSON block with 3–4 KPI items using only data allowed for this audience.";
const COMPARE_BLOCK =
  "Include a ```compare fenced JSON block with side-by-side cards using only data allowed for this audience.";

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
        id: "categories-chart",
        text: "Categories chart",
        prompt: `Give a guest-friendly overview of ClearClever's five insurance categories (home, auto, life, pet, others). ${CHART_BLOCK} Use illustrative PKR premium ranges clearly labeled as examples, not personal quotes.`,
        icon: BarChart3,
      },
      {
        id: "categories-compare",
        text: "Compare categories",
        prompt: `Compare home, auto, life, pet, and others insurance at a high level for someone new to ClearClever. ${COMPARE_BLOCK} Label every card as a general category guide, not a personal recommendation.`,
        icon: LayoutGrid,
      },
      {
        id: "scoring-stats",
        text: "How scoring works",
        prompt: `Explain how ClearClever scores and ranks policies for seekers. ${STATS_BLOCK} Use illustrative example metrics (e.g. coverage fit, premium band, insurer rating) — not my personal data.`,
        icon: TrendingUp,
      },
      {
        id: "how",
        text: "How recommendations work",
        prompt: "How does ClearClever score and recommend policies step by step?",
        icon: HelpCircle,
      },
      {
        id: "categories",
        text: "Insurance categories",
        prompt: "What insurance categories does ClearClever support and who are they for?",
        icon: FileText,
      },
    ];
  }

  if (input.role === "user") {
    const cat = input.category ?? "home";
    return [
      {
        id: "chart-premiums",
        text: "Chart my premiums",
        prompt: `Using my Context JSON, chart my top policy recommendations by monthly premium (PKR). ${CHART_BLOCK} Add a short explanation beneath the chart.`,
        icon: BarChart3,
      },
      {
        id: "compare-visual",
        text: "Compare policies visually",
        prompt: `Compare my top 3 ${cat} policy recommendations side by side. ${COMPARE_BLOCK} Highlight premium, score, and one key coverage point per card.`,
        icon: LayoutGrid,
      },
      {
        id: "stats-best-match",
        text: "Key stats — best match",
        prompt: `Summarize my best-matching policy and top alternatives. ${STATS_BLOCK} Include score, premium, category, and insurer where available from Context JSON.`,
        icon: TrendingUp,
      },
      {
        id: "recs",
        text: "Show my recommendations",
        prompt: "Summarize my top policy recommendations from my questionnaire with clear next steps.",
        icon: FileText,
      },
      {
        id: "cat",
        text: `Best for ${cat} insurance`,
        prompt: `What are my best ${cat} insurance options and why? ${CHART_BLOCK} if premium comparison helps.`,
        icon: Star,
      },
      {
        id: "top",
        text: "Compare top providers",
        prompt: "Based on my profile, which insurance providers are the best match for me?",
        icon: ShieldCheck,
      },
    ];
  }

  if (input.role === "insurer") {
    return [
      {
        id: "leads-chart",
        text: "Chart my leads",
        prompt: `Summarize my leads pipeline from Context JSON. ${CHART_BLOCK} Show counts or status breakdown where data exists.`,
        icon: BarChart3,
      },
      {
        id: "portfolio-stats",
        text: "Portfolio stats",
        prompt: `Give me a KPI snapshot of my ClearClever portfolio. ${STATS_BLOCK} Use policies, approvals, and lead metrics from Context JSON only.`,
        icon: TrendingUp,
      },
      {
        id: "policies-compare",
        text: "Compare my policies",
        prompt: `Compare my active policies on ClearClever visually. ${COMPARE_BLOCK} Include premium band, category, and approval status per card.`,
        icon: LayoutGrid,
      },
      {
        id: "leads",
        text: "Summarize my leads",
        prompt: "Summarize my recent leads and their status with suggested follow-ups.",
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
        prompt: `How many of my policies are pending approval? ${STATS_BLOCK} if helpful.`,
        icon: ShieldCheck,
      },
    ];
  }

  if (input.role === "superadmin") {
    return [
      {
        id: "platform-chart",
        text: "Platform metrics chart",
        prompt: `Give a platform health and usage overview. ${CHART_BLOCK} Use staffSummary / platform metrics from Context JSON only.`,
        icon: BarChart3,
      },
      {
        id: "platform-stats",
        text: "Platform KPIs",
        prompt: `Show the most important platform KPIs for today. ${STATS_BLOCK} Pull figures from Context JSON; do not invent counts.`,
        icon: TrendingUp,
      },
      {
        id: "users-breakdown",
        text: "Users breakdown chart",
        prompt: `Break down users by role and highlight what I should prioritize. ${CHART_BLOCK} or ${STATS_BLOCK} as appropriate for the data available.`,
        icon: PieChart,
      },
      {
        id: "approvals-compare",
        text: "Compare approval queues",
        prompt: `Compare pending policy approvals and support load visually. ${COMPARE_BLOCK} Use real platform data only.`,
        icon: LayoutGrid,
      },
      {
        id: "platform",
        text: "Platform overview",
        prompt: "Give me a platform health and usage overview in plain language.",
        icon: FileText,
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
      id: "analytics-chart",
      text: "Analytics chart",
      prompt: `Summarize current platform metrics for admin review. ${CHART_BLOCK} Use staffSummary from Context JSON.`,
      icon: BarChart3,
    },
    {
      id: "admin-stats",
      text: "Admin KPI dashboard",
      prompt: `Show key admin KPIs I should watch today. ${STATS_BLOCK} Use Context JSON figures only.`,
      icon: TrendingUp,
    },
    {
      id: "support-compare",
      text: "Compare support load",
      prompt: `Compare open support inquiries vs pending approvals. ${COMPARE_BLOCK} with real counts from Context JSON.`,
      icon: LayoutGrid,
    },
    {
      id: "analytics",
      text: "Platform analytics",
      prompt: "Summarize current platform metrics for admin review.",
      icon: PieChart,
    },
    {
      id: "support",
      text: "Support inquiries",
      prompt: "How many open support inquiries do we have and what needs attention?",
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
