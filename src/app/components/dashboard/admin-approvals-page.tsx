import { useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useAdmin } from "./admin-context";
import { titleCase } from "@/lib/admin-utils";
import { ActionConfirmDialog } from "./action-confirm-dialog";
import type { PendingPolicySummary } from "@/lib/admin-api";

export function AdminApprovalsPage({ heading = "Pending approvals" }: { heading?: string }) {
  const { pendingPolicies, loading, approvePolicy, rejectPolicy } = useAdmin();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [approveTarget, setApproveTarget] = useState<PendingPolicySummary | null>(null);
  const [rejectTarget, setRejectTarget] = useState<PendingPolicySummary | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const confirmApprove = async () => {
    if (!approveTarget) return;
    setBusyId(approveTarget.id);
    try {
      await approvePolicy(approveTarget.id);
      setApproveTarget(null);
    } finally {
      setBusyId(null);
    }
  };

  const confirmReject = async () => {
    if (!rejectTarget) return;
    setBusyId(rejectTarget.id);
    try {
      await rejectPolicy(rejectTarget.id, rejectReason.trim() || undefined);
      setRejectTarget(null);
      setRejectReason("");
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
          Review insurer policy submissions before they appear to policy seekers. Rejected policies
          notify the insurer so they can revise and resubmit.
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
                    <p className="text-sm text-muted-foreground mt-2">{approval.description}</p>
                  ) : null}
                </div>
                <span className="px-3 py-1 bg-warning/10 text-warning rounded-full text-sm w-fit">
                  Pending review
                </span>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={busyId === approval.id}
                    onClick={() => setApproveTarget(approval)}
                    className="px-4 py-2 bg-success text-white rounded-xl hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={busyId === approval.id}
                    onClick={() => {
                      setRejectTarget(approval);
                      setRejectReason("");
                    }}
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

      <ActionConfirmDialog
        open={approveTarget !== null}
        title="Approve this policy?"
        description={
          approveTarget
            ? `"${approveTarget.name}" by ${approveTarget.insurer?.companyName ?? "Unknown insurer"} will go live for policy seekers immediately.`
            : ""
        }
        confirmLabel="Approve policy"
        confirmTone="success"
        loading={busyId === approveTarget?.id}
        onCancel={() => setApproveTarget(null)}
        onConfirm={() => void confirmApprove()}
      />

      <ActionConfirmDialog
        open={rejectTarget !== null}
        title="Reject this policy?"
        description={
          rejectTarget
            ? `The insurer will be notified and can edit "${rejectTarget.name}" before resubmitting it for review.`
            : ""
        }
        confirmLabel="Reject policy"
        confirmTone="destructive"
        loading={busyId === rejectTarget?.id}
        onCancel={() => {
          setRejectTarget(null);
          setRejectReason("");
        }}
        onConfirm={() => void confirmReject()}
      >
        <label className="block text-sm">
          <span className="font-medium">Feedback for the insurer (optional)</span>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Explain what needs to change before approval…"
            className="mt-2 w-full min-h-24 px-3 py-2 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          />
        </label>
      </ActionConfirmDialog>
    </div>
  );
}
