import { evaluatePasswordStrength } from "@/lib/password-strength";
import { cn } from "../ui/utils";

export function PasswordStrengthField({
  password,
  showRequirements = false,
  className,
}: {
  password: string;
  showRequirements?: boolean;
  className?: string;
}) {
  const strength = evaluatePasswordStrength(password);
  const barWidth = password.length === 0 ? 0 : Math.max(strength.score, strength.level === "weak" ? 20 : 40);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-300", strength.barClass)}
          style={{ width: `${barWidth}%` }}
        />
      </div>
      <p
        className={cn(
          "text-xs font-medium",
          strength.level === "strong"
            ? "text-emerald-600"
            : strength.level === "fair"
              ? "text-amber-600"
              : "text-muted-foreground"
        )}
      >
        {strength.label}
      </p>
      {showRequirements ? (
        <ul className="space-y-1">
          {strength.checks.map((check) => (
            <li
              key={check.id}
              className={cn(
                "text-xs flex items-center gap-2",
                check.passed ? "text-emerald-600" : "text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full shrink-0",
                  check.passed ? "bg-emerald-500" : "bg-muted-foreground/40"
                )}
              />
              {check.label}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
