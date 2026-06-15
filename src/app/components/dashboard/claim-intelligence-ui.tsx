import {
  AlertTriangle,
  Car,
  CheckCircle2,
  ChevronDown,
  FileBadge,
  HeartPulse,
  Maximize2,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserCheck,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { ClaimIntelligenceReport } from "@/lib/claim-intelligence-types";
import type { ClaimMlRisk } from "@/lib/insurer-api";
import { formatPkr } from "@/lib/format";
import {
  fadeUpItem,
  quickTransition,
  sectionGradientShift,
  staggerDelay,
} from "@/lib/motion-presets";
import {
  CLAIM_INTELLIGENCE_DISCLAIMER,
  claimReadinessCheckItems,
  claimReadinessSeekerCopy,
  consistencyCardStatus,
  consistencyCheckLabel,
  damageSeverityLabel,
  documentVerificationLabel,
  humanizeClaimRiskFactor,
  insurerRecommendationLabel,
  insurerRecommendationSeekerHint,
  isMeaningfulReportValue,
  medicalComplexityLabel,
} from "@/lib/ml-insights";
import { cn } from "../ui/utils";
import { ClaimRichCardRow, type ClaimRichCardData } from "./claim-chat-ui";
import { AnimatedNumber, ClaimRiskInsightCard } from "./ml-insight-ui";

function approvalImprovementsFor(report: ClaimIntelligenceReport): string[] {
  if (report.approvalImprovements?.length) {
    return report.approvalImprovements;
  }
  return report.submissionChecklist?.missingItems ?? [];
}

function applicationLooksComplete(report: ClaimIntelligenceReport): boolean {
  return report.submissionChecklist?.readyToSubmit !== false;
}

function DemoReportBadge({ modelVersion }: { modelVersion?: string }) {
  if (modelVersion !== "gemini-demo-seed") {
    return null;
  }
  return (
    <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
      Demo report
    </span>
  );
}

function ClaimIncompleteApplicationNotice({
  report,
  audience,
}: {
  report: ClaimIntelligenceReport;
  audience: "seeker" | "insurer";
}) {
  const improvements = approvalImprovementsFor(report);
  if (applicationLooksComplete(report) || improvements.length === 0) {
    return null;
  }

  const seekerTitle = "Incomplete application — you can still submit";
  const insurerTitle = "Incomplete application — personal review recommended";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={quickTransition}
      className="rounded-2xl border border-warning/30 bg-warning/[0.06] p-4 w-full space-y-3"
    >
      <div className="flex items-start gap-2 text-warning">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold">
            {audience === "seeker" ? seekerTitle : insurerTitle}
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {audience === "seeker"
              ? "Your claim may be rejected or sent back for more information. Follow these steps to raise approval confidence toward 100%."
              : "The policyholder submitted with gaps in identity or documentation. Review these items personally before approving."}
          </p>
        </div>
      </div>
      <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5">
        {improvements.map((item) => (
          <li key={item} className="leading-relaxed">
            {item}
          </li>
        ))}
      </ul>
      {report.submissionChecklist?.missingItems.length ? (
        <p className="text-xs text-muted-foreground border-t border-warning/20 pt-2">
          {audience === "insurer"
            ? `Readiness score: ${report.claimReadiness.score}% · ${report.submissionChecklist.missingItems.length} gap${
                report.submissionChecklist.missingItems.length === 1 ? "" : "s"
              } flagged`
            : `Current readiness: ${report.claimReadiness.score}% — completing the steps above is the fastest path to 100%.`}
        </p>
      ) : null}
    </motion.div>
  );
}

function ReadinessRing({ score, size = 72 }: { score: number; size?: number }) {
  const reducedMotion = useReducedMotion();
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
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          className={strokeTone}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: reducedMotion ? offset : circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: reducedMotion ? 0 : 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <AnimatedNumber
          value={score}
          className={cn(
            size >= 72 ? "text-xl" : "text-base",
            "font-bold tabular-nums leading-none",
            tone
          )}
        />
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
          Ready
        </span>
      </div>
    </div>
  );
}

function ReadinessCheck({
  ok,
  passLabel,
  failLabel,
}: {
  ok: boolean;
  passLabel: string;
  failLabel: string;
}) {
  const label = ok ? passLabel : failLabel;

  return (
    <motion.li
      variants={fadeUpItem}
      className="flex items-start gap-2.5 text-sm rounded-lg px-2 py-1.5"
    >
      {ok ? (
        <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" aria-hidden />
      ) : (
        <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" aria-hidden />
      )}
      <span className={ok ? "text-foreground" : "text-destructive/90"}>{label}</span>
    </motion.li>
  );
}

