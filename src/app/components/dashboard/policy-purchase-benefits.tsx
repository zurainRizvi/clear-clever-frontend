import { CheckCircle2, FileText, Shield } from "lucide-react";
import { formatPkr } from "@/lib/format";
import { filterMeaningfulSections } from "@/lib/policy-feature-utils";
import type { PolicyFeatureSection } from "@/lib/types";
import { PolicyFeatureSections } from "./policy-feature-sections";
import { PolicyInsurerTrustCard } from "./policy-insurer-trust-card";
import type { PublicInsurerSummary } from "@/lib/types";

interface PolicyPurchaseBenefitsProps {
  featureSections?: PolicyFeatureSection[];
  features?: string[];
  insurer?: PublicInsurerSummary;
  documentSummary?: {
    policyNumber: string;
    issuedAt: string;
    coverage: string;
  };
  deductiblePkr?: number;
}

export function PolicyPurchaseBenefits({
  featureSections,
  features = [],
  insurer,
  documentSummary,
  deductiblePkr,
}: PolicyPurchaseBenefitsProps) {
  const meaningfulSections = filterMeaningfulSections(featureSections);

  return (
    <div className="space-y-4">
      {meaningfulSections.length > 0 ? (
        <PolicyFeatureSections sections={meaningfulSections} compact />
      ) : features.length > 0 ? (
        <ul className="space-y-2">
          {features.map((feature) => (
            <li key={feature} className="flex gap-2 text-sm rounded-lg border border-border bg-background p-3">
              <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          Coverage details will appear here once your policy is fully activated.
        </div>
      )}

      {documentSummary ? (
        <div className="rounded-xl border border-border bg-background p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold">Your policy documents</p>
          </div>
          <dl className="grid sm:grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Policy number</dt>
              <dd className="font-semibold">{documentSummary.policyNumber}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Issued on</dt>
              <dd className="font-semibold">
                {new Date(documentSummary.issuedAt).toLocaleDateString()}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">Coverage summary</dt>
              <dd className="font-medium">{documentSummary.coverage}</dd>
            </div>
            {deductiblePkr != null ? (
              <div>
                <dt className="text-muted-foreground">Deductible (you pay first)</dt>
                <dd className="font-semibold">{formatPkr(deductiblePkr)}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      ) : null}

      {insurer ? (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold">Insurer credibility</p>
          </div>
          <PolicyInsurerTrustCard insurer={insurer} compact />
        </div>
      ) : null}
    </div>
  );
}
