import type { ScoredRecommendation } from "./types";

const STORAGE_KEY = "clearclever:compare-flow-draft";

export type CompareFlowDraft = {
  step: "category" | "questionnaire" | "results";
  selectedCategorySlug: string;
  selectedCategoryName: string;
  selectedCategoryAvailable: boolean;
  answers: Record<string, unknown>;
  recommendations: ScoredRecommendation[];
  currentQuestion: number;
};

export function saveCompareFlowDraft(draft: CompareFlowDraft): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Ignore quota errors.
  }
}

export function loadCompareFlowDraft(): CompareFlowDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CompareFlowDraft;
    if (!parsed?.selectedCategorySlug || !parsed.step) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearCompareFlowDraft(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}