function ReadinessCheckList({
  report,
}: {
  report: ClaimIntelligenceReport;
}) {
  const items = claimReadinessCheckItems(report.claimReadiness);

  return (
    <motion.ul
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
      }}
      className="grid sm:grid-cols-2 gap-1"
    >
      {items.map((item) => (
        <ReadinessCheck
          key={item.failLabel}
          ok={item.ok}
          passLabel={item.passLabel}
          failLabel={item.failLabel}
        />
      ))}
    </motion.ul>
  );
}

type ReportSurfaceVariant = "inline" | "modal";

function reportSurfaceClasses(variant: ReportSurfaceVariant) {
  return variant === "modal"
    ? {
        panel: "bg-muted",
        panelSoft: "bg-muted",
        gradientVia: "via-muted",
        gradientTo: "to-muted",
      }
    : {
        panel: "bg-card",
        panelSoft: "bg-card/90",
        gradientVia: "via-card",
        gradientTo: "to-card",
      };
}

function MetricTile({
  label,
  value,
  sub,
  tone = "default",
  icon: Icon,
  index = 0,
  surfaceClass = "bg-card/90",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "success" | "warning";
  icon?: LucideIcon;
  index?: number;
  surfaceClass?: string;
}) {
  const reducedMotion = useReducedMotion();
  const valueClass =
    tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : "text-foreground";

  const numericMatch = value.match(/^(\d+)(.*)$/);
  const numericValue = numericMatch ? Number(numericMatch[1]) : null;
  const valueSuffix = numericMatch ? numericMatch[2] : null;

  return (
    <motion.div
      variants={fadeUpItem}
      initial="hidden"
      animate="visible"
      transition={{ ...quickTransition, delay: staggerDelay(index, !!reducedMotion, 0.05) }}
      whileHover={reducedMotion ? undefined : { y: -2, transition: quickTransition }}
      className={cn(
        "rounded-xl border border-border/80 p-3.5 min-w-0 sm:min-w-[130px] flex-1 shadow-sm",
        surfaceClass
      )}
    >
      <div className="flex items-center gap-1.5">
        {Icon ? <Icon className="w-3.5 h-3.5 text-primary/70" aria-hidden /> : null}
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
      </div>
      <p className={cn("text-lg font-semibold mt-1.5 tabular-nums tracking-tight", valueClass)}>
        {numericValue !== null && !Number.isNaN(numericValue) ? (
          <>
            <AnimatedNumber value={numericValue} />
            {valueSuffix}
          </>
        ) : (
          value
        )}
      </p>
      {sub ? <p className="text-xs text-muted-foreground mt-1 leading-snug">{sub}</p> : null}
    </motion.div>
  );
}

function SectionCard({
  icon: Icon,
  title,
  gradient,
  children,
  delay = 0,
}: {
  icon: LucideIcon;
  title: string;
  gradient: string;
  children: React.ReactNode;
  delay?: number;
}) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...quickTransition, delay: reducedMotion ? 0 : delay }}
      className="rounded-xl border border-border/70 bg-background/70 overflow-hidden shadow-sm"
    >
      <div className={cn("flex items-center gap-2.5 px-3.5 py-2.5 border-b border-border/50", gradient)}>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background/90 ring-1 ring-border/40">
          <Icon className="w-4 h-4 text-primary" aria-hidden />
        </div>
        <p className="text-sm font-semibold">{title}</p>
      </div>
      <div className="p-3.5 space-y-1.5">{children}</div>
    </motion.div>
  );
}

function VehicleSection({ vehicle }: { vehicle: NonNullable<ClaimIntelligenceReport["vehicle"]> }) {
  return (
    <SectionCard
      icon={Car}
      title="Vehicle damage analysis"
      gradient="bg-gradient-to-r from-amber-500/[0.08] to-transparent"
    >
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
        <span>
          Severity:{" "}
          <strong className="text-foreground">{damageSeverityLabel(vehicle.severity)}</strong>
          <span className="text-xs ml-1">({vehicle.severityConfidence}% confidence)</span>
        </span>
        <span className="hidden sm:inline text-border">·</span>
        <span>
          Complexity:{" "}
          <strong className="text-foreground capitalize">{vehicle.repairComplexity}</strong>
        </span>
      </div>
      {vehicle.damagedParts.length > 0 ? (
        <p className="text-sm text-muted-foreground pt-1">
          Affected parts:{" "}
          <span className="text-foreground font-medium">{vehicle.damagedParts.join(", ")}</span>
        </p>
      ) : null}
      <p className="text-sm pt-1">
        <span className="text-muted-foreground">Estimated repair: </span>
        <span className="text-foreground font-semibold">
          {formatPkr(vehicle.estimatedCostMinPkr)} – {formatPkr(vehicle.estimatedCostMaxPkr)}
        </span>
      </p>
    </SectionCard>
  );
}

