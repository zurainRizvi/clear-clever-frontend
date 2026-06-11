import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import {
  ArrowRight,
  ClipboardList,
  FileText,
  Loader2,
  Sparkles,
} from "lucide-react";
import { motion } from "motion/react";
import { SEEKER_PAGE_CLASS } from "./seeker-portal-theme";
import { AnimatedPage } from "../ui/animated-page";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { friendlyAiBusyMessage } from "@/lib/ai-error";
import type { ClaimAttachmentPayload, ClaimIntelligenceReport } from "@/lib/claim-intelligence-types";
import { formatPkr } from "@/lib/format";
import { fadeUpItem, staggerDelay } from "@/lib/motion-presets";
import { statusClass } from "@/lib/provider-utils";
import {
  analyzeClaimIntelligence,
  createClaim,
  fetchClaims,
  fetchPurchases,
  type ClaimSummary,
  type PurchaseSummary,
} from "@/lib/purchase-api";
import { cn } from "../ui/utils";
import { useAuth } from "../auth-context";
import {
  ClaimAssistantPanel,
  type PendingClaimFile,
} from "./claim-assistant-panel";
import { ClaimDetailPanel } from "./claim-detail-panel";
import { UserCnicGate } from "./user-cnic-gate";
import { ClaimIntelligenceHistoryBadge } from "./claim-intelligence-ui";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
];
const MAX_FILE_BYTES = 4 * 1024 * 1024;
const MAX_FILES = 3;

async function fileToAttachment(file: File): Promise<ClaimAttachmentPayload> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Only images (JPEG, PNG, WebP, GIF) and PDF are supported.");
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("Each file must be under 4MB.");
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });

  const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1]! : dataUrl;

  return {
    mimeType: file.type,
    fileName: file.name,
    dataBase64: base64,
  };
}

