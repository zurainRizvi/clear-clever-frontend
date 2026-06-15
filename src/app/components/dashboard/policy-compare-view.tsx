import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { PolicyCompareMatrix } from "./policy-compare-matrix";
import { trackComparePolicies } from "@/lib/auth-api";
import { ApiError } from "@/lib/api";
import type { PublicPolicy } from "@/lib/types";
import { loadCompareFlowDraft } from "@/lib/compare-flow-draft";
import { clearPurchaseDraft } from "@/lib/purchase-draft";

export function PolicyCompareView() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [policies, setPolicies] = useState<PublicPolicy[]>([]);
  const [loading, setLoading] = useState(true);

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
      try {
        const result = await trackComparePolicies(policyIds);
        if (!cancelled) {
          setPolicies(result.policies);
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

  return (
    <PolicyCompareMatrix
      policies={policies}
      loading={loading}
      onBack={() => navigate("/dashboard/compare")}
      onBuy={handleBuy}
    />
  );
}