function IdentitySection({
  identity,
}: {
  identity: NonNullable<ClaimIntelligenceReport["identity"]>;
}) {
  return (
    <SectionCard
      icon={UserCheck}
      title="Identity verification"
      gradient="bg-gradient-to-r from-emerald-500/[0.08] to-transparent"
    >
      <p className="text-sm text-muted-foreground">
        {identity.documentType}
        {identity.extractedName ? ` · ${identity.extractedName}` : ""}
      </p>
      {identity.extractedCnic ? (
        <p className="text-sm text-muted-foreground">CNIC: {identity.extractedCnic}</p>
      ) : null}
      <div className="flex flex-wrap gap-2 pt-1 text-xs">
        <span
          className={cn(
            "px-2 py-0.5 rounded-full border",
            identity.matchesName
              ? "border-success/30 text-success bg-success/10"
              : "border-warning/30 text-warning bg-warning/10"
          )}
        >
          Name {identity.matchesName ? "match" : "mismatch"}
        </span>
        <span
          className={cn(
            "px-2 py-0.5 rounded-full border",
            identity.matchesCnic
              ? "border-success/30 text-success bg-success/10"
              : "border-warning/30 text-warning bg-warning/10"
          )}
        >
          CNIC {identity.matchesCnic ? "match" : "mismatch"}
        </span>
      </div>
      <p
        className={cn(
          "text-sm font-medium pt-1",
          identity.matchesUserProfile ? "text-success" : "text-warning"
        )}
      >
        {identity.matchesUserProfile
          ? "Account holder verified"
          : "Account holder not verified"}{" "}
        — {identity.profileMatchReason}
      </p>
    </SectionCard>
  );
}

