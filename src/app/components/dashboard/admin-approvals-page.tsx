import { useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useAdmin } from "./admin-context";
import { titleCase } from "@/lib/admin-utils";

export function AdminApprovalsPage({ heading = "Pending approvals" }: { heading?: string }) {
  const { pendingPolicies, loading, approvePolicy, rejectPolicy } = useAdmin();
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    setBusyId(id);
    try {
      await approvePolicy(id);
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = window.prompt("Optional rejection reason") ?? undefined;
    setBusyId(id);
    try {
      await rejectPolicy(id, reason);
    } finally {
      setBusyId(null);
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
      <div>
        <h1 className="text-3xl font-bold mb-1">{heading}</h1>
        <p className="text-muted-foreground">
          Review insurer policy submissions before they appear to policy seekers
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        {pendingPolicies.length === 0 ? (
          <p className="py-10 text-center text-muted-foreground">
            No pending policies. New insurer submissions will appear here.
          </p>
        ) : (
          <div className="space-y-4">
            {pendingPolicies.map((approval) => (
              <div
                key={approval.id}
                className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-accent/30 rounded-xl"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-semibold mb-1">{approval.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {approval.insurer?.companyName ?? "Unknown insurer"} ·{" "}
                    {titleCase(approval.category)} ·{" "}
                    {new Date(approval.createdAt).toLocaleDateString()}
                  </div>
                  {approval.description ? (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {approval.description}
                    </p>
                  ) : null}
                </div>
                <span className="px-3 py-1 bg-warning/10 text-warning rounded-full text-sm w-fit">
                  Pending review
                </span>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={busyId === approval.id}
                    onClick={() => void handleApprove(approval.id)}
                    className="px-4 py-2 bg-success text-white rounded-xl hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={busyId === approval.id}
                    onClick={() => void handleReject(approval.id)}
                    className="px-4 py-2 bg-destructive text-white rounded-xl hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
