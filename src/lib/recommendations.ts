import type { ScoredRecommendation } from "./types";
import { copy } from "./copy";

export type RecommendationBadge =
  | "aiRecommended"
  | "bestValue"
  | "lowestPremium"
  | "bestCoverage";

export function assignRecommendationBadges(
  recommendations: ScoredRecommendation[]
): Map<string, RecommendationBadge[]> {
  const badges = new Map<string, RecommendationBadge[]>();

  if (recommendations.length === 0) return badges;

  const add = (policyId: string, badge: RecommendationBadge) => {
    const list = badges.get(policyId) ?? [];
    if (!list.includes(badge)) list.push(badge);
    badges.set(policyId, list);
  };

  const sortedByScore = [...recommendations].sort((a, b) => b.score - a.score);
  add(sortedByScore[0].policy.id, "aiRecommended");

  const lowest = [...recommendations].sort(
    (a, b) => a.policy.premiumMonthlyPkr - b.policy.premiumMonthlyPkr
  )[0];
  add(lowest.policy.id, "lowestPremium");

  const richest = [...recommendations].sort(
    (a, b) => b.policy.features.length - a.policy.features.length
  )[0];
  add(richest.policy.id, "bestCoverage");

  if (recommendations.length > 1) {
    const bestValue = [...recommendations].sort((a, b) => {
      const ratioA = a.score / Math.max(a.policy.premiumMonthlyPkr, 1);
      const ratioB = b.score / Math.max(b.policy.premiumMonthlyPkr, 1);
      return ratioB - ratioA;
    })[0];
    add(bestValue.policy.id, "bestValue");
  }

  return badges;
}

export function badgeLabel(badge: RecommendationBadge): string {
  const labels = copy.compare.badge;
  switch (badge) {
    case "aiRecommended":
      return labels.aiRecommended;
    case "bestValue":
      return labels.bestValue;
    case "lowestPremium":
      return labels.lowestPremium;
    case "bestCoverage":
      return labels.bestCoverage;
    default:
      return "";
  }
}