function PolicyDocSection({
  policyDoc,
}: {
  policyDoc: NonNullable<ClaimIntelligenceReport["policyDoc"]>;
}) {
  return (
    <SectionCard
      icon={FileBadge}
      title="Policy document"
      gradient="bg-gradient-to-r from-blue-500/[0.08] to-transparent"
    >
      {policyDoc.policyNumber ? (
        <p className="text-sm text-muted-foreground">Policy #: {policyDoc.policyNumber}</p>
      ) : null}
      {policyDoc.insurer ? (
        <p className="text-sm text-muted-foreground">Insurer: {policyDoc.insurer}</p>
      ) : null}
      <p
        className={cn(
          "text-sm font-medium",
          policyDoc.matchesLinkedPolicy ? "text-success" : "text-warning"
        )}
      >
        {policyDoc.matchesLinkedPolicy
          ? "Matches your linked policy"
          : "Does not match linked policy"}
      </p>
      {policyDoc.validationNotes.length > 0 ? (
        <ul className="text-xs text-muted-foreground list-disc pl-4 pt-1 space-y-0.5">
          {policyDoc.validationNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ) : null}
    </SectionCard>
  );
}

function MedicalSection({ medical }: { medical: NonNullable<ClaimIntelligenceReport["medical"]> }) {
  const hasVetContext =
    isMeaningfulReportValue(medical.diagnosis) &&
    /\b(dog|cat|pet|paw|muzzle|veterinar|animal)\b/i.test(medical.diagnosis ?? "");

  return (
    <SectionCard
      icon={Stethoscope}
      title={hasVetContext ? "Pet injury assessment" : "Injury & treatment assessment"}
      gradient="bg-gradient-to-r from-rose-500/[0.08] to-transparent"
    >
      {isMeaningfulReportValue(medical.diagnosis) ? (
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">What we see: </span>
          {medical.diagnosis}
        </p>
      ) : null}
      {isMeaningfulReportValue(medical.treatmentType) ? (
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Treatment: </span>
          {medical.treatmentType}
        </p>
      ) : null}
      {isMeaningfulReportValue(medical.hospital) ? (
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Clinic / hospital: </span>
          {medical.hospital}
        </p>
      ) : null}
      <p className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Severity: </span>
        {medicalComplexityLabel(medical.complexity)}
      </p>
    </SectionCard>
  );
}

function buildIntelligenceRichCards(report: ClaimIntelligenceReport): ClaimRichCardData[] {
  const cards: ClaimRichCardData[] = [];

  if (report.vehicle) {
    cards.push({
      id: "vehicle",
      title: "Vehicle damage",
      description: `Severity assessed as ${damageSeverityLabel(report.vehicle.severity).toLowerCase()} with ${report.vehicle.severityConfidence}% confidence.`,
      icon: Car,
      gradient: "bg-gradient-to-br from-amber-500/35 via-orange-400/20 to-amber-300/10",
      accent: "warning",
      detail:
        report.vehicle.damagedParts.length > 0
          ? `Parts: ${report.vehicle.damagedParts.slice(0, 3).join(", ")}`
          : `Repair est. ${formatPkr(report.vehicle.estimatedCostMinPkr)} – ${formatPkr(report.vehicle.estimatedCostMaxPkr)}`,
      status:
        report.vehicle.severity === "severe"
          ? "warning"
          : report.vehicle.severity === "minor"
            ? "success"
            : "default",
    });
  }

  if (report.identity) {
    cards.push({
      id: "identity",
      title: "Identity check",
      description: report.identity.profileMatchReason,
      icon: UserCheck,
      gradient: "bg-gradient-to-br from-emerald-500/35 via-teal-400/20 to-green-300/10",
      accent: "success",
      detail:
        isMeaningfulReportValue(report.identity.extractedName)
          ? report.identity.extractedName
          : report.identity.matchesUserProfile
            ? "Identity verified"
            : "Verification needed",
      status: report.identity.matchesUserProfile ? "success" : "warning",
    });
  }

  if (report.policyDoc) {
    cards.push({
      id: "policy",
      title: "Policy document",
      description: report.policyDoc.matchesLinkedPolicy
        ? "Document aligns with your linked policy on file."
        : "Policy details need a closer look before submission.",
      icon: FileBadge,
      gradient: "bg-gradient-to-br from-blue-500/35 via-indigo-400/20 to-violet-300/10",
      accent: "primary",
      detail: report.policyDoc.policyNumber ?? report.policyDoc.insurer,
      status: report.policyDoc.matchesLinkedPolicy ? "success" : "warning",
    });
  }

  if (report.medical) {
    const diagnosis = report.medical.diagnosis ?? "";
    const isPetInjury = /\b(dog|cat|pet|paw|muzzle|veterinar|animal)\b/i.test(diagnosis);
    cards.push({
      id: "medical",
      title: isPetInjury ? "Pet injury assessment" : "Injury assessment",
      description:
        isMeaningfulReportValue(diagnosis)
          ? diagnosis
          : isMeaningfulReportValue(report.medical.treatmentType)
            ? report.medical.treatmentType!
            : "AI reviewed injury visible in your photo against your claim description.",
      icon: Stethoscope,
      gradient: "bg-gradient-to-br from-rose-500/35 via-pink-400/20 to-rose-300/10",
      accent: "primary",
      detail: medicalComplexityLabel(report.medical.complexity),
      status: report.medical.complexity === "high" ? "warning" : "default",
    });
  }

  cards.push({
    id: "readiness",
    title: "Submission readiness",
    description: claimReadinessSeekerCopy(report.claimReadiness.score).subtitle,
    icon: ShieldCheck,
    gradient: "bg-gradient-to-br from-primary/30 via-blue-400/20 to-cyan-300/10",
    accent: "primary",
    detail: `${report.claimReadiness.score}% ready`,
    status:
      report.claimReadiness.score >= 85
        ? "success"
        : report.claimReadiness.score >= 60
          ? "default"
          : "warning",
  });

  cards.push({
    id: "consistency",
    title: "Consistency check",
    description: report.consistency.reason,
    icon: ShieldCheck,
    gradient: "bg-gradient-to-br from-slate-500/25 via-gray-400/15 to-slate-300/10",
    accent: "primary",
    detail: consistencyCardStatus(report.consistency.level),
    status:
      report.consistency.level === "high"
        ? "success"
        : report.consistency.level === "low"
          ? "warning"
          : "default",
  });

  return cards;
}

function ChatAssistantRow({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...quickTransition, delay: reducedMotion ? 0 : delay }}
      className="flex gap-3 max-w-full"
    >
      <motion.div
        animate={reducedMotion ? undefined : { scale: [1, 1.04, 1] }}
        transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 5, ease: "easeInOut" }}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-primary/20 text-primary mt-1"
      >
        <Sparkles className="h-4 w-4" aria-hidden />
      </motion.div>
      <div className="min-w-0 flex-1 space-y-1">{children}</div>
    </motion.div>
  );
}

