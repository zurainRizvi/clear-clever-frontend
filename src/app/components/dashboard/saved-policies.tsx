import { useNavigate } from "react-router";
import { Heart, Trash2, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useSavedPolicies } from "../saved-policies-context";
import { toast } from "sonner";
import { copy } from "@/lib/copy";
import { formatPkrYearly } from "@/lib/format";
import { ApiError } from "@/lib/api";

export function SavedPolicies() {
  const navigate = useNavigate();
  const { savedPolicies, removeSavedPolicy, isLoading } = useSavedPolicies();

  const handleRemove = async (policyId: string) => {
    try {
      await removeSavedPolicy(policyId);
      toast.success(copy.saved.removed);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : copy.errors.generic);
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
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Saved policies</h1>
        <p className="text-muted-foreground">
          {savedPolicies.length} {savedPolicies.length === 1 ? "policy" : "policies"} saved
        </p>
      </div>

      <div className="space-y-5">
        {savedPolicies.map((policy, index) => (
          <motion.div
            key={policy.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-all"
          >
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-1">{policy.name}</h3>
                <p className="text-muted-foreground text-sm mb-3">
                  {policy.insurer.companyName}
                </p>
                <p className="text-sm text-muted-foreground">{policy.coverageSummary}</p>
              </div>

              <div className="lg:w-56 flex flex-col gap-2">
                <div className="bg-muted/30 rounded-lg p-4 border border-border mb-2">
                  <p className="text-xs text-muted-foreground mb-1">Premium</p>
                  <p className="text-lg font-bold">
                    {formatPkrYearly(policy.premiumMonthlyPkr, policy.premiumYearlyPkr)}
                  </p>
                </div>
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
        ))}
      </div>
    </div>
  );
}
