export type PasswordStrengthLevel = "weak" | "fair" | "strong";

export type PasswordStrength = {
  level: PasswordStrengthLevel;
  score: number;
  label: string;
  barClass: string;
  checks: Array<{ id: string; label: string; passed: boolean }>;
};

const CHECKS = [
  { id: "length", label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { id: "upper", label: "One uppercase letter (A–Z)", test: (p: string) => /[A-Z]/.test(p) },
  { id: "lower", label: "One lowercase letter (a–z)", test: (p: string) => /[a-z]/.test(p) },
  { id: "number", label: "One number (0–9)", test: (p: string) => /[0-9]/.test(p) },
  {
    id: "chars",
    label: "Letters and numbers only (no symbols)",
    test: (p: string) => p.length === 0 || /^[A-Za-z0-9]+$/.test(p),
  },
] as const;

export function evaluatePasswordStrength(password: string): PasswordStrength {
  const checks = CHECKS.map((check) => ({
    id: check.id,
    label: check.label,
    passed: check.test(password),
  }));
  const passedCount = checks.filter((check) => check.passed).length;
  const score = password.length === 0 ? 0 : Math.round((passedCount / checks.length) * 100);

  if (password.length === 0) {
    return {
      level: "weak",
      score: 0,
      label: "Enter a password",
      barClass: "bg-muted",
      checks,
    };
  }

  if (passedCount >= checks.length) {
    return {
      level: "strong",
      score,
      label: "Strong password",
      barClass: "bg-emerald-500",
      checks,
    };
  }

  if (passedCount >= 3) {
    return {
      level: "fair",
      score,
      label: "Fair — almost there",
      barClass: "bg-amber-500",
      checks,
    };
  }

  return {
    level: "weak",
    score,
    label: "Weak password",
    barClass: "bg-red-500",
    checks,
  };
}

export function isSignupPasswordValid(password: string): boolean {
  return evaluatePasswordStrength(password).level === "strong";
}