export function ClaimIntelligenceChatReport({
  report,
  variant = "inline",
}: {
  report: ClaimIntelligenceReport;
  variant?: ReportSurfaceVariant;
}) {
  const readinessCopy = claimReadinessSeekerCopy(report.claimReadiness.score);
  const recommendationHint = insurerRecommendationSeekerHint(report.insurerRecommendation);
  const richCards = buildIntelligenceRichCards(report);
  const surface = reportSurfaceClasses(variant);

  return (
    <div className="space-y-4" aria-label="AI Claims Intelligence Report">
      <ChatAssistantRow delay={0}>
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl rounded-tl-md border border-primary/20 bg-gradient-to-br from-primary/[0.07] shadow-md",
            surface.gradientVia,
            surface.gradientTo
          )}
        >
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[length:200%_200%] bg-gradient-to-r from-primary/[0.05] via-transparent to-primary/[0.08] opacity-70"
            {...sectionGradientShift}
          />
          <div className="relative px-4 py-4 flex flex-wrap items-center gap-4">
            <ReadinessRing score={report.claimReadiness.score} />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                AI Claims Intelligence Report
              </p>
              <h3 className="font-bold text-lg tracking-tight mt-0.5">{readinessCopy.headline}</h3>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <p className="text-sm text-muted-foreground leading-relaxed">{readinessCopy.subtitle}</p>
                <DemoReportBadge modelVersion={report.modelVersion} />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Generated {new Date(report.analyzedAt).toLocaleString()}
              </p>
            </div>
          </div>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.12 } },
            }}
            className="relative px-4 pb-4 flex flex-wrap gap-2"
          >
            {report.vehicle ? (
              <MetricTile
                label="Damage"
                value={damageSeverityLabel(report.vehicle.severity)}
                icon={Car}
                tone={
                  report.vehicle.severity === "severe"
                    ? "warning"
                    : report.vehicle.severity === "minor"
                      ? "success"
                      : "default"
                }
                index={0}
                surfaceClass={surface.panelSoft}
              />
            ) : null}
            <MetricTile
              label="Consistency"
              value={consistencyCheckLabel(report.consistency.level)}
              icon={ShieldCheck}
              tone={
                report.consistency.level === "low"
                  ? "warning"
                  : report.consistency.level === "high"
                    ? "success"
                    : "default"
              }
              index={report.vehicle ? 1 : 0}
              surfaceClass={surface.panelSoft}
            />
            <MetricTile
              label="Documents"
              value={documentVerificationLabel(report)}
              icon={FileBadge}
              index={report.vehicle ? 2 : 1}
              surfaceClass={surface.panelSoft}
            />
          </motion.div>
        </div>
      </ChatAssistantRow>

      <ChatAssistantRow delay={0.04}>
        <ClaimRichCardRow cards={richCards} label="Report overview" surface={variant} />
      </ChatAssistantRow>

      <ChatAssistantRow delay={0.06}>
        <div className={cn("rounded-2xl rounded-tl-md border border-border/70 shadow-sm p-4", surface.panel)}>
          <p className="text-sm font-semibold mb-3">Submission readiness</p>
          <ReadinessCheckList report={report} />
        </div>
      </ChatAssistantRow>

      {(report.vehicle || report.identity || report.policyDoc || report.medical) && (
        <ChatAssistantRow delay={0.1}>
          <div
            className={cn(
              "rounded-2xl rounded-tl-md border border-border/70 shadow-sm p-4 space-y-3 w-full",
              surface.panel
            )}
          >
            <p className="text-sm font-semibold">Evidence analysis</p>
            {report.vehicle ? <VehicleSection vehicle={report.vehicle} /> : null}
            {report.identity ? <IdentitySection identity={report.identity} /> : null}
            {report.policyDoc ? <PolicyDocSection policyDoc={report.policyDoc} /> : null}
            {report.medical ? <MedicalSection medical={report.medical} /> : null}
          </div>
        </ChatAssistantRow>
      )}

      {report.policyAlignment && !report.policyAlignment.matchesPolicyCategory ? (
        <ChatAssistantRow delay={0.12}>
          <motion.div className="rounded-2xl rounded-tl-md border border-destructive/30 bg-destructive/[0.06] p-4 w-full">
            <p className="text-sm font-semibold text-destructive">Policy category mismatch</p>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              {report.policyAlignment.reason}
            </p>
          </motion.div>
        </ChatAssistantRow>
      ) : null}

      {!applicationLooksComplete(report) ? (
        <ChatAssistantRow delay={0.13}>
          <ClaimIncompleteApplicationNotice report={report} audience="seeker" />
        </ChatAssistantRow>
      ) : null}

      {report.consistency.level !== "high" || report.suspiciousFlags.length > 0 ? (
        <ChatAssistantRow delay={0.14}>
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={quickTransition}
            className="rounded-2xl rounded-tl-md border border-warning/30 bg-warning/[0.06] shadow-sm p-4 space-y-2 w-full"
          >
            <div className="flex items-center gap-2 text-warning">
              <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden />
              <p className="text-sm font-semibold">Items to review</p>
            </div>
            {report.consistency.level !== "high" ? (
              <p className="text-sm text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Consistency:</strong> {report.consistency.reason}
              </p>
            ) : null}
            {report.suspiciousFlags.length > 0 ? (
              <motion.ul
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
                }}
                className="text-sm text-muted-foreground space-y-1"
              >
                {report.suspiciousFlags.map((flag) => (
                  <motion.li key={flag} variants={fadeUpItem} className="flex gap-2">
                    <span className="text-warning mt-1.5 w-1 h-1 rounded-full bg-warning shrink-0" />
                    {flag}
                  </motion.li>
                ))}
              </motion.ul>
            ) : null}
          </motion.div>
        </ChatAssistantRow>
      ) : null}

      <ChatAssistantRow delay={0.18}>
        <div
          className={cn(
            "rounded-2xl rounded-tl-md border border-border/70 shadow-sm overflow-hidden w-full",
            surface.panel
          )}
        >
          <div className="px-4 py-3.5 border-b border-border/50 bg-gradient-to-r from-primary/[0.05] to-transparent">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Executive summary
            </p>
            <p className="text-sm font-semibold text-primary mt-1">
              {insurerRecommendationLabel(report.insurerRecommendation)}
            </p>
          </div>
          <div className="px-4 py-3.5 space-y-2">
            <p className="text-sm leading-relaxed text-foreground/90">{report.executiveSummary}</p>
            <p className="text-sm text-muted-foreground">{recommendationHint}</p>
          </div>
        </div>
      </ChatAssistantRow>
    </div>
  );
}

