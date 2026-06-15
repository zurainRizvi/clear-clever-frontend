import { Info } from "lucide-react";

const RATING_TERMS = [
  {
    term: "PACRA",
    body: "Pakistan Credit Rating Agency — an independent agency that grades insurers on financial strength and ability to meet long-term obligations.",
  },
  {
    term: "JCR-VIS",
    body: "Japan Credit Rating Agency — VIS Credit Rating Company — provides insurer financial strength and claims-paying ability ratings used across the Pakistani market.",
  },
  {
    term: "AAA and similar grades",
    body: "Higher letter grades (for example AAA, AA, A) generally indicate stronger financial backing. Ratings are published by third parties and can change over time.",
  },
] as const;

export function InsurerRatingDisclaimer({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`rounded-xl border border-border/80 bg-muted/15 dark:bg-muted/10 ${
        compact ? "p-3" : "p-4 sm:p-5"
      }`}
    >
      <div className="flex items-start gap-2.5 mb-3">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" aria-hidden />
        <div>
          <p className="text-sm font-semibold text-foreground">About insurer ratings</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Ratings shown are third-party assessments, not guarantees. Use them alongside policy
            features, premiums, and your own needs.
          </p>
        </div>
      </div>
      <dl className={`grid gap-2 ${compact ? "grid-cols-1" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
        {RATING_TERMS.map((item) => (
          <div
            key={item.term}
            className="rounded-lg border border-border/70 bg-background/70 dark:bg-card/60 px-3 py-2.5"
          >
            <dt className="text-xs font-semibold text-foreground">{item.term}</dt>
            <dd className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.body}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
