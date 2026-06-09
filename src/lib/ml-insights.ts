import type { ClaimMlRisk, MlRiskLevel } from "./insurer-api";
import type { FraudSignal } from "./admin-api";

/** Shown on every AI-assisted surface — enterprise-safe wording. */
export const ML_AI_DISCLAIMER =
  "ClearClever AI provides suggestions to support your review. It does not approve, reject, or block any action. You remain responsible for every decision.";

export interface MlInsightCopy {
  headline: string;
  subtitle: string;
  actionHint: string;
}

const CLAIM_LEVEL_COPY: Record<MlRiskLevel, MlInsightCopy> = {
  low: {
    headline: "Routine review",
    subtitle: "This claim looks consistent with typical approved cases.",
    actionHint: "A standard review is usually enough. Confirm documents and proceed when ready.",
  },
  medium: {
    headline: "Worth a closer look",
    subtitle: "A few details differ from patterns we usually see on approved claims.",
    actionHint: "Review the claim details and any supporting documents before you decide.",
  },
  high: {
    headline: "Review recommended",
    subtitle: "This claim shows signals that often need extra attention before approval.",
    actionHint: "Take time to verify the incident, amount, and customer history before approving.",
  },
};

export function claimRiskInsightCopy(mlRisk: ClaimMlRisk): MlInsightCopy {
  const base = CLAIM_LEVEL_COPY[mlRisk.level];
  const approvalPct = Math.round(mlRisk.approvalProbability * 100);
  return {
    ...base,
    subtitle: `${base.subtitle} Estimated approval likelihood: ${approvalPct}%.`,
  };
}

export function claimRiskPriorityLabel(level: MlRiskLevel): string {
  if (level === "low") return "Low priority";
  if (level === "medium") return "Medium priority";
  return "High priority";
}

export function fraudRulePriorityLabel(severity: FraudSignal["severity"]): string {
  const labels: Record<FraudSignal["severity"], string> = {
    low: "Low priority alert",
    medium: "Medium priority alert",
    high: "High priority alert",
    critical: "Critical alert",
  };
  return labels[severity];
}

export function fraudMlInsightCopy(score: number): MlInsightCopy {
  if (score >= 70) {
    return {
      headline: "Strong fraud signal",
      subtitle: `Our model estimates a ${score}% likelihood this pattern is fraudulent.`,
      actionHint: "Investigate promptly. Cross-check accounts, claims, or catalog data linked to this alert.",
    };
  }
  if (score >= 45) {
    return {
      headline: "Moderate concern",
      subtitle: `Our model estimates a ${score}% likelihood this pattern needs follow-up.`,
      actionHint: "Validate the underlying activity before closing this alert.",
    };
  }
  return {
    headline: "Lower concern",
    subtitle: `Our model estimates a ${score}% likelihood of fraud for this pattern.`,
    actionHint: "The rule still fired — a quick check is enough unless something else looks off.",
  };
}