export function ClaimIntelligenceFullReportDialog({
  report,
  open,
  onOpenChange,
}: {
  report: ClaimIntelligenceReport;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        aria-label="Close report"
        onClick={() => onOpenChange(false)}
      />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="claim-intelligence-full-report-title"
        className="relative z-[1] w-full sm:max-w-3xl max-h-[min(92vh,calc(100dvh-2rem))] overflow-hidden rounded-t-3xl sm:rounded-3xl border border-border bg-popover text-popover-foreground shadow-2xl flex flex-col"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border bg-popover px-4 py-3 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-5 h-5 text-primary shrink-0" />
            <h2 id="claim-intelligence-full-report-title" className="font-bold truncate">
              AI Claims Intelligence Report
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="p-2 rounded-lg hover:bg-muted"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto bg-popover p-4 sm:p-5">
          <ClaimIntelligenceChatReport report={report} variant="modal" />
        </div>
      </motion.div>
    </div>,
    document.body
  );
}

export function ClaimIntelligenceSubmitCard({
  report,
  submitting,
  canSubmit,
  onSubmit,
}: {
  report: ClaimIntelligenceReport;
  submitting: boolean;
  canSubmit: boolean;
  onSubmit: () => void;
}) {
  const complete = applicationLooksComplete(report);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...quickTransition, delay: 0.06 }}
      className="p-4 space-y-3"
    >
      <div className="flex items-start gap-3 rounded-xl bg-muted/30 px-3.5 py-3">
        <HeartPulse className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden />
        <p className="text-sm text-muted-foreground leading-relaxed">
          Your intelligence report (
          <AnimatedNumber value={report.claimReadiness.score} className="tabular-nums font-medium" />
          % ready) will be attached when you submit.
          {!complete
            ? " Your insurer may reject or request more information because of the gaps above — you can still submit now and fix items later."
            : " Your insurer will receive the full snapshot including evidence analysis."}
        </p>
      </div>
      <motion.button
        type="button"
        onClick={onSubmit}
        disabled={!canSubmit || submitting}
        whileHover={canSubmit && !submitting ? { scale: 1.01 } : undefined}
        whileTap={canSubmit && !submitting ? { scale: 0.99 } : undefined}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-foreground text-background font-semibold text-[15px] disabled:opacity-50"
      >
        {submitting
          ? "Sending to your insurer…"
          : complete
            ? "Submit claim for review"
            : "Submit anyway — application incomplete"}
      </motion.button>
    </motion.div>
  );
}

