import type { PublicPolicy, ScoredRecommendation, CompareSortOption, CompareResultsFilters } from "@/lib/types";

export function sortRecommendations(
  recommendations: ScoredRecommendation[],
  sort: CompareSortOption
): ScoredRecommendation[] {
  const list = [...recommendations];
  if (sort === "economical") {
    return list.sort((a, b) => a.policy.premiumYearlyPkr - b.policy.premiumYearlyPkr);
  }
  if (sort === "premium") {
    return list.sort((a, b) => b.policy.premiumYearlyPkr - a.policy.premiumYearlyPkr);
  }
  return list;
}

function trackerCategory(policy: PublicPolicy): CompareResultsFilters["trackerFilter"] {
  const trackerRow = policy.featureSections
    ?.find((section) => section.id === "basic_details")
    ?.rows.find((row) => row.key === "tracker");
  const value = trackerRow?.value?.toLowerCase() ?? "";
  if (!value || value.includes("not required")) return "none";
  if (value.includes("mandatory")) return "mandatory";
  if (value.includes("optional")) return "optional";
  return "all";
}

export function filterRecommendations(
  recommendations: ScoredRecommendation[],
  filters: CompareResultsFilters,
  category?: string
): ScoredRecommendation[] {
  return recommendations.filter((rec) => {
    const { policy } = rec;
    if (filters.insurerIds.length > 0 && !filters.insurerIds.includes(policy.insurer.id)) {
      return false;
    }
    if (filters.policyTypes.length > 0) {
      const insurerType = policy.insurer.policyType;
      const matches =
        filters.policyTypes.some((type) => insurerType === type || insurerType === "both");
      if (!matches) return false;
    }
    if (category === "auto" && filters.trackerFilter !== "all") {
      if (trackerCategory(policy) !== filters.trackerFilter) return false;
    }
    return true;
  });
}

export function uniqueInsurersFromRecommendations(
  recommendations: ScoredRecommendation[]
): Array<{ id: string; name: string }> {
  const map = new Map<string, string>();
  for (const rec of recommendations) {
    map.set(rec.policy.insurer.id, rec.policy.insurer.companyName);
  }
  return [...map.entries()].map(([id, name]) => ({ id, name }));
}

export const DEFAULT_COMPARE_FILTERS: CompareResultsFilters = {
  insurerIds: [],
  policyTypes: [],
  trackerFilter: "all",
};