function titleCaseWords(value: string): string {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function humanizeFieldValue(field: string, value: string): string {
  const f = field.trim().toLowerCase();
  const v = value.trim();

  if (f === "claim type") return `Claim type is ${titleCaseWords(v)}`;
  if (f === "policy category") return `Policy category is ${titleCaseWords(v)}`;
  if (f === "city region") return `Customer region is ${titleCaseWords(v)}`;
  if (f === "signal type") return `Matches a ${titleCaseWords(v)} pattern`;
  if (f === "fraud category") return `Flagged under ${titleCaseWords(v)} monitoring`;

  return `${titleCaseWords(f)}: ${titleCaseWords(v)}`;
}

const NUMERIC_FACTOR_COPY: Record<string, string> = {
  "estimated amount pkr": "The requested amount is unusual for similar claims",
  "description length": "The claim description is longer or shorter than typical",
  "days incident to submit": "There was a notable gap between the incident and submission",
  "amount to premium ratio": "The claim amount is high compared to the policy premium",
  "user claims 7d": "This customer filed multiple claims in the last 7 days",
  "user claims 30d": "Claim activity in the last 30 days is above normal",
  "user rejected claims": "This customer has previous rejected claims on record",
  "severity encoded": "Alert severity contributed to the score",
  "account age days": "Account age is a factor in this assessment",
  "related entity count": "The number of linked records raised the score",
};

export function humanizeClaimRiskFactor(factor: string): string {
  const normalized = factor.trim().toLowerCase();
  if (normalized.includes(":")) {
    const [field, value] = factor.split(":");
    if (field && value) return humanizeFieldValue(field, value);
  }
  return NUMERIC_FACTOR_COPY[normalized] ?? `Notable factor: ${titleCaseWords(factor)}`;
}

export function humanizeFraudFactor(factor: string): string {
  const normalized = factor.trim().toLowerCase();
  if (normalized.includes(":")) {
    const [field, value] = factor.split(":");
    if (field && value) return humanizeFieldValue(field, value);
  }
  return NUMERIC_FACTOR_COPY[normalized] ?? `Notable factor: ${titleCaseWords(factor)}`;
}

export function summarizeClaimRiskQueue(claims: { mlRisk?: ClaimMlRisk }[]): {
  withInsights: number;
  highPriority: number;
  mediumPriority: number;
  lowPriority: number;
} {
  const withMl = claims.filter((c) => c.mlRisk);
  return {
    withInsights: withMl.length,
    highPriority: withMl.filter((c) => c.mlRisk?.level === "high").length,
    mediumPriority: withMl.filter((c) => c.mlRisk?.level === "medium").length,
    lowPriority: withMl.filter((c) => c.mlRisk?.level === "low").length,
  };
}

export const CLAIM_INTELLIGENCE_DISCLAIMER =
  "AI-assisted assessment supports your review — it does not approve, reject, or replace human judgment.";

export function damageSeverityLabel(severity: string): string {
  const labels: Record<string, string> = {
    minor: "Minor",
    moderate: "Moderate",
    severe: "Severe",
  };
  return labels[severity] ?? titleCaseWords(severity);
}

export function consistencyCheckLabel(level: string): string {
  if (level === "high") return "Passed";
  if (level === "medium") return "Review suggested";
  return "Failed";
}

export function documentVerificationLabel(report: {
  identity?: { matchesUserProfile: boolean };
  policyDoc?: { matchesLinkedPolicy: boolean };
}): string {
  const checks: boolean[] = [];
  if (report.identity) checks.push(report.identity.matchesUserProfile);
  if (report.policyDoc) checks.push(report.policyDoc.matchesLinkedPolicy);
  if (checks.length === 0) return "Not applicable";
  return checks.every(Boolean) ? "Passed" : "Review required";
}

export function insurerRecommendationLabel(
  recommendation: "standard_review" | "manual_review" | "escalate_review"
): string {
  const labels = {
    standard_review: "Standard Review — Low Risk Indicators",
    manual_review: "Proceed with Manual Review",
    escalate_review: "Escalate for Detailed Review",
  };
  return labels[recommendation];
}

export interface ClaimReadinessSeekerCopy {
  headline: string;
  subtitle: string;
}

export function claimReadinessSeekerCopy(score: number): ClaimReadinessSeekerCopy {
  if (score >= 85) {
    return {
      headline: "Looking good — ready to submit",
      subtitle:
        "Your documents and description appear consistent. Your insurer can review this with confidence.",
    };
  }
  if (score >= 60) {
    return {
      headline: "Almost there — a few items to double-check",
      subtitle:
        "Most details look fine, but reviewing the flagged items below may speed up insurer approval.",
    };
  }
  return {
    headline: "More evidence may help",
    subtitle:
      "We found gaps or inconsistencies. Consider updating your description or uploading clearer photos before submitting.",
  };
}

export function insurerRecommendationSeekerHint(
  recommendation: "standard_review" | "manual_review" | "escalate_review"
): string {
  const hints = {
    standard_review:
      "Your claim aligns with typical submissions. Your insurer will still perform their standard review.",
    manual_review:
      "Your insurer may want to verify a few details. Submitting now is fine — the report highlights what to expect.",
    escalate_review:
      "Some signals suggest extra review. You can still submit, but fixing flagged items first is recommended.",
  };
  return hints[recommendation];
}
