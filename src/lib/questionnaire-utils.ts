import type { PolicyQuestion } from "@/lib/types";

export function isQuestionAnswered(value: unknown): boolean {
  if (value === undefined || value === null || value === "") return false;
  if (Array.isArray(value) && value.length === 0) return false;
  if (typeof value === "number" && !Number.isFinite(value)) return false;
  return true;
}

export function isOtherOption(option: string): boolean {
  return /^other(\s|$| pet| condition)/i.test(option.trim());
}

export function isExclusiveOption(option: string): boolean {
  const normalized = option.trim().toLowerCase();
  if (normalized === "none" || normalized === "no") return true;
  return (
    normalized.startsWith("no ") ||
    normalized.includes("structure only") ||
    normalized.includes("no vehicle") ||
    normalized.includes("no known risk") ||
    normalized.includes("no special security")
  );
}

export function toggleMultiSelection(selected: string[], option: string): string[] {
  if (selected.includes(option)) {
    return selected.filter((item) => item !== option);
  }
  if (isExclusiveOption(option)) {
    return [option];
  }
  return [...selected.filter((item) => !isExclusiveOption(item)), option];
}

export function requiredQuestionsAnswered(
  questions: PolicyQuestion[],
  answers: Record<string, unknown>
): boolean {
  return questions
    .filter((q) => q.required !== false)
    .every((q) => {
      if (!isQuestionAnswered(answers[q.id])) return false;
      const selected = answers[q.id];
      if (Array.isArray(selected) && selected.some((opt) => isOtherOption(String(opt)))) {
        const other = answers[`${q.id}_other`];
        if (typeof other !== "string" || other.trim().length < 2) return false;
      }
      if (typeof selected === "string" && isOtherOption(selected)) {
        const other = answers[`${q.id}_other`];
        if (typeof other !== "string" || other.trim().length < 2) return false;
      }
      return true;
    });
}

export function firstUnansweredQuestionIndex(
  questions: PolicyQuestion[],
  answers: Record<string, unknown>
): number {
  const index = questions.findIndex((question) => {
    if (question.required === false) return false;
    return !isQuestionAnswered(answers[question.id]);
  });
  return index === -1 ? 0 : index;
}

export function otherDetailKey(questionId: string): string {
  return `${questionId}_other`;
}

/** Keep only answers that belong to the target category's question set. */
export function filterAnswersForQuestions(
  answers: Record<string, unknown>,
  questions: PolicyQuestion[]
): Record<string, unknown> {
  const ids = new Set(questions.map((question) => question.id));
  const filtered: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(answers)) {
    if (key.endsWith("_other")) {
      const baseId = key.replace(/_other$/, "");
      if (ids.has(baseId)) filtered[key] = value;
      continue;
    }
    if (ids.has(key)) filtered[key] = value;
  }

  return filtered;
}

/** Loose match for stored vs option labels (case / whitespace). */
export function isOptionSelected(value: unknown, option: string): boolean {
  const normalizedOption = option.trim().toLowerCase();
  if (Array.isArray(value)) {
    return value.some((item) => String(item).trim().toLowerCase() === normalizedOption);
  }
  if (value === undefined || value === null || value === "") return false;
  return String(value).trim().toLowerCase() === normalizedOption;
}
