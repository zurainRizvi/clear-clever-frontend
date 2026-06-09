import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Loader2, Sparkles, Upload } from "lucide-react";
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
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<KycVerificationReport | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const { kyc } = await fetchKycStatus();
      setReport(kyc);
      onKycUpdated?.(kyc);
    } catch {
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [onKycUpdated]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const saveCnic = async () => {
    if (!isValidCnicInput(cnic)) {
      toast.error("Enter a valid CNIC (13 digits, e.g. 42101-1234567-1)");
      return;
    }
    setSaving(true);
    try {
      await updateMeProfile({ cnic: normalizeCnicInput(cnic) });
      const { kyc } = await deriveKycFromCnic(normalizeCnicInput(cnic));
      setReport(kyc);
      onKycUpdated?.(kyc);
      onCnicSaved?.();
      toast.success("CNIC saved — local demographics ready");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save CNIC");
    } finally {
      setSaving(false);
    }
  };

  const handleFile = async (file: File) => {
    if (!ALLOWED_TYPES.has(file.type)) {
      toast.error("Use JPEG, PNG, or WebP for CNIC upload");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Image must be under 4 MB");
      return;
    }

    setVerifying(true);
    try {
      const dataBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Could not read file"));
        reader.readAsDataURL(file);
      });

      const { kyc } = await verifyKycDocument({
        mimeType: file.type,
        fileName: file.name.slice(0, 120),
        dataBase64,
      });
      setReport(kyc);
      onKycUpdated?.(kyc);
      toast.success(
        kyc.identityVerified
          ? "CNIC verified — identity match confirmed"
          : "CNIC analyzed — review results below"
      );
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "AI verification unavailable"
      );
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-5">
      {!cnicOnFile && (
        <div className="space-y-2">
          <label className="block text-sm font-medium">
            CNIC number
            <input
              type="text"
              inputMode="numeric"
              value={cnic}
              onChange={(e) => setCnic(formatCnicWhileTyping(e.target.value))}
              placeholder="42101-1234567-1"
              className="mt-1.5 w-full px-3 py-2.5 bg-input-background border border-border rounded-xl font-mono tracking-wide"
            />
          </label>
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
            ) : (
              "Save CNIC & derive region"
            )}
          </button>
        </div>
      )}

      {showUpload && (cnicOnFile || report?.status !== "none") && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-primary" aria-hidden />
            </div>
            <div>
              <p className="font-medium text-sm">AI CNIC verification (optional)</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Upload a clear photo of your CNIC for identity match scoring, age
                verification, and expiry checks.
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
              if (file) void handleFile(file);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={verifying}
            className="w-full py-2.5 border border-primary/30 text-primary rounded-xl text-sm font-medium hover:bg-primary/10 disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {verifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                Analyzing with AI…
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" aria-hidden />
                Upload CNIC photo
              </>
            )}
          </button>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Camera className="w-3 h-3" aria-hidden />
            Front side, well lit, all corners visible
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
          Loading verification status…
        </div>
      ) : report ? (
        <KycVerificationPanel report={report} />
      ) : null}
    </div>
  );
}