export function ClaimsPage() {
  const { user, refreshUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [claims, setClaims] = useState<ClaimSummary[]>([]);
  const [purchases, setPurchases] = useState<PurchaseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState(
    searchParams.get("purchaseId") ?? ""
  );
  const [claimType, setClaimType] = useState("");
  const [wizardResetKey, setWizardResetKey] = useState(0);
  const [incidentDate, setIncidentDate] = useState("");
  const [estimatedAmountPkr, setEstimatedAmountPkr] = useState("");
  const [description, setDescription] = useState("");
  const [otherClaimType, setOtherClaimType] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingClaimFile[]>([]);
  const [intelligenceReport, setIntelligenceReport] = useState<ClaimIntelligenceReport | null>(
    null
  );
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const [viewingClaimId, setViewingClaimId] = useState<string | null>(null);
  const [userActionTimestamp, setUserActionTimestamp] = useState<Date | null>(null);
  const focusId = searchParams.get("focus");
  const viewingClaim = claims.find((c) => c.id === viewingClaimId) ?? null;

  const load = async () => {
    setLoading(true);
    try {
      const [claimsData, purchasesData] = await Promise.all([fetchClaims(), fetchPurchases()]);
      setClaims(claimsData.claims);
      setPurchases(purchasesData.purchases.filter((purchase) => purchase.status === "completed"));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not load claims");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!focusId) return;
    window.setTimeout(() => {
      document.getElementById(`claim-${focusId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 100);
  }, [focusId]);

  useEffect(() => {
    return () => {
      pendingFiles.forEach((pf) => {
        if (pf.previewUrl) URL.revokeObjectURL(pf.previewUrl);
      });
    };
  }, [pendingFiles]);

  const resolvedDescription =
    claimType === "other"
      ? `[Other type: ${otherClaimType.trim()}] ${description.trim()}`
      : description.trim();

  const clearReport = () => setIntelligenceReport(null);

  const addFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const next: PendingClaimFile[] = [];
    for (const file of Array.from(files)) {
      if (pendingFiles.length + next.length >= MAX_FILES) {
        toast.error(`Maximum ${MAX_FILES} files allowed`);
        break;
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`${file.name}: unsupported file type`);
        continue;
      }
      if (file.size > MAX_FILE_BYTES) {
        toast.error(`${file.name}: must be under 4MB`);
        continue;
      }
      const previewUrl = file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : undefined;
      next.push({ id: crypto.randomUUID(), file, previewUrl });
    }
    if (next.length > 0) {
      setPendingFiles((prev) => [...prev, ...next]);
      clearReport();
    }
  };

  const removeFile = (id: string) => {
    setPendingFiles((prev) => {
      const removed = prev.find((f) => f.id === id);
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
    clearReport();
  };

  const canGenerate =
    Boolean(selectedPurchaseId) &&
    Boolean(claimType) &&
    Boolean(incidentDate) &&
    resolvedDescription.length >= 5 &&
    pendingFiles.length > 0 &&
    (claimType !== "other" || otherClaimType.trim().length >= 2);

  const canSubmit =
    Boolean(selectedPurchaseId) &&
    Boolean(incidentDate) &&
    description.trim().length >= 5 &&
    (claimType !== "other" || otherClaimType.trim().length >= 2) &&
    (!estimatedAmountPkr || Number(estimatedAmountPkr) >= 0);

  const generateReport = async () => {
    if (!canGenerate) return;
    setUserActionTimestamp(new Date());
    setAnalyzing(true);
    try {
      const attachments = await Promise.all(pendingFiles.map((pf) => fileToAttachment(pf.file)));
      const result = await analyzeClaimIntelligence({
        purchaseId: selectedPurchaseId,
        claimType,
        description: resolvedDescription,
        estimatedAmountPkr: estimatedAmountPkr ? Number(estimatedAmountPkr) : undefined,
        incidentDate,
        attachments,
      });
      setIntelligenceReport(result.intelligenceReport);
      toast.success("Your AI Claims Intelligence Report is ready");
    } catch (err) {
      toast.error(friendlyAiBusyMessage(err, "Could not generate report"));
    } finally {
      setAnalyzing(false);
    }
  };

  const submitClaim = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const attachments = await Promise.all(
        pendingFiles.map((pf) => fileToAttachment(pf.file))
      );
      const result = await createClaim({
        purchaseId: selectedPurchaseId,
        claimType,
        incidentDate,
        estimatedAmountPkr: estimatedAmountPkr ? Number(estimatedAmountPkr) : undefined,
        description: resolvedDescription,
        intelligenceReport: intelligenceReport ?? undefined,
        attachments: attachments.length > 0 ? attachments : undefined,
      });
      setClaims((prev) => [result.claim, ...prev]);
      setViewingClaimId(result.claim.id);
      setSelectedPurchaseId("");
      setClaimType("");
      setDescription("");
      setEstimatedAmountPkr("");
      setOtherClaimType("");
      setWizardResetKey((k) => k + 1);
      setPendingFiles((prev) => {
        prev.forEach((pf) => {
          if (pf.previewUrl) URL.revokeObjectURL(pf.previewUrl);
        });
        return [];
      });
      clearReport();
      setUserActionTimestamp(null);
      setSearchParams({ focus: result.claim.id }, { replace: true });
      toast.success("Claim sent to your insurer for review");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.errors[0] ?? err.message : "Could not submit claim"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const claimsWithReport = useMemo(
    () => claims.filter((c) => c.intelligenceReport).length,
    [claims]
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading your claims…</p>
      </div>
    );
  }

  return (
    <AnimatedPage className={SEEKER_PAGE_CLASS}>
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-primary text-sm font-medium">
          <Sparkles className="w-4 h-4" aria-hidden />
          AI-assisted claims filing
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Claims</h1>
        <p className="text-muted-foreground max-w-2xl text-[15px] leading-relaxed">
          File a claim through our guided assistant. Upload evidence, receive a structured
          intelligence report, and send everything to your insurer in one step.
        </p>
      </header>

      {!user?.hasCnic ? (
        <div className="rounded-2xl border border-warning/30 bg-warning/[0.06] p-4 sm:p-5">
          <p className="text-sm font-semibold text-warning">CNIC not on your profile yet</p>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            You can still file a claim, but insurers often need identity verification. Add your CNIC
            below to improve approval confidence in your AI report.
          </p>
          <div className="mt-4">
            <UserCnicGate onSaved={() => void refreshUser()} />
          </div>
        </div>
      ) : null}

      <div className="grid xl:grid-cols-[1.15fr_0.85fr] gap-6 lg:gap-8 items-start">
        {viewingClaim ? (
          <ClaimDetailPanel
            claim={viewingClaim}
            onBack={() => setViewingClaimId(null)}
            onUpdated={(updated) => {
              setClaims((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
            }}
          />
        ) : (
        <ClaimAssistantPanel
          key={wizardResetKey}
          purchases={purchases}
          initialPurchaseId={searchParams.get("purchaseId") ?? ""}
          selectedPurchaseId={selectedPurchaseId}
          onSelectPurchase={(id) => {
            setSelectedPurchaseId(id);
            clearReport();
          }}
          claimType={claimType}
          onClaimTypeChange={(type) => {
            setClaimType(type);
            clearReport();
          }}
          otherClaimType={otherClaimType}
          onOtherClaimTypeChange={setOtherClaimType}
          incidentDate={incidentDate}
          onIncidentDateChange={setIncidentDate}
          estimatedAmountPkr={estimatedAmountPkr}
          onEstimatedAmountChange={setEstimatedAmountPkr}
          description={description}
          onDescriptionChange={(value) => {
            setDescription(value);
            clearReport();
          }}
          pendingFiles={pendingFiles}
          onAddFiles={addFiles}
          onRemoveFile={removeFile}
          maxFiles={MAX_FILES}
          allowedTypes={ALLOWED_TYPES}
          analyzing={analyzing}
          submitting={submitting}
          intelligenceReport={intelligenceReport}
          onGenerateReport={() => void generateReport()}
          onSubmit={() => void submitClaim()}
          canGenerate={canGenerate}
          canSubmit={canSubmit}
          userActionTimestamp={userActionTimestamp}
        />
        )}

        <aside className="space-y-4 xl:sticky xl:top-6">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-4">
              <ClipboardList className="w-4 h-4" aria-hidden />
              Your claim history
            </div>
            {claims.length === 0 ? (
              <div className="text-center py-10 px-4">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
                  <FileText className="w-7 h-7 text-muted-foreground" />
                </div>
                <h2 className="font-semibold text-lg mb-1">No claims yet</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Submitted claims and their AI reports will appear here for easy tracking.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[min(70vh,600px)] overflow-y-auto pr-1">
                {claims.map((claim, index) => (
                  <motion.article
                    key={claim.id}
                    id={`claim-${claim.id}`}
                    variants={fadeUpItem}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: staggerDelay(index, false, 0.05) }}
                    role="button"
                    tabIndex={0}
                    onClick={() => setViewingClaimId(claim.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setViewingClaimId(claim.id);
                      }
                    }}
                    className={cn(
                      "rounded-xl border p-4 transition-shadow cursor-pointer",
                      focusId === claim.id || viewingClaimId === claim.id
                        ? "border-primary shadow-lg shadow-primary/10 bg-primary/[0.02]"
                        : "border-border bg-card hover:border-border/80 hover:shadow-sm"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-semibold truncate">
                          {claim.policy?.name ?? "Policy claim"}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {claim.insurer?.companyName} · {claim.claimType.replace(/_/g, " ")}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 px-2.5 py-1 rounded-full text-xs capitalize ${statusClass(claim.status)}`}
                      >
                        {claim.status === "submitted"
                          ? "Sent"
                          : claim.status === "in_review"
                            ? "Reviewing"
                            : claim.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-sm mt-2.5 line-clamp-2 text-foreground/85">
                      {claim.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground mt-2.5">
                      <span>{new Date(claim.incidentDate).toLocaleDateString()}</span>
                      {claim.estimatedAmountPkr ? (
                        <>
                          <span aria-hidden>·</span>
                          <span>{formatPkr(claim.estimatedAmountPkr)}</span>
                        </>
                      ) : null}
                      {claim.intelligenceReport ? (
                        <>
                          <span aria-hidden>·</span>
                          <span className="inline-flex items-center gap-1 text-primary font-medium">
                            <Sparkles className="w-3 h-3" aria-hidden />
                            AI report
                          </span>
                        </>
                      ) : null}
                    </div>
                    {claim.intelligenceReport ? (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        <ClaimIntelligenceHistoryBadge
                          report={claim.intelligenceReport}
                          expanded={expandedHistoryId === claim.id}
                          onToggle={() =>
                            setExpandedHistoryId((prev) => (prev === claim.id ? null : claim.id))
                          }
                        />
                      </div>
                    ) : null}
                  </motion.article>
                ))}
              </div>
            )}
            {claims.length > 0 ? (
              <p className="text-xs text-muted-foreground mt-4 pt-4 border-t border-border">
                {claims.length} claim{claims.length === 1 ? "" : "s"}
                {claimsWithReport > 0
                  ? ` · ${claimsWithReport} with AI intelligence reports`
                  : ""}
              </p>
            ) : null}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl border border-border/80 bg-gradient-to-br from-muted/40 to-card p-5"
          >
            <h3 className="font-semibold text-sm mb-2">How it works</h3>
            <ol className="space-y-3 text-sm text-muted-foreground">
              {[
                "Describe your incident and upload evidence",
                "AI analyzes photos and documents in memory",
                "Review your intelligence report card by card",
                "Submit — your insurer receives the full snapshot",
              ].map((step, i) => (
                <li key={step} className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                    {i + 1}
                  </span>
                  <span className="pt-0.5 leading-snug">{step}</span>
                </li>
              ))}
            </ol>
            <p className="flex items-center gap-1.5 text-xs text-primary font-medium mt-4">
              <ArrowRight className="w-3.5 h-3.5" aria-hidden />
              Files are never stored until you submit
            </p>
          </motion.div>
        </aside>
      </div>
    </AnimatedPage>
  );
}
