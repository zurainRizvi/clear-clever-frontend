import { useState } from "react";
import { useOutletContext } from "react-router";
import type { ProviderOutletContext } from "./provider-dashboard";
import { CheckCircle2, Eye, Loader2, Plus } from "lucide-react";
import { fetchInsurerPolicy, type InsurerPolicyDetail } from "@/lib/insurer-api";
import { statusClass } from "@/lib/provider-utils";
import { useProvider } from "./provider-context";
import { ApiError } from "@/lib/api";
import { toast } from "sonner";
import { formatPkr } from "@/lib/format";

export function ProviderPoliciesPage() {
  const { onAddPolicy, onEditPolicy } = useOutletContext<ProviderOutletContext>();
  const { policyRows, loading } = useProvider();
  const [viewing, setViewing] = useState<InsurerPolicyDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const openDetails = async (policyId: string) => {
    setLoadingDetail(true);
    try {
      const data = await fetchInsurerPolicy(policyId);
      setViewing(data.policy);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not load policy details");
    } finally {
      setLoadingDetail(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">My policies</h1>
          <p className="text-muted-foreground">Create, edit, and track approval status</p>
        </div>
        <button
          type="button"
          onClick={onAddPolicy}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add policy
        </button>
      </div>

      {policyRows.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center text-muted-foreground">
          No policies found. Submit a policy for admin approval to list it on ClearClever.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {policyRows.map((policy) => (
            <div key={policy.id} className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-xl font-semibold">{policy.name}</h3>
                  <p className="text-sm text-muted-foreground">{policy.categoryLabel} insurance</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm ${statusClass(policy.status)}`}>
                  {policy.statusLabel}
                </span>
              </div>
              {policy.rejectionReason ? (
                <p className="text-sm text-destructive mb-3">
                  Rejection reason: {policy.rejectionReason}
                </p>
              ) : null}
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Monthly premium</div>
                  <div className="font-semibold">{formatPkr(policy.premiumMonthlyPkr)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Purchase leads</div>
                  <div className="font-semibold">{policy.purchaseLeads}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={loadingDetail}
                  onClick={() => void openDetails(policy.id)}
                  className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-accent inline-flex items-center justify-center gap-2 text-sm"
                >
                  <Eye className="w-4 h-4" />
                  View details
                </button>
                <button
                  type="button"
                  onClick={() => onEditPolicy(policy.id)}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm"
                >
                  {policy.status === "rejected" ? "Revise & resubmit" : "Edit"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold mb-2">{viewing.name}</h2>
            <p className="text-sm text-muted-foreground mb-4">{viewing.coverageSummary}</p>
            <p className="text-sm mb-4">{viewing.description}</p>
            <ul className="space-y-1 mb-4">
              {viewing.features.map((feature) => (
                <li key={feature} className="text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setViewing(null)}
              className="w-full py-2 border border-border rounded-lg hover:bg-accent"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
