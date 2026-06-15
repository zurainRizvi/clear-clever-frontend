import type { PolicyFeatureSection, PublicInsurerSummary, PublicPolicy } from "./types";

export const COMPANY_PROFILE_SECTION_ID = "company_profile";

export function filterMeaningfulSections(
  sections: PolicyFeatureSection[] | undefined
): PolicyFeatureSection[] {
  return (sections ?? []).filter((section) => section.id !== COMPANY_PROFILE_SECTION_ID);
}

export function countIncludedRows(sections: PolicyFeatureSection[]): {
  included: number;
  excluded: number;
  valued: number;
  total: number;
} {
  let included = 0;
  let excluded = 0;
  let valued = 0;

  for (const section of sections) {
    for (const row of section.rows) {
      if (row.included === true) included += 1;
      else if (row.included === false) excluded += 1;
      else if (row.value) valued += 1;
    }
  }

  return { included, excluded, valued, total: included + excluded + valued };
}

export function buildFallbackSections(policy: PublicPolicy): PolicyFeatureSection[] {
  const meaningful = filterMeaningfulSections(policy.featureSections);
  if (meaningful.length > 0) return meaningful;

  if (policy.features.length === 0) return [];

  return [
    {
      id: "highlights",
      title: "Policy highlights",
      rows: policy.features.map((feature, index) => ({
        key: `feature_${index}`,
        label: feature,
        included: true,
      })),
    },
  ];
}

export function insurerTrustFacts(insurer: PublicInsurerSummary): Array<{
  label: string;
  value: string;
  hint: string;
}> {
  const facts: Array<{ label: string; value: string; hint: string }> = [];

  if (insurer.pacraRating && insurer.pacraRating !== "N/A") {
    facts.push({
      label: "Financial strength",
      value: insurer.pacraRating,
      hint: "PACRA credit rating — higher grades mean stronger financial backing for claims.",
    });
  }

  if (insurer.jcrVisRating && insurer.jcrVisRating !== "N/A") {
    facts.push({
      label: "Claims reliability",
      value: insurer.jcrVisRating,
      hint: "JCR-VIS insurer rating — reflects claims-paying ability and service quality.",
    });
  }

  if (insurer.operationalSince) {
    const years = new Date().getFullYear() - insurer.operationalSince;
    facts.push({
      label: "Experience in Pakistan",
      value: `${years}+ years`,
      hint: `Operating since ${insurer.operationalSince} — longer track records can mean more stable service.`,
    });
  }

  if (insurer.policyType) {
    const typeLabel =
      insurer.policyType === "both"
        ? "Conventional & Takaful"
        : insurer.policyType === "islamic"
          ? "Takaful (Islamic)"
          : "Conventional";
    facts.push({
      label: "Product type",
      value: typeLabel,
      hint: "Choose the structure that matches your preference for conventional or Islamic cover.",
    });
  }

  return facts;
}
