import type { CategorySlug } from "./types";

const VALID_SLUGS = new Set<string>(["home", "auto", "life", "pet", "others"]);

type ResolvedCategoryNav = {
  slug: CategorySlug;
  presetAnswers?: Record<string, unknown>;
};

const CATEGORY_ALIASES: Record<string, ResolvedCategoryNav> = {
  motorcycle: { slug: "auto", presetAnswers: { vehicle_type: "Motorcycle" } },
  vehicle: { slug: "auto", presetAnswers: { vehicle_type: "Private car" } },
  car: { slug: "auto", presetAnswers: { vehicle_type: "Private car" } },
  bike: { slug: "auto", presetAnswers: { vehicle_type: "Motorcycle" } },
  "pet-dog": { slug: "pet", presetAnswers: { pet_type: "Dog" } },
  "pet-cat": { slug: "pet", presetAnswers: { pet_type: "Cat" } },
  "pet-bird": { slug: "pet", presetAnswers: { pet_type: "Bird" } },
  "pet-other": { slug: "pet", presetAnswers: { pet_type: "Other pet" } },
};

export function resolveCategoryNav(
  rawCategory: string,
  presetAnswers?: Record<string, unknown>
): ResolvedCategoryNav {
  const key = rawCategory.trim().toLowerCase();
  const alias = CATEGORY_ALIASES[key];
  if (alias) {
    return {
      slug: alias.slug,
      presetAnswers: { ...(alias.presetAnswers ?? {}), ...(presetAnswers ?? {}) },
    };
  }
  if (VALID_SLUGS.has(key)) {
    return { slug: key as CategorySlug, presetAnswers };
  }
  return { slug: key as CategorySlug, presetAnswers };
}

export function mergePresetAnswers(
  ...sources: Array<Record<string, unknown> | null | undefined>
): Record<string, unknown> {
  const merged: Record<string, unknown> = {};
  for (const source of sources) {
    if (!source) continue;
    for (const [key, value] of Object.entries(source)) {
      if (value !== undefined && value !== null && value !== "") {
        merged[key] = value;
      }
    }
  }
  return merged;
}
