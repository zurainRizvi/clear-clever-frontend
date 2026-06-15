import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { PolicyCompareMatrix } from "./policy-compare-matrix";
import { trackComparePolicies } from "@/lib/auth-api";
import { ApiError } from "@/lib/api";
import type { PublicPolicy } from "@/lib/types";
import { loadCompareFlowDraft } from "@/lib/compare-flow-draft";
import { clearPurchaseDraft } from "@/lib/purchase-draft";
import { policiesShareCategory } from "@/lib/compare-utils";
import { SEEKER_PAGE_CLASS } from "./seeker-portal-theme";

export function PolicyCompareView() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [policies, setPolicies] = useState<PublicPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryMismatch, setCategoryMismatch] = useState(false);

  useEffect(() => {
    const idsParam = searchParams.get("ids");
    if (!idsParam) {
      navigate("/dashboard/compare", { replace: true });
      return;
    }
    const policyIds = idsParam.split(",").filter(Boolean).slice(0, 4);
    if (policyIds.length < 2) {
      toast.error("Select at least two policies to compare");
      navigate("/dashboard/compare", { replace: true });
      return;
    }

    let cancelled = false;
    void (async () => {
      setLoading(true);
      setCategoryMismatch(false);
      try {
        const result = await trackComparePolicies(policyIds);
        if (!cancelled) {
          if (!policiesShareCategory(result.policies)) {
            setCategoryMismatch(true);
            setPolicies([]);
          } else {
            setPolicies(result.policies);
          }
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof ApiError ? error.message : "Could not load comparison";
          toast.error(message);
          navigate("/dashboard/compare", { replace: true });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate, searchParams]);

  const handleBuy = (policy: PublicPolicy) => {
    const draft = loadCompareFlowDraft();
    clearPurchaseDraft();
    navigate("/dashboard/purchase", {
      state: {
        policy,
        answers: draft?.answers ?? {},
        category: policy.category,
        returnTo: `/dashboard/compare/view?ids=${searchParams.get("ids") ?? ""}`,
      },
    });
  };

  if (categoryMismatch) {
    return (
      <div className={`${SEEKER_PAGE_CLASS} max-w-xl`}>
        <div className="rounded-2xl border border-warning/30 bg-warning/[0.06] p-6 space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" aria-hidden />
            <div className="space-y-2">
              <h1 className="text-xl font-bold">Different coverage types selected</h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                ClearClever can only compare policies from the same category — for example, all
                home plans or all pet plans. Please go back and select policies from one coverage
                type.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate("/dashboard/compare")}
            className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
          >
            Back to compare
          </button>
        </div>
      </div>
    );
  }

  return (
    <PolicyCompareMatrix
      policies={policies}
      loading={loading}
      onBack={() => navigate("/dashboard/compare")}
      onBuy={handleBuy}
    />
  );
}