export function ClaimIntelligenceReportCard({
  report,
  compact = false,
}: {
  report: ClaimIntelligenceReport;
  compact?: boolean;
}) {
  const readinessCopy = claimReadinessSeekerCopy(report.claimReadiness.score);

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={quickTransition}
      className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.06] via-card to-card p-5 space-y-4 shadow-lg shadow-primary/[0.04]"
      aria-label="AI Claims Intelligence Report"
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[length:200%_200%] bg-gradient-to-r from-primary/[0.04] via-transparent to-primary/[0.06] opacity-60"
        {...sectionGradientShift}
      />
      <div className="relative flex flex-wrap items-start gap-4">
        <ReadinessRing score={report.claimReadiness.score} size={80} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" aria-hidden />
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              AI Claims Intelligence
            </span>
          </div>
          <h3 className="font-bold text-lg tracking-tight mt-1">{readinessCopy.headline}</h3>
          <p className="text-sm text-muted-foreground mt-1">{readinessCopy.subtitle}</p>
        </div>
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
        }}
        className="relative flex flex-wrap gap-2"
      >
        {report.vehicle ? (
          <MetricTile
            label="Damage severity"
            value={damageSeverityLabel(report.vehicle.severity)}
            icon={Car}
            index={0}
          />
        ) : null}
        <MetricTile
          label="Consistency"
          value={consistencyCheckLabel(report.consistency.level)}
          icon={ShieldCheck}
          index={report.vehicle ? 1 : 0}
        />
        <MetricTile
          label="Documents"
          value={documentVerificationLabel(report)}
          icon={FileBadge}
          index={report.vehicle ? 2 : 1}
        />
      </motion.div>

      <ReadinessCheckList report={report} />

      {!compact ? (
        <div className="relative space-y-3">
          {report.vehicle ? <VehicleSection vehicle={report.vehicle} /> : null}
          {report.identity ? <IdentitySection identity={report.identity} /> : null}
          {report.policyDoc ? <PolicyDocSection policyDoc={report.policyDoc} /> : null}
          {report.medical ? <MedicalSection medical={report.medical} /> : null}
        </div>
      ) : null}

      <div className="relative rounded-xl border border-border/70 bg-background/60 p-4">
        <p className="text-sm leading-relaxed">{report.executiveSummary}</p>
        <p className="text-sm font-semibold text-primary mt-2">
          {insurerRecommendationLabel(report.insurerRecommendation)}
        </p>
      </div>

      <p className="relative text-xs text-muted-foreground">{CLAIM_INTELLIGENCE_DISCLAIMER}</p>
    </motion.section>
  );
}

