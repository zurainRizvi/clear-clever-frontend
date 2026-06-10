import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Loader2,
  MessageSquareWarning,
  RefreshCw,
  Sparkles,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import type { ClaimAttachmentPayload, ClaimIntelligenceReport } from "@/lib/claim-intelligence-types";
import { pendingFilesIncludeCnic } from "@/lib/claim-category-types";
import { formatPkr } from "@/lib/format";
import {
  analyzeClaimIntelligence,
  resubmitClaim,
  type ClaimSummary,
} from "@/lib/purchase-api";
import { statusClass } from "@/lib/provider-utils";
import { cn } from "../ui/utils";
import type { PendingClaimFile } from "./claim-assistant-panel";
import { ClaimAttachmentsGallery } from "./claim-attachments-gallery";
import {
  ClaimIntelligenceChatReport,
  ClaimIntelligenceFullReportDialog,
} from "./claim-intelligence-ui";
import { ClaimFileChip } from "./claim-chat-ui";

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
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
  const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1]! : dataUrl;
  return { mimeType: file.type, fileName: file.name, dataBase64: base64 };
}

function fingerprintFiles(files: PendingClaimFile[]): string {
  return files
    .map((f) => `${f.file.name}|${f.file.type}|${f.file.size}`)
    .sort()
    .join("::");
}

