import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Loader2, Pencil, Sparkles, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { updateMeProfile } from "@/lib/auth-api";
import { formatCnicWhileTyping, isValidCnicInput, normalizeCnicInput } from "@/lib/cnic";
import {
  deriveKycFromCnic,
  fetchKycStatus,
  verifyKycDocument,
  type KycVerificationReport,
} from "@/lib/kyc-api";
import { KycVerificationPanel } from "./kyc-verification-ui";

const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function friendlyKycError(err: unknown): string {
  if (err instanceof ApiError) {
    const detail = err.errors[0] ?? err.message;
    if (/object object|invalid json|unexpected token|syntax error/i.test(detail)) {
      return "Could not save CNIC right now. Please try again.";
    }
    if (/already registered|409/i.test(detail)) {
      return "This CNIC is already linked to another account.";
    }
    if (/high demand|busy|try again/i.test(detail)) {
      return "AI verification is busy — please wait a moment and try again.";
    }
    if (/not configured|unavailable/i.test(detail)) {
      return "AI verification is temporarily unavailable. Your CNIC is still saved.";
    }
    if (/validation failed|invalid/i.test(detail)) {
      return "Enter a valid CNIC (13 digits, e.g. 42101-1234567-1).";
    }
    return detail;
  }
  return "Could not verify CNIC photo. Please try again.";
}

