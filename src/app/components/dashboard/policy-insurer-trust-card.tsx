import { Award, Building2, ShieldCheck } from "lucide-react";
import { insurerTrustFacts } from "@/lib/policy-feature-utils";
import type { PublicInsurerSummary } from "@/lib/types";
import { InsurerLogo } from "./insurer-logo";

export function PolicyInsurerTrustCard({
  insurer,
  compact = false,
}: {
  insurer: PublicInsurerSummary;
  compact?: boolean;
}) {
  const facts = insurerTrustFacts(insurer);

  if (facts.length === 0) {
    return (
      <div className={`rounded-xl border border-border bg-card ${compact ? "p-3" : "p-4"}`}>
        <div className="flex items-center gap-2 mb-2">
          <InsurerLogo companyName={insurer.companyName} />
          <p className="text-sm font-semibold">{insurer.companyName}</p>
        </div>
        <p className="text-sm text-muted-foreground">
          Licensed insurer on ClearClever. Ratings will appear here when published.
        </p>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-border bg-gradient-to-br from-primary/5 to-transparent ${compact ? "p-3" : "p-4"}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Building2 className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Why trust this insurer
          </p>
          <div className="flex items-center gap-2">
            <InsurerLogo companyName={insurer.companyName} />
            <p className="text-sm font-semibold">{insurer.companyName}</p>
          </div>
        </div>
      </div>
      <div className={`grid gap-2 ${compact ? "grid-cols-1" : "sm:grid-cols-2"}`}>
        {facts.map((fact) => (
          <div
            key={fact.label}
            className="rounded-lg border border-border/80 bg-background/80 p-3"
            title={fact.hint}
          >
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              {fact.label.includes("Financial") ? (
                <Award className="w-3.5 h-3.5 text-primary" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              )}
              {fact.label}
            </div>
            <p className="text-base font-bold text-foreground">{fact.value}</p>
            {!compact ? (
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{fact.hint}</p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
