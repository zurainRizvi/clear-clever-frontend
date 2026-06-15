import type { PublicPolicy } from "./types";

const CATEGORY_LABELS: Record<string, string> = {
  home: "home",
  auto: "auto",
  life: "life",
  pet: "pet",
};

export function categoryDisplayLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category.replace(/_/g, " ");
}

export function policiesShareCategory(policies: PublicPolicy[]): boolean {
  if (policies.length < 2) return true;
  const first = policies[0]?.category;
  return policies.every((policy) => policy.category === first);
}

export function getCompareCategoryConflict(
  selectedPolicies: PublicPolicy[],
  candidate: PublicPolicy
): string | null {
  if (selectedPolicies.length === 0) return null;
  const baseCategory = selectedPolicies[0]?.category;
  if (!baseCategory || candidate.category === baseCategory) return null;
  return `Select policies from the same category to compare. You already have ${categoryDisplayLabel(baseCategory)} policies selected.`;
}
