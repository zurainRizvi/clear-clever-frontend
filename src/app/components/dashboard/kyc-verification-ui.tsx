import {
  AlertTriangle,
  CheckCircle2,
  MapPin,
  ShieldCheck,
  UserCheck,
  XCircle,
} from "lucide-react";
import type { KycVerificationReport } from "@/lib/kyc-api";
import { cn } from "../ui/utils";
import { AnimatedNumber } from "./ml-insight-ui";

function KycScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const tone =
    score >= 85 ? "text-success" : score >= 60 ? "text-primary" : "text-warning";
  const strokeTone =
    score >= 85
      ? "stroke-success"
      : score >= 60
        ? "stroke-primary"
        : "stroke-warning";

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-muted/50"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          className={strokeTone}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <AnimatedNumber
          value={score}
          className={cn("text-2xl font-bold tabular-nums leading-none", tone)}
        />
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
          KYC
        </span>
      </div>
    </div>
  );
}

function CheckRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      {ok ? (
        <CheckCircle2 className="w-4 h-4 text-success shrink-0" aria-hidden />
      ) : (
        <XCircle className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden />
      )}
      <span className={ok ? "text-foreground" : "text-muted-foreground"}>{label}</span>
    </li>
  );
}

const KYC_DISCLAIMER =
  "AI-assisted identity verification from your CNIC — not an official NADRA check.";

export function KycStatusBadge({
  status,
  cnicOnFile = false,
}: {
  status: KycVerificationReport["status"];
  cnicOnFile?: boolean;
}) {
  if (status === "none" && cnicOnFile) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-muted text-muted-foreground border-border">
        <ShieldCheck className="w-3 h-3" aria-hidden />
        CNIC saved — upload to verify
      </span>
    );
  }

  const styles: Record<KycVerificationReport["status"], string> = {
    verified: "bg-success/10 text-success border-success/30",
    partial: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    failed: "bg-destructive/10 text-destructive border-destructive/30",
    none: "bg-muted text-muted-foreground border-border",
  };
  const labels: Record<KycVerificationReport["status"], string> = {
    verified: "KYC verified",
    partial: "Under review",
    failed: "Not approved",
    none: "Not started",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border",
        styles[status]
      )}
    >
      <ShieldCheck className="w-3 h-3" aria-hidden />
      {labels[status]}
    </span>
  );
}

export function KycVerificationPanel({
  report,
  compact = false,
  cnicOnFile = false,
}: {
  report: KycVerificationReport;
  compact?: boolean;
  cnicOnFile?: boolean;
}) {
  if (report.status === "none" && !cnicOnFile) {
    return null;
  }

  if (report.status === "none") {
    return (
      <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
        Add your CNIC and upload a photo to unlock identity insights.
      </div>
    );
  }

  const hasScore = report.kycScore !== undefined;
  const displayScore =
    report.status === "verified" && report.identityVerified
      ? 100
      : report.kycScore ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start gap-4">
        {hasScore && <KycScoreRing score={displayScore} />}
        <div className="flex-1 min-w-[200px] space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <KycStatusBadge status={report.status} />
            {report.identityVerified && (
              <span className="text-xs text-success font-medium">Identity verified</span>
            )}
          </div>
          {report.cnicMasked && (
            <p className="text-sm font-mono text-muted-foreground">{report.cnicMasked}</p>
          )}
          {!compact && (
            <p className="text-xs text-muted-foreground">{KYC_DISCLAIMER}</p>
          )}
        </div>
      </div>

      {(report.province || report.district || report.genderPredicted) && (
        <div className="rounded-xl bg-muted/40 border border-border p-3 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" aria-hidden />
            From CNIC structure
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {report.genderPredicted && (
              <span>
                Gender: <strong className="capitalize">{report.genderPredicted}</strong>
              </span>
            )}
            {report.district && (
              <span>
                District: <strong>{report.district}</strong>
              </span>
            )}
            {report.province && (
              <span>
                Province: <strong>{report.province}</strong>
              </span>
            )}
            {report.age !== undefined && (
              <span>
                Age: <strong>{report.age}</strong>
                {report.isAdult !== undefined && (
                  <span className="text-muted-foreground">
                    {" "}
                    ({report.isAdult ? "18+" : "Under 18"})
                  </span>
                )}
              </span>
            )}
          </div>
        </div>
      )}

      {hasScore && (
        <ul className="space-y-1.5">
          <CheckRow ok={Boolean(report.nameMatch)} label="Name matches profile" />
          <CheckRow ok={Boolean(report.cnicMatch)} label="CNIC matches profile" />
          <CheckRow ok={Boolean(report.policyLinked)} label="Matches purchased policy details" />
          <CheckRow ok={Boolean(report.documentReadable)} label="Document readable" />
          <CheckRow
            ok={report.cnicExpired === false}
            label={
              report.cnicExpired === true
                ? "CNIC expired"
                : report.cnicExpired === false
                  ? "CNIC valid (not expired)"
                  : "Expiry unknown"
            }
          />
          {report.isAdult !== undefined && (
            <CheckRow ok={report.isAdult} label="Age 18 or above" />
          )}
        </ul>
      )}

      {(report.suspiciousDocument ||
        report.croppedDocument ||
        report.blurScore === "High" ||
        report.blurScore === "Medium" ||
        (report.missingFields?.length ?? 0) > 0) && (
        <div className="rounded-xl border border-warning/30 bg-warning/5 p-3 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-warning flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" aria-hidden />
            Risk signals
          </p>
          <div className="flex flex-wrap gap-2">
            {report.blurScore && report.blurScore !== "Low" && (
              <span className="text-xs px-2 py-1 rounded-full bg-warning/10 text-warning">
                Blur: {report.blurScore}
              </span>
            )}
            {report.croppedDocument && (
              <span className="text-xs px-2 py-1 rounded-full bg-warning/10 text-warning">
                Cropped document
              </span>
            )}
            {report.suspiciousDocument && (
              <span className="text-xs px-2 py-1 rounded-full bg-destructive/10 text-destructive">
                Suspicious document
              </span>
            )}
            {report.tamperingRisk && report.tamperingRisk !== "Low" && (
              <span className="text-xs px-2 py-1 rounded-full bg-destructive/10 text-destructive">
                Tampering: {report.tamperingRisk}
              </span>
            )}
          </div>
          {report.missingFields.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Missing: {report.missingFields.join(", ")}
            </p>
          )}
        </div>
      )}

      {report.policyLinkageNote ? (
        <div
          className={cn(
            "rounded-xl border p-3 text-sm leading-relaxed",
            report.policyLinked
              ? "border-success/30 bg-success/5 text-foreground"
              : "border-warning/30 bg-warning/5 text-muted-foreground"
          )}
        >
          <p className="font-medium text-foreground mb-1">Policy linkage</p>
          <p>{report.policyLinkageNote}</p>
          {report.linkedPolicyNames && report.linkedPolicyNames.length > 0 ? (
            <p className="text-xs mt-2 text-muted-foreground">
              Policies: {report.linkedPolicyNames.join(" · ")}
            </p>
          ) : null}
        </div>
      ) : null}

      {report.extractedFullName && !compact && (
        <div className="text-xs text-muted-foreground flex items-start gap-1.5">
          <UserCheck className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden />
          <span>
            Extracted: {report.extractedFullName}
            {report.extractedFatherName ? ` · ${report.extractedFatherName}` : ""}
            {report.extractedDob ? ` · DOB ${report.extractedDob}` : ""}
          </span>
        </div>
      )}
    </div>
  );
}