export function CnicKycPanel({
  initialCnic = "",
  cnicOnFile,
  onCnicSaved,
  onKycUpdated,
  showUpload = true,
}: {
  initialCnic?: string;
  cnicOnFile?: boolean;
  onCnicSaved?: () => void;
  onKycUpdated?: (report: KycVerificationReport) => void;
  showUpload?: boolean;
}) {
  const [cnic, setCnic] = useState(initialCnic);
  const [editingCnic, setEditingCnic] = useState(!cnicOnFile);
  const [savedLocally, setSavedLocally] = useState(false);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [report, setReport] = useState<KycVerificationReport | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const onKycUpdatedRef = useRef(onKycUpdated);
  const onCnicSavedRef = useRef(onCnicSaved);

  useEffect(() => {
    onKycUpdatedRef.current = onKycUpdated;
    onCnicSavedRef.current = onCnicSaved;
  }, [onKycUpdated, onCnicSaved]);

  const loadStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      const { kyc } = await fetchKycStatus();
      setReport(kyc);
    } catch {
      setReport(null);
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialCnic) setCnic(initialCnic);
  }, [initialCnic]);

  useEffect(() => {
    setSavedLocally(false);
  }, [cnicOnFile]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const saveCnic = async () => {
    if (!isValidCnicInput(cnic)) {
      toast.error("Enter a valid CNIC (13 digits, e.g. 42101-1234567-1)");
      return;
    }
    setSaving(true);
    const wasVerified = report?.status === "verified";
    try {
      const normalized = normalizeCnicInput(cnic);
      const { user } = await updateMeProfile({ cnic: normalized });
      let kyc: KycVerificationReport | null = null;
      try {
        const derived = await deriveKycFromCnic(normalized);
        kyc = derived.kyc;
      } catch (deriveErr) {
        toast.message("CNIC saved. Regional lookup was unavailable for this issuer code.");
        if (deriveErr instanceof ApiError) {
          console.warn("CNIC derive skipped:", deriveErr.message);
        }
      }
      if (kyc) {
        setReport(kyc);
        onKycUpdatedRef.current?.(kyc);
      }
      onCnicSavedRef.current?.();
      setSavedLocally(true);
      setEditingCnic(false);
      setCnic(user.cnicMasked ?? normalized);
      if (wasVerified) {
        toast.success("CNIC updated — please upload your CNIC photo again to verify.");
      } else {
        toast.success("CNIC updated — demographics refreshed");
      }
    } catch (err) {
      toast.error(friendlyKycError(err));
    } finally {
      setSaving(false);
    }
  };

  const selectFile = (file: File) => {
    if (!ALLOWED_TYPES.has(file.type)) {
      toast.error("Use JPEG, PNG, or WebP for CNIC upload");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Image must be under 4 MB");
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const clearPendingFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPendingFile(null);
    setPreviewUrl(null);
  };

  const submitVerification = async () => {
    if (!pendingFile) {
      fileRef.current?.click();
      return;
    }
    if (!cnicOnFile && !isValidCnicInput(cnic)) {
      toast.error("Save your CNIC number before uploading a photo");
      return;
    }

    setVerifying(true);
    try {
      const dataBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Could not read file"));
        reader.readAsDataURL(pendingFile);
      });

      const { kyc } = await verifyKycDocument({
        mimeType: pendingFile.type,
        fileName: pendingFile.name.slice(0, 120),
        dataBase64,
      });
      setReport(kyc);
      onKycUpdatedRef.current?.(kyc);
      clearPendingFile();
      toast.success(
        kyc.identityVerified
          ? "Identity verified — your CNIC matches your profile"
          : kyc.status === "partial"
            ? "CNIC submitted — verification is under review"
            : kyc.policyLinkageNote ?? "CNIC analyzed — review results below"
      );
    } catch (err) {
      toast.error(friendlyKycError(err));
    } finally {
      setVerifying(false);
    }
  };

  const effectiveCnicOnFile = Boolean(cnicOnFile || savedLocally);
  const uploadLocked =
    report?.status === "verified" ||
    (report?.status === "partial" && report?.source === "upload");
  const canShowUpload = showUpload && effectiveCnicOnFile && !uploadLocked;

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <label className="block text-sm font-medium">CNIC number</label>
          {cnicOnFile && !editingCnic ? (
            <button
              type="button"
              onClick={() => {
                setCnic("");
                setEditingCnic(true);
              }}
              className="text-xs text-primary inline-flex items-center gap-1 hover:underline"
            >
              <Pencil className="w-3 h-3" aria-hidden />
              Update CNIC
            </button>
          ) : null}
        </div>
        {editingCnic || !cnicOnFile ? (
          <>
            <input
              type="text"
              inputMode="numeric"
              value={cnic}
              onChange={(e) => setCnic(formatCnicWhileTyping(e.target.value))}
              placeholder="42101-1234567-1"
              className="w-full px-3 py-2.5 bg-input-background border border-border rounded-xl font-mono tracking-wide"
            />
            {cnicOnFile ? (
              <p className="text-xs text-muted-foreground">
                Updating your CNIC will refresh regional data and may require re-verification.
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => void saveCnic()}
              disabled={saving}
              className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl disabled:opacity-50 font-medium text-sm"
            >
              {saving ? (
                <span className="inline-flex items-center gap-2 justify-center">
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                  Saving…
                </span>
              ) : cnicOnFile ? (
                "Update CNIC"
              ) : (
                "Save CNIC"
              )}
            </button>
            {cnicOnFile ? (
              <button
                type="button"
                onClick={() => setEditingCnic(false)}
                className="w-full py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            ) : null}
          </>
        ) : (
          <p className="font-mono text-sm px-3 py-2.5 bg-muted/40 border border-border rounded-xl">
            {report?.cnicMasked ?? cnic}
          </p>
        )}
      </div>

      {canShowUpload ? (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-primary" aria-hidden />
            </div>
            <div>
              <p className="font-medium text-sm">Upload CNIC for AI verification</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                We cross-check your saved CNIC and name against the document. Front side only or
                front and back — at least one clear photo is required.
              </p>
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) selectFile(file);
              e.target.value = "";
            }}
          />
          {pendingFile && previewUrl ? (
            <div className="rounded-lg border border-border bg-background p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium truncate">{pendingFile.name}</p>
                <button
                  type="button"
                  onClick={clearPendingFile}
                  className="text-muted-foreground hover:text-foreground shrink-0"
                  aria-label="Remove selected file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <img
                src={previewUrl}
                alt="CNIC preview"
                className="max-h-40 rounded-lg border border-border object-contain mx-auto"
              />
            </div>
          ) : null}
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={verifying}
              className="flex-1 py-2.5 border border-primary/30 text-primary rounded-xl text-sm font-medium hover:bg-primary/10 disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" aria-hidden />
              {pendingFile ? "Choose different photo" : "Select CNIC photo"}
            </button>
            <button
              type="button"
              onClick={() => void submitVerification()}
              disabled={verifying || !pendingFile}
              className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {verifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                  Analyzing…
                </>
              ) : (
                "Verify with AI"
              )}
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Camera className="w-3 h-3" aria-hidden />
            Front side, well lit, all corners visible
          </p>
        </div>
      ) : showUpload && !effectiveCnicOnFile ? (
        <p className="text-sm text-muted-foreground">
          Save your CNIC number above before uploading a verification photo.
        </p>
      ) : showUpload && uploadLocked ? (
        <p className="text-sm text-muted-foreground">
          {report?.status === "verified"
            ? "Your identity is verified. You cannot submit KYC again unless it is rejected."
            : "Your CNIC is under review. You will be notified once verification completes."}
        </p>
      ) : null}

      {statusLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
          Loading verification status…
        </div>
      ) : report ? (
        <KycVerificationPanel report={report} cnicOnFile={effectiveCnicOnFile} />
      ) : null}
    </div>
  );
}
