import type { RankingMethod, ScoredRecommendation } from "./types";

export const HYBRID_RANKING_DISCLAIMER =
  "Rankings combine transparent business rules with a machine-learned model trained on Pakistan insurance journeys. Scores assist comparison — they are not underwriting decisions.";

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
  if (rec.rankingMethod === "hybrid" && typeof rec.ruleScore === "number") {
    return `Hybrid score ${Math.round(rec.score)}`;
  }
  return `Match score ${Math.round(rec.score)}`;
}
