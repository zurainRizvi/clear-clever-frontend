import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { fetchPublicPolicy } from "@/lib/auth-api";
import { ApiError } from "@/lib/api";
import { formatPkr, formatPkrYearly } from "@/lib/format";
import {
  buildFallbackSections,
  countIncludedRows,
} from "@/lib/policy-feature-utils";
import type { PublicPolicy } from "@/lib/types";
import { SEEKER_PAGE_CLASS } from "./seeker-portal-theme";
import { InsurerAvatar } from "./insurer-avatar";
import { PolicyInsurerTrustCard } from "./policy-insurer-trust-card";
import { iconForSection } from "./policy-feature-highlights";
import { loadCompareFlowDraft } from "@/lib/compare-flow-draft";
import { clearPurchaseDraft } from "@/lib/purchase-draft";
import { CoverageBreakdownChart } from "./coverage-breakdown-chart";
import { ClearCleverDisclaimers } from "./clearclever-disclaimers";
import {
  AnimatedFeatureExcluded,
  AnimatedFeatureIncluded,
} from "./animated-feature-indicator";

export function PolicyFeaturesPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const policyId = searchParams.get("policyId");
  const [policy, setPolicy] = useState<PublicPolicy | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!policyId) {
      navigate("/dashboard/compare", { replace: true });
      return;
    }

    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const data = await fetchPublicPolicy(policyId);
        if (!cancelled) setPolicy(data.policy);
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof ApiError ? err.message : "Could not load policy features");
          navigate("/dashboard/compare", { replace: true });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate, policyId]);

  const handleBuy = () => {
    if (!policy) return;
    const draft = loadCompareFlowDraft();
    clearPurchaseDraft();
    navigate("/dashboard/purchase", {
      state: {
        policy,
        answers: draft?.answers ?? {},
        category: policy.category,
        returnTo: `/dashboard/compare/features?policyId=${policy.id}`,
      },
    });
  };

  if (loading) {
    return (
      <div className={`${SEEKER_PAGE_CLASS} flex flex-col items-center py-24 gap-3`}>
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading policy features…</p>
      </div>
    );
  }

  if (!policy) return null;

  const sections = buildFallbackSections(policy);
  const stats = countIncludedRows(sections);

  return (
    <div className={SEEKER_PAGE_CLASS}>
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="text-primary hover:underline mb-6 inline-flex items-center gap-2 text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/8 via-card to-card p-6 sm:p-8 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              Full policy breakdown
            </p>
            <h1 className="text-3xl font-bold">{policy.name}</h1>
            <div className="flex items-center gap-3">
              <InsurerAvatar insurer={policy.insurer} size="md" />
              <span className="text-muted-foreground font-medium">{policy.insurer.companyName}</span>
            </div>
            <p className="text-muted-foreground max-w-2xl leading-relaxed">{policy.coverageSummary}</p>
            <p className="text-sm text-muted-foreground">{policy.description}</p>
          </div>
          <div className="lg:w-72 shrink-0 space-y-3">
            <div className="rounded-xl border border-border bg-background p-4">
              <p className="text-xs text-muted-foreground mb-1">Premium</p>
              <p className="text-2xl font-bold">
                {formatPkrYearly(policy.premiumMonthlyPkr, policy.premiumYearlyPkr)}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Deductible: {formatPkr(policy.deductiblePkr)}
              </p>
            </div>
            <button
              type="button"
              onClick={handleBuy}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90"
            >
              Buy this policy
            </button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6 mb-8">
        <CoverageBreakdownChart {...stats} />
        <div className="rounded-2xl border border-border bg-card p-5 flex flex-col justify-center">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Sparkles className="w-4 h-4" />
            <p className="text-sm font-semibold">Smart summary</p>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {stats.included} benefits included
            {stats.valued > 0 ? `, ${stats.valued} with specific limits or values` : ""}
            {stats.excluded > 0 ? `, and ${stats.excluded} clearly marked as not covered` : ""}.
            Review each section below before you buy.
          </p>
        </div>
      </div>

      <div className="space-y-5 mb-8">
        {sections.map((section, sectionIndex) => {
          const SectionIcon = iconForSection(section);
          return (
            <motion.section
              key={section.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: sectionIndex * 0.04 }}
              className="rounded-2xl border border-border bg-card overflow-hidden"
            >
              <header className="flex items-center gap-3 px-5 py-4 border-b border-border bg-muted/30">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <SectionIcon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-bold text-lg">{section.title}</h2>
                  <p className="text-xs text-muted-foreground">
                    {section.rows.length} detail{section.rows.length === 1 ? "" : "s"}
                  </p>
                </div>
              </header>
              <div className="divide-y divide-border">
                {section.rows.map((row, rowIndex) => (
                  <div
                    key={row.key}
                    className={`grid sm:grid-cols-[1fr_auto] gap-2 px-5 py-4 ${
                      rowIndex % 2 === 0 ? "bg-background" : "bg-muted/15"
                    }`}
                  >
                    <span className="text-sm font-medium">{row.label}</span>
                    <span className="text-sm sm:text-right">
                      {row.included === true ? (
                        <span className="inline-flex items-center gap-2 text-success font-medium">
                          <AnimatedFeatureIncluded size={20} />
                          Included
                        </span>
                      ) : row.included === false ? (
                        <span className="inline-flex items-center gap-2 text-muted-foreground">
                          <AnimatedFeatureExcluded size={20} />
                          Not included
                        </span>
                      ) : (
                        <span className="font-semibold text-foreground">{row.value ?? "—"}</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </motion.section>
          );
        })}
      </div>

      <div className="space-y-6 mb-8">
        <PolicyInsurerTrustCard insurer={policy.insurer} />
        <ClearCleverDisclaimers />
      </div>
    </div>
  );
}