export function ClaimIntelligenceInsurerSummary({
  report,
  mlRisk,
  expandedMl,
  onToggleMlExpand,
  expandedEvidence = false,
  onToggleEvidence,
}: {
  report: ClaimIntelligenceReport;
  mlRisk?: ClaimMlRisk;
  expandedMl?: boolean;
  onToggleMlExpand?: () => void;
  expandedEvidence?: boolean;
  onToggleEvidence?: () => void;
}) {
  const costRange = report.vehicle
    ? `${formatPkr(report.vehicle.estimatedCostMinPkr)} – ${formatPkr(report.vehicle.estimatedCostMaxPkr)}`
    : null;

  const docVerification = documentVerificationLabel(report);
  const consistencyLabel = consistencyCheckLabel(report.consistency.level);
  const readinessCopy = claimReadinessSeekerCopy(report.claimReadiness.score);
  const hasEvidenceSections = Boolean(
    report.vehicle || report.identity || report.policyDoc || report.medical
  );
  const showEvidenceToggle = hasEvidenceSections && onToggleEvidence !== undefined;

  let metricIndex = 0;

  return (
    <div className="space-y-3">
      <motion.section
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={quickTransition}
        className="relative overflow-hidden rounded-xl border border-primary/25 bg-gradient-to-br from-primary/8 via-card to-card p-4 space-y-4 shadow-sm"
        aria-label="AI Claims Intelligence Report"
      >
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[length:200%_200%] bg-gradient-to-r from-primary/[0.05] via-transparent to-primary/[0.07] opacity-60"
          {...sectionGradientShift}
        />

        <div className="relative flex flex-wrap items-start gap-4">
          <ReadinessRing score={report.claimReadiness.score} size={64} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <motion.span
                animate={{ rotate: [0, 8, -8, 0] }}
                transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" }}
              >
                <Sparkles className="w-5 h-5 text-primary" aria-hidden />
              </motion.span>
              <h3 className="font-semibold text-lg">AI Claims Intelligence Report</h3>
            </div>
            <p className="text-sm font-medium text-foreground mt-1">{readinessCopy.headline}</p>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              {readinessCopy.subtitle}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {insurerRecommendationLabel(report.insurerRecommendation)}
            </p>
          </div>
        </div>

        {!applicationLooksComplete(report) ? (
          <ClaimIncompleteApplicationNotice report={report} audience="insurer" />
        ) : null}

        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.08 } },
          }}
          className="relative grid grid-cols-2 lg:grid-cols-3 gap-2"
        >
          {mlRisk ? (
            <MetricTile
              label="Risk score"
              value={`${mlRisk.score}/100`}
              index={metricIndex++}
            />
          ) : null}
          {report.vehicle ? (
            <MetricTile
              label="Damage severity"
              value={damageSeverityLabel(report.vehicle.severity)}
              index={metricIndex++}
            />
          ) : null}
          {costRange ? (
            <MetricTile label="Estimated cost" value={costRange} index={metricIndex++} />
          ) : null}
          <MetricTile label="Consistency check" value={consistencyLabel} index={metricIndex++} />
          <MetricTile label="Document verification" value={docVerification} index={metricIndex++} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...quickTransition, delay: 0.16 }}
          className="relative rounded-lg border border-border bg-muted/20 p-3"
        >
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Recommendation</p>
          <p className="text-sm font-semibold text-primary">
            {insurerRecommendationLabel(report.insurerRecommendation)}
          </p>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            {report.executiveSummary}
          </p>
        </motion.div>

        {showEvidenceToggle && onToggleEvidence ? (
          <>
            <motion.button
              type="button"
              onClick={onToggleEvidence}
              whileHover={{ x: 2 }}
              transition={quickTransition}
              className="relative inline-flex items-center gap-1 text-sm text-primary hover:underline font-medium"
              aria-expanded={expandedEvidence}
            >
              {expandedEvidence ? "Hide evidence analysis" : "Evidence analysis details"}
              <motion.span
                animate={{ rotate: expandedEvidence ? 180 : 0 }}
                transition={quickTransition}
                className="inline-flex"
              >
                <ChevronDown className="w-4 h-4" aria-hidden />
              </motion.span>
            </motion.button>
            <AnimatePresence initial={false}>
              {expandedEvidence ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={quickTransition}
                  className="relative overflow-hidden space-y-3"
                >
                  {report.vehicle ? <VehicleSection vehicle={report.vehicle} /> : null}
                  {report.identity ? <IdentitySection identity={report.identity} /> : null}
                  {report.policyDoc ? <PolicyDocSection policyDoc={report.policyDoc} /> : null}
                  {report.medical ? <MedicalSection medical={report.medical} /> : null}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </>
        ) : null}
      </motion.section>

      {mlRisk && onToggleMlExpand !== undefined ? (
        <ClaimRiskInsightCard
          mlRisk={mlRisk}
          expanded={expandedMl ?? false}
          onToggleExpand={onToggleMlExpand}
        />
      ) : null}
    </div>
  );
}

export function ClaimIntelligenceHistoryBadge({
  report,
  expanded,
  onToggle,
}: {
  report: ClaimIntelligenceReport;
  expanded: boolean;
  onToggle: () => void;
}) {
  const readinessCopy = claimReadinessSeekerCopy(report.claimReadiness.score);
  const [fullOpen, setFullOpen] = useState(false);

  return (
    <div className="mt-4 border-t border-border pt-4">
      <motion.button
        type="button"
        onClick={onToggle}
        whileHover={{ x: 2 }}
        transition={quickTransition}
        className="w-full flex items-center justify-between gap-3 rounded-xl border border-primary/15 bg-primary/[0.04] px-3.5 py-3 text-left hover:bg-primary/[0.07] transition-colors"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3 min-w-0">
          <ReadinessRing score={report.claimReadiness.score} size={44} />
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">AI Intelligence Report</p>
            <p className="text-xs text-muted-foreground truncate">{readinessCopy.headline}</p>
          </div>
        </div>
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={quickTransition}
          className="inline-flex shrink-0"
        >
          <ChevronDown className="w-4 h-4 text-primary" aria-hidden />
        </motion.span>
      </motion.button>
      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={quickTransition}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-2">
              <button
                type="button"
                onClick={() => setFullOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                Open full report
              </button>
              <ClaimIntelligenceReportCard report={report} compact />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <ClaimIntelligenceFullReportDialog
        report={report}
        open={fullOpen}
        onOpenChange={setFullOpen}
      />
    </div>
  );
}

export { humanizeClaimRiskFactor };
