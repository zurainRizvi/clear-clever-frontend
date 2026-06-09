import type { AnswerHighlight, ScoredRecommendation } from "./types";

export type MatchTier = "excellent" | "good" | "fair";

export function matchTierFromScore(score: number): MatchTier {
  if (score >= 75) return "excellent";
  if (score >= 55) return "good";
  return "fair";
}

export function matchTierLabel(tier: MatchTier): string {
  if (tier === "excellent") return "Excellent match";
  if (tier === "good") return "Good fit";
  return "Worth comparing";
}

export function matchTierDescription(tier: MatchTier): string {
  if (tier === "excellent") {
    return "This policy aligns closely with what you told us about your needs.";
  }
  if (tier === "good") {
    return "A solid option based on your questionnaire answers.";
  }
  return "Compare coverage details to see if this meets your priorities.";
}

/** User-facing label — no raw scores or ML percentages. */
export function recommendationSummaryLabel(rec: ScoredRecommendation): string {
  return matchTierLabel(matchTierFromScore(rec.score));
}

export function collectMatchBullets(rec: ScoredRecommendation, limit = 4): string[] {
  const fromHighlights = (rec.answerHighlights ?? []).map(
    (h) => `${h.userAnswer} → ${h.policyAlignment}`
  );
  const merged = [...fromHighlights, ...rec.matchReasons];
  const unique: string[] = [];
  for (const item of merged) {
    const trimmed = item.trim();
    if (trimmed && !unique.includes(trimmed)) unique.push(trimmed);
  }
  return unique.slice(0, limit);
}

export function formatAnswerHighlight(h: AnswerHighlight): string {
  return `${h.userAnswer} — ${h.policyAlignment}`;
}
