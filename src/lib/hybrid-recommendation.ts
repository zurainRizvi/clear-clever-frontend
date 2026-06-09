import type { RankingMethod, ScoredRecommendation } from "./types";

export const HYBRID_RANKING_DISCLAIMER =
  "Recommendations are based on your answers and ClearClever's coverage analysis. They help you compare — they are not underwriting decisions.";

export function isHybridRanking(
  rankingMethod?: RankingMethod,
  recommendations?: ScoredRecommendation[]
): boolean {
  if (rankingMethod === "hybrid") return true;
  return recommendations?.some((rec) => rec.rankingMethod === "hybrid") ?? false;
}

export function hybridTopPicks(recommendations: ScoredRecommendation[], limit = 3): ScoredRecommendation[] {
  if (recommendations.length === 0) return [];
  const hybrid = isHybridRanking(undefined, recommendations);
  if (!hybrid) {
    return [...recommendations].sort((a, b) => b.score - a.score).slice(0, limit);
  }
  return [...recommendations]
    .filter((rec) => typeof rec.mlRank === "number")
    .sort((a, b) => (a.mlRank ?? 99) - (b.mlRank ?? 99))
    .slice(0, limit);
}

export function formatMlConfidence(value?: number): string {
  if (typeof value !== "number") return "—";
  return `${value.toFixed(1)}%`;
}

export function hybridScoreLabel(rec: ScoredRecommendation): string {
  if (rec.score >= 75) return "Excellent match";
  if (rec.score >= 55) return "Good fit";
  return "Worth comparing";
}
