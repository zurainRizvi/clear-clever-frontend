import { useState } from "react";
import { CheckCircle2, Loader2, Trash2, UserX, XCircle } from "lucide-react";
import type { AdminInsurerRecord } from "@/lib/admin-api";
import { titleCase } from "@/lib/admin-utils";
import { useAdmin } from "./admin-context";
import { ActionConfirmDialog } from "./action-confirm-dialog";

function statusBadgeClass(status: string) {
  if (status === "active") return "bg-success/10 text-success";
  if (status === "pendingVerification") return "bg-warning/10 text-warning";
  return "bg-destructive/10 text-destructive";
}

export function SuperadminProviderApprovalsPage() {
  const {
    insurers,
    loading,
    approveInsurer,
    rejectInsurer,
    revokeInsurer,
    deleteInsurer,
  } = useAdmin();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [approveTarget, setApproveTarget] = useState<AdminInsurerRecord | null>(null);
  const [rejectTarget, setRejectTarget] = useState<AdminInsurerRecord | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [revokeTarget, setRevokeTarget] = useState<AdminInsurerRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminInsurerRecord | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const providerName = (entry: AdminInsurerRecord) =>
    entry.profile?.companyName ?? entry.user.fullName;

  const runAction = async (id: string, action: () => Promise<void>) => {
    setBusyId(id);
    try {
      await action();
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
        <h1 className="text-3xl font-bold mb-1">Provider approvals</h1>
        <p className="text-muted-foreground">
          Approve or reject new insurance providers. Remove approved providers from the platform, or
          permanently delete an insurer and all related data. Only Super Admin can perform these
          actions.
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        {insurers.length === 0 ? (
          <p className="py-10 text-center text-muted-foreground">No insurance providers on the platform yet.</p>
        ) : (
          insurers.map((entry) => {
            const name = providerName(entry);
            const isPending = entry.user.status === "pendingVerification";
            const isActive = entry.user.status === "active";

            return (
              <div
                key={entry.user.id}
                className="flex flex-col lg:flex-row lg:items-center gap-4 p-4 bg-accent/30 rounded-xl"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-lg">{name}</div>
                  <div className="text-sm text-muted-foreground">{entry.user.email}</div>
                  {entry.profile ? (
                    <div className="text-xs text-muted-foreground mt-1">
                      Slug: {entry.profile.slug} · {entry.pendingPolicies} pending polic
                      {entry.pendingPolicies === 1 ? "y" : "ies"}
                      {(entry.starterPoliciesCount ?? 0) > 0
                        ? ` · ${entry.starterPoliciesCount} starter template${entry.starterPoliciesCount === 1 ? "" : "s"}`
                        : ""}
                    </div>
                  ) : (
                    <div className="text-xs text-warning mt-1">Setup not completed yet</div>
                  )}
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm w-fit ${statusBadgeClass(entry.user.status)}`}
                >
                  {titleCase(entry.user.status)}
                </span>
                <div className="flex flex-wrap gap-2 shrink-0">
                  {isPending ? (
                    <>
                      <button
                        type="button"
                        disabled={busyId === entry.user.id}
                        onClick={() => setApproveTarget(entry)}
                        className="px-4 py-2 bg-success text-white rounded-xl hover:opacity-90 flex items-center gap-2 disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={busyId === entry.user.id}
                        onClick={() => {
                          setRejectTarget(entry);
                          setRejectReason("");
                        }}
                        className="px-4 py-2 bg-destructive text-white rounded-xl hover:opacity-90 flex items-center gap-2 disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </>
                  ) : null}
                  {isActive ? (
                    <button
                      type="button"
                      disabled={busyId === entry.user.id}
                      onClick={() => setRevokeTarget(entry)}
                      className="px-4 py-2 border border-warning/40 text-warning rounded-xl hover:bg-warning/10 flex items-center gap-2 disabled:opacity-50"
                    >
                      <UserX className="w-4 h-4" />
                      Remove from platform
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={busyId === entry.user.id}
                    onClick={() => {
                      setDeleteTarget(entry);
                      setDeleteConfirmText("");
                    }}
                    className="px-4 py-2 border border-destructive/40 text-destructive rounded-xl hover:bg-destructive/10 flex items-center gap-2 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete permanently
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <ActionConfirmDialog
        open={approveTarget !== null}
        title="Approve this provider?"
        description={
          approveTarget
            ? `${providerName(approveTarget)} will be able to sign in, manage policies, and appear on ClearClever immediately.`
            : ""
        }
        confirmLabel="Approve provider"
        confirmTone="success"
        loading={busyId === approveTarget?.user.id}
        onCancel={() => setApproveTarget(null)}
        onConfirm={() =>
          approveTarget
            ? void runAction(approveTarget.user.id, async () => {
                await approveInsurer(approveTarget.user.id);
                setApproveTarget(null);
              })
            : undefined
        }
      />

      <ActionConfirmDialog
        open={rejectTarget !== null}
        title="Reject this provider application?"
        description={
          rejectTarget
            ? `${providerName(rejectTarget)} will not be able to sign in. Their account remains in the database but stays inactive. This cannot be undone except by permanent deletion or manual reactivation.`
            : ""
        }
        confirmLabel="Reject application"
        confirmTone="destructive"
        loading={busyId === rejectTarget?.user.id}
        onCancel={() => {
          setRejectTarget(null);
          setRejectReason("");
        }}
        onConfirm={() =>
          rejectTarget
            ? void runAction(rejectTarget.user.id, async () => {
                await rejectInsurer(rejectTarget.user.id, rejectReason.trim() || undefined);
                setRejectTarget(null);
                setRejectReason("");
              })
            : undefined
        }
      >
        <label className="block text-sm">
          <span className="font-medium">Reason for the provider (optional)</span>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Explain why the application was not approved…"
            className="mt-2 w-full min-h-24 px-3 py-2 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          />
        </label>
      </ActionConfirmDialog>

      <ActionConfirmDialog
        open={revokeTarget !== null}
        title="Remove this provider from the platform?"
        description={
          revokeTarget
            ? `${providerName(revokeTarget)} will lose sign-in access immediately. Policies, leads, and historical data remain in ClearClever until you permanently delete the account. This action cannot be undone from the provider side — only Super Admin can restore access.`
            : ""
        }
        confirmLabel="Remove provider"
        confirmTone="destructive"
        loading={busyId === revokeTarget?.user.id}
        onCancel={() => setRevokeTarget(null)}
        onConfirm={() =>
          revokeTarget
            ? void runAction(revokeTarget.user.id, async () => {
                await revokeInsurer(revokeTarget.user.id);
                setRevokeTarget(null);
              })
            : undefined
        }
      />

      <ActionConfirmDialog
        open={deleteTarget !== null}
        title="Permanently delete this insurer?"
        description={
          deleteTarget
            ? `You are about to permanently delete ${providerName(deleteTarget)} (${deleteTarget.user.email}) and ALL related data: insurer profile, policies, leads, claims, purchases, messages, and notifications. This cannot be undone. The insurer must create a brand-new account to return. Type DELETE below to confirm.`
            : ""
        }
        confirmLabel="Delete permanently"
        confirmTone="destructive"
        confirmDisabled={deleteConfirmText !== "DELETE"}
        loading={busyId === deleteTarget?.user.id}
        onCancel={() => {
          setDeleteTarget(null);
          setDeleteConfirmText("");
        }}
        onConfirm={() =>
          deleteTarget
            ? void runAction(deleteTarget.user.id, async () => {
                await deleteInsurer(deleteTarget.user.id);
                setDeleteTarget(null);
                setDeleteConfirmText("");
              })
            : undefined
        }
      >
        <label className="block text-sm">
          <span className="font-medium text-destructive">Type DELETE to confirm</span>
          <input
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="DELETE"
            className="mt-2 w-full px-3 py-2 bg-input-background border border-destructive/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-destructive/40"
          />
        </label>
      </ActionConfirmDialog>
    </div>
  );
}
