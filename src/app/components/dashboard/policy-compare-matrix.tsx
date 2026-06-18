import { Fragment } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, GitCompare, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { InsurerLogo } from "./insurer-logo";
import {
  findSection,
  getAllSectionIds,
  rowsMatchAcrossColumns,
} from "./policy-feature-sections";
import { buildFallbackSections } from "@/lib/policy-feature-utils";
import { formatPkr, formatPkrYearly } from "@/lib/format";
import type { PublicPolicy, PolicyFeatureSection } from "@/lib/types";
import { SEEKER_PAGE_CLASS } from "./seeker-portal-theme";
import {
  AnimatedFeatureExcluded,
  AnimatedFeatureIncluded,
} from "./animated-feature-indicator";
import { ClearCleverDisclaimers } from "./clearclever-disclaimers";

interface PolicyCompareMatrixProps {
  policies: PublicPolicy[];
  loading?: boolean;
  onBack: () => void;
  onBuy: (policy: PublicPolicy) => void;
}

function cellContent(
  policy: PublicPolicy,
  sectionId: string,
  rowKey: string,
  sectionsByPolicy: Map<string, PolicyFeatureSection[]>
): React.ReactNode {
  const sections = sectionsByPolicy.get(policy.id) ?? [];
  const section = findSection(sections, sectionId);
  const row = section?.rows.find((item) => item.key === rowKey);
  if (!row) {
    return <AnimatedFeatureExcluded />;
  }
  if (row.included === true) {
    return <AnimatedFeatureIncluded />;
  }
  if (row.included === false) {
    return <AnimatedFeatureExcluded />;
  }
  return <span className="text-sm font-medium">{row.value ?? "—"}</span>;
}

const FEATURE_COLUMN_CLASS =
  "p-4 font-semibold sticky left-0 z-10 bg-muted/60 dark:bg-muted/40 backdrop-blur text-center align-middle";

export function PolicyCompareMatrix({
  policies,
  loading = false,
  onBack,
  onBuy,
}: PolicyCompareMatrixProps) {
  const navigate = useNavigate();

  const sectionsByPolicy = new Map(
    policies.map((policy) => [policy.id, buildFallbackSections(policy)])
  );
  const sectionColumns = policies.map((policy) => sectionsByPolicy.get(policy.id) ?? []);
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

      <div className="flex items-center gap-2 text-primary text-sm font-medium mb-2">
        <GitCompare className="w-4 h-4" />
        Side-by-side comparison
      </div>
      <h1 className="text-3xl font-bold mb-2">Compare policies</h1>
      <p className="text-muted-foreground mb-8">
        Review {policies.length} plans feature by feature. Highlighted rows show differences.
      </p>

      {sectionIds.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
          No structured features available for these policies yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border shadow-sm">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-primary/10 to-muted/30 border-b border-border">
                <th className={`${FEATURE_COLUMN_CLASS} min-w-[200px] border-r border-border/60`}>
                  <span className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                    Features
                  </span>
                  <span className="block text-[11px] font-medium text-muted-foreground mt-1 normal-case tracking-normal">
                    What each plan covers
                  </span>
                </th>
                {policies.map((policy, index) => (
                  <th key={policy.id} className="p-4 min-w-[220px] align-top">
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="space-y-3 rounded-xl border border-border bg-card p-4"
                    >
                      <div className="flex justify-center">
                        <InsurerLogo
                          insurer={policy.insurer}
                          className="h-14 w-28 rounded-lg border border-border bg-background p-1.5"
                        />
                      </div>
                      <p className="font-bold text-base leading-snug">{policy.name}</p>
                      <p className="text-xs text-muted-foreground">{policy.insurer.companyName}</p>
                      <p className="font-bold text-primary">
                        {formatPkrYearly(policy.premiumMonthlyPkr, policy.premiumYearlyPkr)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Deductible {formatPkr(policy.deductiblePkr)}
                      </p>
                      <button
                        type="button"
                        onClick={() => onBuy(policy)}
                        className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
                      >
                        Buy
                      </button>
                    </motion.div>
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
                    <tr className="bg-primary/8">
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
                        cellContent(policy, sectionId, row.key, sectionsByPolicy)
                      );
                      if (allMatch && row.included === undefined && policies.length > 1) {
                        return (
                          <tr key={`${sectionId}-${row.key}`} className="border-t border-border">
                            <td
                              className={`${FEATURE_COLUMN_CLASS} border-r border-border/50 text-sm sm:text-base font-semibold`}
                            >
                              {row.label}
                            </td>
                            <td colSpan={policies.length} className="p-3 text-center">
                              {rowValues[0]}
                            </td>
                          </tr>
                        );
                      }
                      return (
                        <tr
                          key={`${sectionId}-${row.key}`}
                          className={`border-t border-border ${!allMatch ? "bg-primary/[0.04]" : ""}`}
                        >
                          <td
                            className={`${FEATURE_COLUMN_CLASS} border-r border-border/50 text-sm sm:text-base font-semibold`}
                          >
                            {row.label}
                          </td>
                          {policies.map((policy, index) => (
                            <td key={`${policy.id}-${row.key}`} className="p-3 text-center">
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
      )}

      <div className="mt-8 space-y-6">
        <ClearCleverDisclaimers />
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => navigate("/dashboard/compare")}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Start a new comparison
          </button>
        </div>
      </div>
    </div>
  );
}