export function ClaimDetailPanel({
  claim,
  onBack,
  onUpdated,
}: {
  claim: ClaimSummary;
  onBack: () => void;
  onUpdated: (claim: ClaimSummary) => void;
}) {
  const [reportOpen, setReportOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingClaimFile[]>([]);
  const [intelligenceReport, setIntelligenceReport] = useState<ClaimIntelligenceReport | null>(
    claim.intelligenceReport ?? null
  );
  const [analyzing, setAnalyzing] = useState(false);
  const [resubmitting, setResubmitting] = useState(false);

  const originalFingerprint = useMemo(
    () =>
      (claim.attachments ?? [])
        .map((a) => `${a.fileName}|${a.mimeType}|${a.dataBase64.length}`)
        .sort()
        .join("::"),
    [claim.attachments]
  );

  const currentFingerprint = useMemo(() => fingerprintFiles(pendingFiles), [pendingFiles]);
  const attachmentsChanged =
    pendingFiles.length > 0 && currentFingerprint !== originalFingerprint;

  const addFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const next: PendingClaimFile[] = [];
    for (const file of Array.from(files)) {
      if (pendingFiles.length + next.length >= MAX_FILES) break;
      if (!ALLOWED_TYPES.includes(file.type) || file.size > MAX_FILE_BYTES) continue;
      const previewUrl = file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : undefined;
      next.push({ id: crypto.randomUUID(), file, previewUrl });
    }
    if (next.length > 0) {
      setPendingFiles((prev) => [...prev, ...next]);
      if (attachmentsChanged) setIntelligenceReport(null);
    }
  };

  const handleResubmit = async () => {
    setResubmitting(true);
    try {
      const attachments =
        pendingFiles.length > 0
          ? await Promise.all(pendingFiles.map((pf) => fileToAttachment(pf.file)))
          : undefined;

      if (attachmentsChanged && !intelligenceReport) {
        toast.error("Generate a new AI report after changing evidence, or keep the same files.");
        return;
      }

      const result = await resubmitClaim(claim.id, {
        attachments,
        intelligenceReport: attachmentsChanged ? intelligenceReport ?? undefined : undefined,
        reuseIntelligenceReport: !attachmentsChanged,
      });
      onUpdated(result.claim);
      setPendingFiles([]);
      toast.success(
        result.attachmentsChanged
          ? "Claim resubmitted with updated evidence"
          : "Claim resubmitted — existing AI report kept"
      );
    } catch (err) {
      toast.error(err instanceof ApiError ? err.errors[0] ?? err.message : "Could not resubmit");
    } finally {
      setResubmitting(false);
    }
  };

  const regenerateReport = async () => {
    if (pendingFiles.length === 0) {
      toast.error("Add files before generating a new report");
      return;
    }
    setAnalyzing(true);
    try {
      const attachments = await Promise.all(pendingFiles.map((pf) => fileToAttachment(pf.file)));
      const result = await analyzeClaimIntelligence({
        purchaseId: claim.purchaseId,
        claimType: claim.claimType,
        description: claim.description,
        estimatedAmountPkr: claim.estimatedAmountPkr,
        incidentDate: claim.incidentDate,
        attachments,
      });
      setIntelligenceReport(result.intelligenceReport);
      setReportOpen(true);
      toast.success("Updated AI report ready");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.errors[0] ?? err.message : "Could not analyze");
    } finally {
      setAnalyzing(false);
    }
  };

  const canResubmit =
    claim.status === "needs_info" ||
    claim.status === "submitted" ||
    claim.status === "in_review";

  return (
    <section className="rounded-3xl border border-border bg-card shadow-xl overflow-hidden">
      <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to claims
        </button>
        <span className={cn("px-2.5 py-1 rounded-full text-xs capitalize", statusClass(claim.status))}>
          {claim.status.replace(/_/g, " ")}
        </span>
      </header>

      <div className="p-5 sm:p-6 space-y-6 max-h-[min(78vh,720px)] overflow-y-auto">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {claim.policy?.name ?? "Policy claim"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {claim.insurer?.companyName} · {claim.claimType.replace(/_/g, " ")} ·{" "}
            {new Date(claim.incidentDate).toLocaleDateString()}
            {claim.estimatedAmountPkr ? ` · ${formatPkr(claim.estimatedAmountPkr)}` : ""}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Your description
          </p>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{claim.description}</p>
        </div>

        {claim.insurerComment ? (
          <div className="rounded-xl border border-warning/30 bg-warning/[0.06] p-4">
            <div className="flex items-center gap-2 text-warning mb-2">
              <MessageSquareWarning className="w-4 h-4" />
              <p className="text-sm font-semibold">Insurer requested more information</p>
            </div>
            <p className="text-sm leading-relaxed">{claim.insurerComment.text}</p>
          </div>
        ) : null}

        {claim.attachments?.length ? (
          <ClaimAttachmentsGallery attachments={claim.attachments} />
        ) : null}

        {claim.intelligenceReport ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setReportOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
              >
                <Sparkles className="w-4 h-4" />
                Open full AI report
              </button>
            </div>
            <div className="rounded-2xl border border-border bg-muted/10 p-3 max-h-[420px] overflow-y-auto">
              <ClaimIntelligenceChatReport report={claim.intelligenceReport} />
            </div>
          </div>
        ) : null}

        {canResubmit ? (
          <div className="rounded-xl border border-border p-4 space-y-4">
            <div>
              <h3 className="font-semibold">Update & resubmit</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Add more evidence or respond to your insurer. AI analysis runs only if you change
                or add images.
              </p>
            </div>

            <input
              type="file"
              accept={ALLOWED_TYPES.join(",")}
              multiple
              className="hidden"
              id="claim-resubmit-files"
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <label
              htmlFor="claim-resubmit-files"
              className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-6 cursor-pointer hover:border-primary/40"
            >
              <Upload className="w-6 h-6 text-primary" />
              <span className="text-sm font-medium">Add or replace evidence files</span>
            </label>

            {pendingFiles.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {pendingFiles.map((pf) => (
                  <ClaimFileChip
                    key={pf.id}
                    name={pf.file.name}
                    previewUrl={pf.previewUrl}
                    onRemove={() =>
                      setPendingFiles((prev) => prev.filter((f) => f.id !== pf.id))
                    }
                  />
                ))}
              </div>
            ) : null}

            {attachmentsChanged ? (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void regenerateReport()}
                  disabled={analyzing || pendingFiles.length === 0}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
                >
                  {analyzing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  Regenerate AI report
                </button>
                {!pendingFilesIncludeCnic(pendingFiles) ? (
                  <p className="text-xs text-warning self-center">
                    Include your CNIC image before resubmitting.
                  </p>
                ) : null}
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => void handleResubmit()}
              disabled={resubmitting}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border font-semibold text-sm hover:bg-muted/40 disabled:opacity-50"
            >
              {resubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Resubmit claim
            </button>
          </div>
        ) : null}
      </div>

      {claim.intelligenceReport ? (
        <ClaimIntelligenceFullReportDialog
          report={claim.intelligenceReport}
          open={reportOpen}
          onOpenChange={setReportOpen}
        />
      ) : null}
    </section>
  );
}
