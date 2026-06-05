export type CrossCategorySuggestion = {
  key: string;
  slug: "home" | "auto" | "life" | "pet";
  label: string;
  reason: string;
  presetAnswers?: Record<string, unknown>;
  score?: number;
};

function answerText(value: unknown): string {
  return Array.isArray(value) ? value.join(" ").toLowerCase() : String(value ?? "").toLowerCase();
}

function answerTokens(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => answerTokens(item));
  }
  if (typeof value === "string" && value.trim()) {
    return [value.toLowerCase()];
  }
  return [];
}

function answerHasPositiveSignal(value: unknown, reject = ["no", "none"]): boolean {
  const values = Array.isArray(value) ? value.map(answerText) : [answerText(value)];
  return values.some(
    (item) => item.trim() !== "" && !reject.some((word) => item.includes(word))
  );
}

function collectAnswerText(
  answers: Record<string, unknown>,
  keys: string[]
): string {
  return Object.entries(answers)
    .filter(([key, value]) => keys.includes(key) && answerHasPositiveSignal(value))
    .map(([, value]) => answerText(value))
    .join(" ");
}

export function buildCrossCategorySuggestions(
  answers: Record<string, unknown>,
  currentCategory?: string
): CrossCategorySuggestion[] {
  const suggestions: CrossCategorySuggestion[] = [];
  const vehicleSignal = collectAnswerText(answers, [
    "owns_vehicle",
    "vehicle_type",
    "vehicle_make_model",
  ]);

  const hasMotorcycle =
    vehicleSignal.includes("motorcycle") || vehicleSignal.includes("bike");
  const hasCar =
    vehicleSignal.includes("car") ||
    vehicleSignal.includes("suv") ||
    vehicleSignal.includes("4x4") ||
    vehicleSignal.includes("private car") ||
    vehicleSignal.includes("commercial");

  if (currentCategory !== "auto" && hasMotorcycle) {
    suggestions.push({
      key: "motorcycle",
      slug: "auto",
      label: "Motorcycle insurance",
      reason: "Based on the motorcycle or bike details you shared",
      presetAnswers: { vehicle_type: "Motorcycle" },
      score: 92,
    });
  }
  if (currentCategory !== "auto" && hasCar) {
    suggestions.push({
      key: "vehicle",
      slug: "auto",
      label: "Vehicle insurance",
      reason: "Based on the car or SUV details you shared",
      presetAnswers: { vehicle_type: "Private car" },
      score: 90,
    });
  }

  const petSignal = collectAnswerText(answers, ["has_pet", "pet_type"]);
  if (currentCategory !== "pet") {
    if (petSignal.includes("dog")) {
      suggestions.push({
        key: "pet-dog",
        slug: "pet",
        label: "Dog insurance",
        reason: "Tailored vet and accident cover for dogs",
        presetAnswers: { pet_type: "Dog" },
        score: 88,
      });
    }
    if (petSignal.includes("cat")) {
      suggestions.push({
        key: "pet-cat",
        slug: "pet",
        label: "Cat insurance",
        reason: "Wellness and surgery cover for cats",
        presetAnswers: { pet_type: "Cat" },
        score: 86,
      });
    }
    if (petSignal.includes("bird")) {
      suggestions.push({
        key: "pet-bird",
        slug: "pet",
        label: "Bird insurance",
        reason: "Specialist cover for avian pets",
        presetAnswers: { pet_type: "Bird" },
        score: 82,
      });
    }
    if (
      petSignal.includes("other pet") &&
      !petSignal.includes("dog") &&
      !petSignal.includes("cat") &&
      !petSignal.includes("bird")
    ) {
      suggestions.push({
        key: "pet-other",
        slug: "pet",
        label: "Pet insurance",
        reason: "Flexible cover for other companion animals",
        presetAnswers: { pet_type: "Other pet" },
        score: 80,
      });
    }
  }

  if (
    currentCategory !== "life" &&
    (answerHasPositiveSignal(answers.family_dependents) ||
      answerHasPositiveSignal(answers.dependents))
  ) {
    suggestions.push({
      key: "life",
      slug: "life",
      label: "Life insurance",
      reason: "Family or dependent protection detected in your answers",
      score: 88,
    });
  }

  if (
    currentCategory !== "home" &&
    (answerHasPositiveSignal(answers.home_owner) ||
      answerHasPositiveSignal(answers.ownership_status))
  ) {
    suggestions.push({
      key: "home",
      slug: "home",
      label: "Home insurance",
      reason: "Home ownership or residence details were detected",
      score: 84,
    });
  }

  return suggestions;
}

export function mergeAnswersFromSources(
  ...sources: Array<Record<string, unknown> | null | undefined>
): Record<string, unknown> {
  const merged: Record<string, unknown> = {};
  for (const source of sources) {
    if (!source) continue;
    for (const [key, value] of Object.entries(source)) {
      if (key.startsWith("contact_")) continue;
      if (value === undefined || value === null || value === "") continue;
      if (Array.isArray(value) && value.length === 0) continue;
      merged[key] = value;
    }
  }
  return merged;
}

export function mergeAnswersByCategory(
  stored: Record<string, Record<string, unknown>>,
  purchaseAnswers: Array<{ category: string; answers: Record<string, unknown> }>
): Record<string, Record<string, unknown>> {
  const merged = { ...stored };
  for (const purchase of purchaseAnswers) {
    const cleaned = mergeAnswersFromSources(purchase.answers);
    if (Object.keys(cleaned).length === 0) continue;
    merged[purchase.category] = mergeAnswersFromSources(merged[purchase.category], cleaned);
  }
  return merged;
}

export function allAnswersFlat(answersByCategory: Record<string, Record<string, unknown>>) {
  return mergeAnswersFromSources(...Object.values(answersByCategory));
}
