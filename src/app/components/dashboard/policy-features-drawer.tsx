import { X } from "lucide-react";
import { PolicyFeatureSections } from "./policy-feature-sections";
import { InsurerLogo } from "./insurer-logo";
import { formatPkrYearly } from "@/lib/format";
import type { PublicPolicy } from "@/lib/types";

interface PolicyFeaturesDrawerProps {
  policy: PublicPolicy | null;
  open: boolean;
  onClose: () => void;
  onBuy?: () => void;
}

export function PolicyFeaturesDrawer({
  policy,
  open,
  onClose,
  onBuy,
}: PolicyFeaturesDrawerProps) {
  if (!open || !policy) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close features panel"
        onClick={onClose}
      />
      <aside className="relative w-full max-w-lg h-full bg-background border-l border-border shadow-xl overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 p-5 border-b border-border bg-background/95 backdrop-blur">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-1">
              Policy features
            </p>
            <h2 className="text-xl font-bold">{policy.name}</h2>
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <InsurerLogo companyName={policy.insurer.companyName} />
              <span>{policy.insurer.companyName}</span>
            </div>
            <p className="mt-2 text-lg font-bold text-foreground">
              {formatPkrYearly(policy.premiumMonthlyPkr, policy.premiumYearlyPkr)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg border border-border hover:bg-accent"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-muted-foreground">{policy.coverageSummary}</p>
          <PolicyFeatureSections sections={policy.featureSections ?? []} />
          {onBuy ? (
            <button
              type="button"
              onClick={onBuy}
              className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Buy this policy
            </button>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
