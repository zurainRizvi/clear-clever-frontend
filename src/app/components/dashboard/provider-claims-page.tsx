import { useCallback, useEffect, useMemo, useState } from "react";
import { useProvider } from "./provider-context";
import { Loader2, Mail, Phone, Shield, User } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { formatPkr } from "@/lib/format";
import { summarizeClaimRiskQueue } from "@/lib/ml-insights";
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
import { ClaimIntelligenceInsurerSummary } from "./claim-intelligence-ui";
import {
  ClaimRiskInsightCard,
  ClaimRiskQueueSummary,
  MlDisclaimerBanner,
} from "./ml-insight-ui";

const FILTERS: Array<"all" | InsurerClaimStatus> = [
  "all",
  "submitted",
  "in_review",
  "approved",
  "rejected",
];

const RISK_ORDER = { high: 0, medium: 1, low: 2 } as const;

function claimStatusLabel(status: InsurerClaimStatus) {
  if (status === "submitted") return "Awaiting review";
  return titleCase(status);
}

export function ProviderClaimsPage() {
  const { refresh: refreshProvider } = useProvider();
  const [claims, setClaims] = useState<InsurerClaimSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | InsurerClaimStatus>("all");
  const [priorityFirst, setPriorityFirst] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedMlId, setExpandedMlId] = useState<string | null>(null);
  const [expandedEvidenceId, setExpandedEvidenceId] = useState<string | null>(null);

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

  const queueSummary = useMemo(() => summarizeClaimRiskQueue(claims), [claims]);

  const filtered = useMemo(() => {
    let list = filter === "all" ? claims : claims.filter((claim) => claim.status === filter);

    if (priorityFirst) {
      list = [...list].sort((a, b) => {
        const aLevel = a.mlRisk?.level;
        const bLevel = b.mlRisk?.level;
        if (aLevel && bLevel && aLevel !== bLevel) {
          return RISK_ORDER[aLevel] - RISK_ORDER[bLevel];
        }
        if (aLevel && !bLevel) return -1;
        if (!aLevel && bLevel) return 1;
        if (a.mlRisk && b.mlRisk) return b.mlRisk.score - a.mlRisk.score;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }

    return list;
  }, [claims, filter, priorityFirst]);

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
        <p className="text-muted-foreground max-w-2xl leading-relaxed">
          Review policyholder claims with AI Claims Intelligence Reports and risk scoring. You
          always make the final approval decision.
        </p>
        {pendingCount > 0 ? (
          <p className="text-sm text-warning mt-2">
            {pendingCount} claim{pendingCount === 1 ? "" : "s"} waiting for your review
          </p>
        ) : null}
      </div>

      {queueSummary.withInsights > 0 ? (
        <ClaimRiskQueueSummary
          highPriority={queueSummary.highPriority}
          mediumPriority={queueSummary.mediumPriority}
          lowPriority={queueSummary.lowPriority}
          total={queueSummary.withInsights}
        />
      ) : null}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <AnimatedPillTabs
          tabs={filterTabs}
          activeId={filter}
          onChange={(id) => setFilter(id as typeof filter)}
          layoutId="provider-claims-filter"
          className="flex-1 min-w-0"
        />
        {queueSummary.withInsights > 0 ? (
          <label className="inline-flex items-center gap-2 text-sm text-muted-foreground shrink-0 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={priorityFirst}
              onChange={(e) => setPriorityFirst(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary"
            />
            Show high priority first
          </label>
        ) : null}
      </div>

      <MlDisclaimerBanner />

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-10 text-center text-muted-foreground">
            <p className="font-medium text-foreground mb-1">No claims in this view</p>
            <p className="text-sm">New submissions from policyholders will appear here for review.</p>
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
                <div className="flex-1 min-w-0 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold text-lg">{claim.policy?.name ?? "Policy claim"}</h2>
                      <p className="text-sm text-muted-foreground">
                        {titleCase(claim.claimType)} · Incident{" "}
                        {new Date(claim.incidentDate).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm ${statusClass(claim.status)}`}>
                      {claimStatusLabel(claim.status)}
                    </span>
                  </div>

                  <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Customer claim narrative
                    </p>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{claim.description}</p>
                    {claim.intelligenceReport?.attachmentSummary ? (
                      <p className="text-xs text-muted-foreground">
                        Evidence analyzed: {claim.intelligenceReport.attachmentSummary.count} file
                        {claim.intelligenceReport.attachmentSummary.count === 1 ? "" : "s"}
                        {claim.intelligenceReport.attachmentSummary.mimeTypes?.length
                          ? ` (${claim.intelligenceReport.attachmentSummary.mimeTypes.join(", ")})`
                          : ""}
                      </p>
                    ) : null}
                  </div>

                  {claim.estimatedAmountPkr ? (
                    <p className="text-sm text-muted-foreground">
                      Estimated amount: <span className="font-medium text-foreground">{formatPkr(claim.estimatedAmountPkr)}</span>
                    </p>
                  ) : null}

                  {claim.intelligenceReport ? (
                    <ClaimIntelligenceInsurerSummary
                      report={claim.intelligenceReport}
                      mlRisk={claim.mlRisk}
                      expandedMl={expandedMlId === claim.id}
                      onToggleMlExpand={() =>
                        setExpandedMlId((prev) => (prev === claim.id ? null : claim.id))
                      }
                      expandedEvidence={expandedEvidenceId === claim.id}
                      onToggleEvidence={() =>
                        setExpandedEvidenceId((prev) => (prev === claim.id ? null : claim.id))
                      }
                    />
                  ) : claim.mlRisk ? (
                    <ClaimRiskInsightCard
                      mlRisk={claim.mlRisk}
                      expanded={expandedMlId === claim.id}
                      onToggleExpand={() =>
                        setExpandedMlId((prev) => (prev === claim.id ? null : claim.id))
                      }
                      claimContext={{
                        incidentDate: claim.incidentDate,
                        estimatedAmountPkr: claim.estimatedAmountPkr,
                        description: claim.description,
                      }}
                    />
                  ) : null}

                  <div className="rounded-lg bg-muted/30 p-4 text-sm">
                    <div className="font-medium mb-2 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {claim.seeker?.fullName ?? "Policyholder"}
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
