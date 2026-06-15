import { useState } from "react";
import { useNavigate } from "react-router";
import {
  GitCompare,
  Heart,
  ListChecks,
  Loader2,
  Sparkles,
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import { SEEKER_PAGE_CLASS } from "./seeker-portal-theme";
import { AnimatedPage } from "../ui/animated-page";
import { useSavedPolicies } from "../saved-policies-context";
import { toast } from "sonner";
import { copy } from "@/lib/copy";
import { formatPkrYearly } from "@/lib/format";
import { ApiError } from "@/lib/api";
import { InsurerLogo } from "./insurer-logo";
import { PolicyFeatureHighlights } from "./policy-feature-highlights";
import { PolicyCompareBar } from "./policy-compare-bar";
import { useAssistantWidget } from "../assistant/assistant-widget-context";
import { explainRecommendation } from "@/lib/assistant-api";
import { useAuth } from "../auth-context";
import type { PublicPolicy } from "@/lib/types";

const MAX_COMPARE = 4;

export function SavedPolicies() {
  const navigate = useNavigate();
  const { savedPolicies, removeSavedPolicy, isLoading } = useSavedPolicies();
  const { openAssistant } = useAssistantWidget();
  const { isAuthenticated, user } = useAuth();
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [explainingId, setExplainingId] = useState<string | null>(null);

  const handleRemove = async (policyId: string) => {
    try {
      await removeSavedPolicy(policyId);
      setCompareIds((prev) => prev.filter((id) => id !== policyId));
      toast.success(copy.saved.removed);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : copy.errors.generic);
    }
  };

  const toggleCompare = (policyId: string) => {
    setCompareIds((prev) => {
      if (prev.includes(policyId)) return prev.filter((id) => id !== policyId);
      if (prev.length >= MAX_COMPARE) {
        toast.message(copy.compare.compareLimit);
        return prev;
      }
      return [...prev, policyId];
    });
  };

  const openCompareView = () => {
    if (compareIds.length < 2) {
      toast.error("Select at least two saved policies to compare");
      return;
    }
    navigate(`/dashboard/compare/view?ids=${compareIds.join(",")}`);
  };

  const handleAnalyze = async (policy: PublicPolicy) => {
    if (!isAuthenticated || user?.role !== "user") {
      toast.message("Sign in as a policy seeker for AI analysis");
      return;
    }
    setExplainingId(policy.id);
    try {
      const result = await explainRecommendation({
        category: policy.category,
        policyId: policy.id,
      });
      openAssistant({
        category: policy.category,
        presetUserMessage: `Analyze ${policy.name} from ${policy.insurer.companyName} and help me decide if it fits my needs.`,
        presetReply: result.reply,
      });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : copy.errors.generic);
    } finally {
      setExplainingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (savedPolicies.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
          <Heart className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-3">{copy.saved.emptyTitle}</h2>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">{copy.saved.emptyBody}</p>
        <button
          type="button"
          onClick={() => navigate("/dashboard/compare")}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all"
        >
          {copy.saved.browseCta}
        </button>
      </div>
    );
  }

  return (
    <AnimatedPage className={SEEKER_PAGE_CLASS}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Saved policies</h1>
        <p className="text-muted-foreground">
          {savedPolicies.length} {savedPolicies.length === 1 ? "policy" : "policies"} saved — compare,
          analyze with AI, or review full features.
        </p>
      </div>

      <div className="space-y-5">
        {savedPolicies.map((policy, index) => {
          const inCompare = compareIds.includes(policy.id);
          return (
            <motion.div
              key={policy.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-all"
            >
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold mb-1">{policy.name}</h3>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-muted-foreground text-sm">{policy.insurer.companyName}</span>
                    <InsurerLogo companyName={policy.insurer.companyName} />
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{policy.coverageSummary}</p>
                  <PolicyFeatureHighlights
                    sections={policy.featureSections}
                    features={policy.features}
                    onViewAll={() =>
                      navigate(`/dashboard/compare/features?policyId=${policy.id}`)
                    }
                  />
                </div>

                <div className="lg:w-64 flex flex-col gap-2">
                  <div className="bg-muted/30 rounded-lg p-4 border border-border mb-1">
                    <p className="text-xs text-muted-foreground mb-1">Premium</p>
                    <p className="text-lg font-bold">
                      {formatPkrYearly(policy.premiumMonthlyPkr, policy.premiumYearlyPkr)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleAnalyze(policy)}
                    disabled={explainingId === policy.id}
                    className="w-full py-2.5 border border-primary/40 text-primary rounded-lg text-sm font-medium inline-flex items-center justify-center gap-2 hover:bg-primary/5"
                  >
                    {explainingId === policy.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    Analyze with AI
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleCompare(policy.id)}
                    className={`w-full py-2.5 border rounded-lg text-sm font-medium inline-flex items-center justify-center gap-2 ${
                      inCompare
                        ? "border-primary text-primary bg-primary/5"
                        : "border-border hover:bg-accent"
                    }`}
                  >
                    <GitCompare className="w-4 h-4" />
                    {inCompare ? "In compare" : "Compare"}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/dashboard/compare/features?policyId=${policy.id}`)
                    }
                    className="w-full py-2.5 border border-border rounded-lg text-sm font-medium inline-flex items-center justify-center gap-2 hover:bg-accent"
                  >
                    <ListChecks className="w-4 h-4" />
                    View all features
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      navigate("/dashboard/purchase", {
                        state: { policy, category: policy.category, returnTo: "/dashboard/saved" },
                      })
                    }
                    className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
                  >
                    Review purchase details
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleRemove(policy.id)}
                    className="w-full py-2.5 border border-border rounded-lg hover:bg-destructive/10 hover:text-destructive transition-all text-sm inline-flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <PolicyCompareBar
        selected={savedPolicies.filter((p) => compareIds.includes(p.id))}
        maxCount={MAX_COMPARE}
        onRemove={toggleCompare}
        onClear={() => setCompareIds([])}
        onCompare={openCompareView}
      />
    </AnimatedPage>
  );
}
