import { Fragment } from "react";
import { ArrowLeft, Check, Loader2, Minus } from "lucide-react";
import { InsurerLogo } from "./insurer-logo";
import {
  findSection,
  getAllSectionIds,
  rowsMatchAcrossColumns,
} from "./policy-feature-sections";
import { formatPkrYearly } from "@/lib/format";
import type { PublicPolicy } from "@/lib/types";
import { SEEKER_PAGE_CLASS } from "./seeker-portal-theme";

interface PolicyCompareMatrixProps {
  policies: PublicPolicy[];
  loading?: boolean;
  onBack: () => void;
  onBuy: (policy: PublicPolicy) => void;
}

function cellContent(
  policy: PublicPolicy,
  sectionId: string,
  rowKey: string
): React.ReactNode {
  const section = findSection(policy.featureSections, sectionId);
  const row = section?.rows.find((item) => item.key === rowKey);
  if (!row) return <span className="text-muted-foreground">—</span>;
  if (row.included === true) {
    return <Check className="w-4 h-4 text-success mx-auto" aria-label="Included" />;
  }
  if (row.included === false) {
    return <Minus className="w-4 h-4 text-muted-foreground/50 mx-auto" aria-label="Not included" />;
  }
  return <span className="text-sm font-medium">{row.value ?? "—"}</span>;
}

export function PolicyCompareMatrix({
  policies,
  loading = false,
  onBack,
  onBuy,
}: PolicyCompareMatrixProps) {
  const navigate = useNavigate();
  const sectionColumns = policies.map((policy) => policy.featureSections ?? []);
  const sectionIds = getAllSectionIds(sectionColumns);

  if (loading) {
    return (
      <div className={`${SEEKER_PAGE_CLASS} flex flex-col items-center py-24 gap-3`}>
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Loading comparison…</p>
      </div>
    );
  }

  return (
    <div className={SEEKER_PAGE_CLASS}>
      <button
        type="button"
        onClick={onBack}
        className="text-primary hover:underline mb-6 inline-flex items-center gap-2 text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to results
      </button>

      <h1 className="text-3xl font-bold mb-2">Compare policies</h1>
      <p className="text-muted-foreground mb-8">
        Side-by-side view of {policies.length} selected plans
      </p>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-muted/40 border-b border-border">
              <th className="text-left p-4 font-semibold min-w-[180px] sticky left-0 bg-muted/40 z-10">
                Feature
              </th>
              {policies.map((policy) => (
                <th key={policy.id} className="p-4 min-w-[200px] align-top">
                  <div className="space-y-3">
                    <InsurerLogo companyName={policy.insurer.companyName} />
                    <p className="font-bold text-base">{policy.name}</p>
                    <p className="text-xs text-muted-foreground">{policy.insurer.companyName}</p>
                    <p className="font-bold text-primary">
                      {formatPkrYearly(policy.premiumMonthlyPkr, policy.premiumYearlyPkr)}
                    </p>
                    <button
                      type="button"
                      onClick={() => onBuy(policy)}
                      className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
                    >
                      Buy
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sectionIds.map((sectionId) => {
              const labelSection = sectionColumns
                .map((sections) => findSection(sections, sectionId))
                .find(Boolean);
              if (!labelSection) return null;

              return (
                <Fragment key={sectionId}>
                  <tr className="bg-primary/5">
                    <td
                      colSpan={policies.length + 1}
                      className="p-3 font-semibold text-foreground sticky left-0"
                    >
                      {labelSection.title}
                    </td>
                  </tr>
                  {labelSection.rows.map((row) => {
                    const allMatch = rowsMatchAcrossColumns(sectionColumns, sectionId, row.key);
                    const rowValues = policies.map((policy) =>
                      cellContent(policy, sectionId, row.key)
                    );
                    if (allMatch && row.included === undefined && policies.length > 1) {
                      return (
                        <tr key={`${sectionId}-${row.key}`} className="border-t border-border">
                          <td className="p-3 font-medium sticky left-0 bg-background">{row.label}</td>
                          <td colSpan={policies.length} className="p-3 text-center">
                            {rowValues[0]}
                          </td>
                        </tr>
                      );
                    }
                    return (
                      <tr key={`${sectionId}-${row.key}`} className="border-t border-border">
                        <td className="p-3 font-medium sticky left-0 bg-background">{row.label}</td>
                        {policies.map((policy, index) => (
                          <td
                            key={`${policy.id}-${row.key}`}
                            className={`p-3 text-center ${
                              !allMatch ? "bg-primary/[0.03]" : ""
                            }`}
                          >
                            {rowValues[index]}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={() => navigate("/dashboard/compare")}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Start a new comparison
        </button>
      </div>
    </div>
  );
}
