import { useCallback, useEffect, useMemo, useState } from "react";
import { useProvider } from "./provider-context";
import { Loader2, Mail, Phone, Shield, User } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { formatPkr } from "@/lib/format";
import {
  fetchInsurerClaims,
  updateInsurerClaimStatus,
  type InsurerClaimSummary,
  type InsurerClaimStatus,
} from "@/lib/insurer-api";
import { statusClass, titleCase } from "@/lib/provider-utils";
import { motion } from "motion/react";
import { AnimatedPage } from "../ui/animated-page";
import { AnimatedPillTabs } from "../ui/animated-pill-tabs";
import { fadeUpItem } from "@/lib/motion-presets";

const FILTERS: Array<"all" | InsurerClaimStatus> = [
  "all",
  "submitted",
  "in_review",
  "approved",
  "rejected",
];

function claimStatusLabel(status: InsurerClaimStatus) {
  if (status === "submitted") return "Awaiting review";
  return titleCase(status);
}

export function ProviderClaimsPage() {
  const { refresh: refreshProvider } = useProvider();
  const [claims, setClaims] = useState<InsurerClaimSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | InsurerClaimStatus>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchInsurerClaims();
      setClaims(data.claims);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not load claims");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    if (filter === "all") return claims;
    return claims.filter((claim) => claim.status === filter);
  }, [claims, filter]);

  const pendingCount = claims.filter(
    (claim) => claim.status === "submitted" || claim.status === "in_review"
  ).length;

  const setStatus = async (
    claimId: string,
    status: Exclude<InsurerClaimStatus, "submitted">,
    options?: { revert?: boolean }
  ) => {
    setUpdatingId(claimId);
    try {
      const data = await updateInsurerClaimStatus(claimId, status, options);
      setClaims((prev) => prev.map((claim) => (claim.id === claimId ? data.claim : claim)));
      await refreshProvider();
      toast.success(`Claim marked as ${claimStatusLabel(data.claim.status).toLowerCase()}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not update claim");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const filterTabs = FILTERS.map((value) => ({
    id: value,
    label: value === "all" ? "All" : claimStatusLabel(value),
  }));

  return (
    <AnimatedPage className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Claims review</h1>
        <p className="text-muted-foreground">
          Policy seekers submit claims on completed policies. Review each request and approve or
          reject it — they are notified automatically.
        </p>
        {pendingCount > 0 ? (
          <p className="text-sm text-warning mt-2">
            {pendingCount} claim{pendingCount === 1 ? "" : "s"} awaiting your review
          </p>
        ) : null}
      </div>

      <AnimatedPillTabs
        tabs={filterTabs}
        activeId={filter}
        onChange={(id) => setFilter(id as typeof filter)}
        layoutId="provider-claims-filter"
      />

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-10 text-center text-muted-foreground">
            No claims in this view yet. New seeker claims will appear here for your approval.
          </div>
        ) : (
          filtered.map((claim, idx) => (
            <motion.article
              key={claim.id}
              variants={fadeUpItem}
              initial="hidden"
              animate="visible"
              transition={{ delay: idx * 0.05 }}
              className="bg-card border border-border rounded-xl p-6"
            >
              <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold text-lg">{claim.policy?.name ?? "Policy claim"}</h2>
                      <p className="text-sm text-muted-foreground">
                        {titleCase(claim.claimType)} ·{" "}
                        {new Date(claim.incidentDate).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm ${statusClass(claim.status)}`}>
                      {claimStatusLabel(claim.status)}
                    </span>
                  </div>

                  <p className="text-sm">{claim.description}</p>

                  {claim.estimatedAmountPkr ? (
                    <p className="text-sm text-muted-foreground">
                      Estimated amount: {formatPkr(claim.estimatedAmountPkr)}
                    </p>
                  ) : null}

                  <div className="rounded-lg bg-muted/30 p-4 text-sm">
                    <div className="font-medium mb-2 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {claim.seeker?.fullName ?? "Policy seeker"}
                    </div>
                    <div className="flex flex-wrap gap-4 text-muted-foreground">
                      {claim.seeker?.email ? (
                        <span className="inline-flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" />
                          {claim.seeker.email}
                        </span>
                      ) : null}
                      {claim.seeker?.phone ? (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" />
                          {claim.seeker.phone}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {(claim.status === "submitted" || claim.status === "in_review") && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {claim.status === "submitted" ? (
                        <button
                          type="button"
                          disabled={updatingId === claim.id}
                          onClick={() => void setStatus(claim.id, "in_review")}
                          className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-accent disabled:opacity-50"
                        >
                          Start review
                        </button>
                      ) : null}
                      <button
                        type="button"
                        disabled={updatingId === claim.id}
                        onClick={() => void setStatus(claim.id, "approved")}
                        className="px-4 py-2 text-sm bg-success text-success-foreground rounded-lg disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={updatingId === claim.id}
                        onClick={() => void setStatus(claim.id, "rejected")}
                        className="px-4 py-2 text-sm border border-destructive/40 text-destructive rounded-lg hover:bg-destructive/10 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                  {(claim.status === "approved" || claim.status === "rejected") && (
                    <div className="pt-1">
                      <button
                        type="button"
                        disabled={updatingId === claim.id}
                        onClick={() => void setStatus(claim.id, "in_review", { revert: true })}
                        className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-accent disabled:opacity-50"
                      >
                        Undo decision
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.article>
          ))
        )}
      </div>
    </AnimatedPage>
  );
}
