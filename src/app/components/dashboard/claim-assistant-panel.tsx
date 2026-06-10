import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Car,
  FileBadge,
  FileText,
  HeartPulse,
  HelpCircle,
  Home,
  Loader2,
  PawPrint,
  Shield,
  Sparkles,
  Stethoscope,
  Upload,
  UserCheck,
  type LucideIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { ClaimIntelligenceReport } from "@/lib/claim-intelligence-types";
import { formatPkr } from "@/lib/format";
import { CLAIM_INTELLIGENCE_DISCLAIMER } from "@/lib/ml-insights";
import type { PurchaseSummary } from "@/lib/purchase-api";
import { quickTransition } from "@/lib/motion-presets";
import { cn } from "../ui/utils";
import {
  ClaimBotBubble,
  ClaimBotRow,
  ClaimChatHero,
  ClaimFileChip,
  ClaimInlinePanel,
  ClaimInputBar,
  ClaimQuickReplies,
  ClaimRichCardRow,
  ClaimStepFade,
  ClaimTypingIndicator,
  ClaimUserBubble,
  type ClaimRichCardData,
} from "./claim-chat-ui";
import {
  claimTypesForPolicyCategory,
  pendingFilesIncludeCnic,
} from "@/lib/claim-category-types";
import {
  ClaimIntelligenceChatReport,
  ClaimIntelligenceFullReportDialog,
  ClaimIntelligenceSubmitCard,
} from "./claim-intelligence-ui";

export type PendingClaimFile = {
  id: string;
  file: File;
  previewUrl?: string;
};

type FlowStep = "welcome" | "policy" | "type" | "details" | "evidence" | "report";

const CLAIM_TYPE_META: Record<
  string,
  { icon: LucideIcon; gradient: string }
> = {
  accident: {
    icon: Car,
    gradient: "bg-gradient-to-br from-slate-600/30 via-blue-500/20 to-slate-400/10",
  },
  damage: {
    icon: Home,
    gradient: "bg-gradient-to-br from-amber-500/25 via-orange-400/15 to-amber-300/10",
  },
  theft: {
    icon: Shield,
    gradient: "bg-gradient-to-br from-violet-500/25 via-purple-400/15 to-indigo-300/10",
  },
  medical: {
    icon: Stethoscope,
    gradient: "bg-gradient-to-br from-rose-500/25 via-pink-400/15 to-rose-300/10",
  },
  pet_care: {
    icon: PawPrint,
    gradient: "bg-gradient-to-br from-emerald-500/25 via-teal-400/15 to-green-300/10",
  },
  other: {
    icon: FileText,
    gradient: "bg-gradient-to-br from-slate-500/20 via-gray-400/15 to-slate-300/10",
  },
};

const INFO_REPLIES: Record<string, { title: string; body: string }> = {
  documents: {
    title: "What to upload",
    body: "Clear photos of damage, police reports, medical bills, CNIC, or your policy document work best. Up to 3 files, 4 MB each — images or PDF.",
  },
  ai: {
    title: "How AI & ML analysis works",
    body: "Our hybrid AI engine reviews your description and uploads in memory only — nothing is stored until you submit. You get smart insights: readiness score, consistency checks, fraud signals, and a personalized executive summary for your insurer.",
  },
  privacy: {
    title: "Your privacy",
    body: "Evidence is analyzed securely and never saved to our servers until you tap Submit. You can file a claim without generating a report.",
  },
};

export interface ClaimAssistantPanelProps {
  purchases: PurchaseSummary[];
  /** Deep-link hint only — user must still confirm policy in the wizard. */
  initialPurchaseId?: string;
  selectedPurchaseId: string;
  onSelectPurchase: (id: string) => void;
  claimType: string;
  onClaimTypeChange: (type: string) => void;
  otherClaimType: string;
  onOtherClaimTypeChange: (value: string) => void;
  incidentDate: string;
  onIncidentDateChange: (value: string) => void;
  estimatedAmountPkr: string;
  onEstimatedAmountChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  pendingFiles: PendingClaimFile[];
  onAddFiles: (files: FileList | null) => void;
  onRemoveFile: (id: string) => void;
  maxFiles: number;
  allowedTypes: string[];
  analyzing: boolean;
  submitting: boolean;
  intelligenceReport: ClaimIntelligenceReport | null;
  onGenerateReport: () => void;
  onSubmit: () => void;
  canGenerate: boolean;
  canSubmit: boolean;
  userActionTimestamp: Date | null;
}

function titleCase(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const STEP_ORDER: FlowStep[] = ["welcome", "policy", "type", "details", "evidence", "report"];

function stepIndex(step: FlowStep): number {
  return STEP_ORDER.indexOf(step);
}

export function ClaimAssistantPanel({
  purchases,
  initialPurchaseId = "",
  selectedPurchaseId,
  onSelectPurchase,
  claimType,
  onClaimTypeChange,
  otherClaimType,
  onOtherClaimTypeChange,
  incidentDate,
  onIncidentDateChange,
  estimatedAmountPkr,
  onEstimatedAmountChange,
  description,
  onDescriptionChange,
  pendingFiles,
  onAddFiles,
  onRemoveFile,
  maxFiles,
  allowedTypes,
  analyzing,
  submitting,
  intelligenceReport,
  onGenerateReport,
  onSubmit,
  canGenerate,
  canSubmit,
  userActionTimestamp,
}: ClaimAssistantPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeStep, setActiveStep] = useState<FlowStep>("welcome");
  const [infoReply, setInfoReply] = useState<string | null>(null);
  const [draftDescription, setDraftDescription] = useState("");
  const [confirmedDescription, setConfirmedDescription] = useState(false);
  const [confirmedPolicyId, setConfirmedPolicyId] = useState("");
  const [confirmedClaimType, setConfirmedClaimType] = useState("");
  const [stepTimestamp, setStepTimestamp] = useState<Date | null>(null);
  const [reportViewOpen, setReportViewOpen] = useState(false);
  const [fullReportOpen, setFullReportOpen] = useState(false);

  const confirmedPurchase = purchases.find((p) => p.id === confirmedPolicyId);
  const activePolicyCategory =
    confirmedPurchase?.policy?.category ??
    purchases.find((p) => p.id === selectedPurchaseId)?.policy?.category;
  const availableClaimTypes = useMemo(
    () =>
      claimTypesForPolicyCategory(activePolicyCategory).map((type) => ({
        ...type,
        icon: CLAIM_TYPE_META[type.id]?.icon ?? FileText,
        gradient: CLAIM_TYPE_META[type.id]?.gradient ?? CLAIM_TYPE_META.other.gradient,
      })),
    [activePolicyCategory]
  );
  const claimTypeMeta = availableClaimTypes.find((t) => t.id === confirmedClaimType);
  const hasCnicInUploads = pendingFilesIncludeCnic(pendingFiles);

  const displayStep: FlowStep =
    intelligenceReport && reportViewOpen ? "report" : activeStep;

  useEffect(() => {
    if (!intelligenceReport) {
      setReportViewOpen(false);
    } else {
      setReportViewOpen(true);
    }
  }, [intelligenceReport]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [
    displayStep,
    intelligenceReport,
    analyzing,
    infoReply,
    pendingFiles.length,
    description,
    confirmedPolicyId,
    confirmedClaimType,
  ]);

  const advanceStep = useCallback((next: FlowStep) => {
    setStepTimestamp(new Date());
    setActiveStep(next);
  }, []);

  const handleStartClaim = () => {
    setInfoReply(null);
    setConfirmedPolicyId("");
    setConfirmedClaimType("");
    setConfirmedDescription(false);
    setDraftDescription("");
    onSelectPurchase(initialPurchaseId && purchases.some((p) => p.id === initialPurchaseId) ? initialPurchaseId : "");
    onClaimTypeChange("");
    advanceStep("policy");
  };

  const handleQuickReply = (id: string) => {
    if (id === "start") {
      handleStartClaim();
      return;
    }
    if (INFO_REPLIES[id]) {
      setInfoReply(id);
    }
  };

  const handleSelectPolicy = (id: string) => {
    if (activeStep !== "policy" || analyzing) return;
    onSelectPurchase(id);
  };

  const handleConfirmPolicy = () => {
    if (!selectedPurchaseId || analyzing) return;
    setConfirmedPolicyId(selectedPurchaseId);
    const category = purchases.find((p) => p.id === selectedPurchaseId)?.policy?.category;
    const allowed = claimTypesForPolicyCategory(category).map((t) => t.id);
    if (claimType && !allowed.includes(claimType)) {
      onClaimTypeChange("");
    }
    advanceStep("type");
  };

  const handleSelectClaimType = (id: string) => {
    if (activeStep !== "type" || analyzing) return;
    onClaimTypeChange(id);
  };

  const handleConfirmClaimType = () => {
    if (!claimType || analyzing) return;
    setConfirmedClaimType(claimType);
    advanceStep("details");
  };

  const handleConfirmDescription = () => {
    const trimmed = draftDescription.trim();
    if (trimmed.length < 5) return;
    if (claimType === "other" && otherClaimType.trim().length < 2) return;
    onDescriptionChange(trimmed);
    setConfirmedDescription(true);
    advanceStep("evidence");
  };

  const handleAttach = () => fileInputRef.current?.click();

  const evidenceGuideCards = useMemo((): ClaimRichCardData[] => {
    const cards: ClaimRichCardData[] = [
      {
        id: "photos",
        title: "Damage photos",
        description: "Clear, well-lit images from multiple angles help assess severity and repair scope.",
        icon: Car,
        gradient: "bg-gradient-to-br from-blue-500/30 to-cyan-400/15",
        accent: "primary",
      },
      {
        id: "identity",
        title: "ID verification",
        description: "Upload your CNIC or government ID so we can match your profile before submission.",
        icon: UserCheck,
        gradient: "bg-gradient-to-br from-emerald-500/30 to-teal-400/15",
        accent: "success",
      },
      {
        id: "policy",
        title: "Policy document",
        description: "A photo or PDF of your policy helps confirm coverage and policy number alignment.",
        icon: FileBadge,
        gradient: "bg-gradient-to-br from-indigo-500/30 to-violet-400/15",
        accent: "primary",
      },
      {
        id: "medical",
        title: "Medical records",
        description: "Hospital bills, prescriptions, or discharge summaries for health-related claims.",
        icon: HeartPulse,
        gradient: "bg-gradient-to-br from-rose-500/30 to-pink-400/15",
        accent: "primary",
      },
    ];
    return cards;
  }, []);

  const welcomeTime = useMemo(() => new Date(), []);
  const actionTime = userActionTimestamp ?? undefined;

  if (purchases.length === 0) {
    return (
      <section
        className="rounded-3xl border border-border bg-card shadow-xl overflow-hidden flex flex-col"
        style={{ minHeight: "min(78vh, 680px)" }}
        aria-label="Claims assistant"
      >
        <ClaimChatHero />
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="font-bold text-xl tracking-tight">No active policies</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm leading-relaxed">
            Complete a policy purchase first, then return here for AI-powered claim filing with
            smart evidence review and personalized recommendations.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      className="rounded-3xl border border-border bg-card shadow-xl overflow-hidden flex flex-col"
      style={{ minHeight: "min(78vh, 680px)", maxHeight: "min(85vh, 760px)" }}
      aria-label="Claims assistant"
    >
      <header className="shrink-0 flex items-center justify-between border-b border-border px-5 py-3.5 bg-card">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-base tracking-tight truncate">AI Claims Assistant</p>
            <p className="text-xs text-muted-foreground">Smart insights · ML-powered · Secure</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
          <Shield className="h-3.5 w-3.5 text-primary" aria-hidden />
          <span className="hidden sm:inline">Files not stored until submit</span>
        </div>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto px-4 py-5 flex flex-col gap-5 bg-muted/15"
      >
        <ClaimChatHero />

        <ClaimBotRow timestamp={welcomeTime}>
          <ClaimBotBubble>
            <p>
              Hi there! I&apos;m your ClearClever AI claims assistant. I&apos;ll guide you with
              personalized recommendations — from evidence upload to a smart intelligence report
              your insurer can trust.
            </p>
          </ClaimBotBubble>
        </ClaimBotRow>

        {displayStep === "welcome" && (
          <ClaimQuickReplies
            options={[
              { id: "start", label: "File a new claim", icon: FileText },
              { id: "documents", label: "What should I upload?", icon: Upload },
              { id: "ai", label: "How does AI analysis work?", icon: Sparkles },
            ]}
            onSelect={handleQuickReply}
          />
        )}

        {infoReply && INFO_REPLIES[infoReply] ? (
          <ClaimBotRow delay={0.04}>
            <ClaimBotBubble>
              <p className="font-semibold text-foreground mb-1">{INFO_REPLIES[infoReply].title}</p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {INFO_REPLIES[infoReply].body}
              </p>
            </ClaimBotBubble>
          </ClaimBotRow>
        ) : null}

        {stepIndex(displayStep) >= stepIndex("policy") ? (
          <>
            <ClaimUserBubble timestamp={userActionTimestamp ?? stepTimestamp ?? actionTime}>
              I&apos;d like to file a claim
            </ClaimUserBubble>

            <ClaimStepFade show={stepIndex(displayStep) >= stepIndex("policy")}>
              <ClaimBotRow delay={0.03}>
                <ClaimBotBubble>
                  <p>Which policy is this claim for? Select the coverage that applies.</p>
                </ClaimBotBubble>
              </ClaimBotRow>

              <ClaimBotRow delay={0.05}>
                <ClaimInlinePanel title="Your policies">
                  <div className="grid sm:grid-cols-2 gap-2">
                    {purchases.map((purchase) => {
                      const active =
                        activeStep === "policy"
                          ? purchase.id === selectedPurchaseId
                          : purchase.id === confirmedPolicyId;
                      const locked = stepIndex(displayStep) > stepIndex("policy");
                      return (
                        <motion.button
                          key={purchase.id}
                          type="button"
                          onClick={() => handleSelectPolicy(purchase.id)}
                          disabled={locked || analyzing}
                          whileHover={locked ? undefined : { scale: 1.01 }}
                          whileTap={locked ? undefined : { scale: 0.99 }}
                          className={cn(
                            "rounded-xl border p-3.5 text-left transition-colors",
                            active
                              ? "border-primary bg-primary/[0.06] ring-1 ring-primary/25"
                              : "border-border bg-background hover:border-primary/30 hover:bg-muted/30",
                            locked && !active && "opacity-60"
                          )}
                        >
                          <p className="font-semibold text-sm truncate">
                            {purchase.policy?.name ?? "Policy"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {purchase.insurer?.companyName}
                            {purchase.policy?.category
                              ? ` · ${titleCase(purchase.policy.category)}`
                              : ""}
                          </p>
                          {purchase.policy?.premiumMonthlyPkr ? (
                            <p className="text-xs text-primary font-medium mt-1.5">
                              {formatPkr(purchase.policy.premiumMonthlyPkr)}/mo
                            </p>
                          ) : null}
                        </motion.button>
                      );
                    })}
                  </div>
                  {activeStep === "policy" && selectedPurchaseId ? (
                    <button
                      type="button"
                      onClick={handleConfirmPolicy}
                      disabled={analyzing}
                      className="mt-3 w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
                    >
                      Continue with selected policy
                    </button>
                  ) : null}
                </ClaimInlinePanel>
              </ClaimBotRow>
            </ClaimStepFade>
          </>
        ) : null}

        {confirmedPurchase && stepIndex(displayStep) >= stepIndex("type") ? (
          <ClaimUserBubble timestamp={stepTimestamp ?? actionTime}>
            {confirmedPurchase.policy?.name ?? "Selected policy"}
            {confirmedPurchase.insurer?.companyName
              ? ` — ${confirmedPurchase.insurer.companyName}`
              : ""}
          </ClaimUserBubble>
        ) : null}

        {(confirmedPolicyId || activeStep === "type") && stepIndex(displayStep) >= stepIndex("type") ? (
          <ClaimStepFade show={stepIndex(displayStep) >= stepIndex("type")}>
            <ClaimBotRow delay={0.04}>
              <ClaimBotBubble>
                <p>
                  What type of claim are you filing? Options match your{" "}
                  {activePolicyCategory ? `${titleCase(activePolicyCategory)} ` : ""}
                  policy — pick the one that best describes your situation.
                </p>
              </ClaimBotBubble>
            </ClaimBotRow>

            <ClaimBotRow delay={0.06}>
              <div className="w-full overflow-x-auto pb-1 -mx-1 px-1">
                <div className="flex gap-2.5 min-w-max sm:min-w-0 sm:grid sm:grid-cols-3 sm:gap-2">
                  {availableClaimTypes.map((type) => {
                    const Icon = type.icon;
                    const active =
                      activeStep === "type"
                        ? claimType === type.id
                        : type.id === confirmedClaimType;
                    const locked = stepIndex(displayStep) > stepIndex("type");
                    return (
                      <motion.button
                        key={type.id}
                        type="button"
                        onClick={() => handleSelectClaimType(type.id)}
                        disabled={locked || analyzing}
                        whileHover={locked ? undefined : { y: -2 }}
                        transition={quickTransition}
                        className={cn(
                          "flex w-[148px] sm:w-auto flex-col rounded-xl border p-3 text-left shrink-0 sm:shrink",
                          active
                            ? "border-primary bg-primary/[0.06] shadow-sm ring-1 ring-primary/20"
                            : "border-border bg-card hover:border-primary/25 hover:shadow-sm",
                          locked && !active && "opacity-60"
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-full mb-2",
                            type.gradient
                          )}
                        >
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <p className="font-semibold text-sm">{type.label}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug line-clamp-2">
                          {type.description}
                        </p>
                      </motion.button>
                    );
                  })}
                </div>
                {activeStep === "type" && claimType ? (
                  <button
                    type="button"
                    onClick={handleConfirmClaimType}
                    disabled={analyzing}
                    className="mt-3 w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
                  >
                    Continue with this claim type
                  </button>
                ) : null}
              </div>
            </ClaimBotRow>
          </ClaimStepFade>
        ) : null}

        {claimTypeMeta && stepIndex(displayStep) >= stepIndex("details") ? (
          <ClaimUserBubble timestamp={stepTimestamp ?? actionTime}>
            {confirmedClaimType === "other" && otherClaimType.trim()
              ? otherClaimType.trim()
              : claimTypeMeta.label}{" "}
            claim
          </ClaimUserBubble>
        ) : null}

        {confirmedClaimType && stepIndex(displayStep) >= stepIndex("details") ? (
          <ClaimStepFade show={stepIndex(displayStep) >= stepIndex("details")}>
            <ClaimBotRow delay={0.04}>
              <ClaimBotBubble>
                <p>
                  Tell me what happened — include the date, estimated cost if you know it, and a
                  clear description. Our ML models use this for smart consistency checks with your
                  evidence.
                </p>
              </ClaimBotBubble>
            </ClaimBotRow>

            <ClaimBotRow delay={0.06}>
              <ClaimInlinePanel title="Incident details">
                <div className="space-y-3">
                  {claimType === "other" ? (
                    <label className="block">
                      <span className="text-xs font-medium text-muted-foreground">Claim type label</span>
                      <input
                        type="text"
                        value={otherClaimType}
                        onChange={(e) => onOtherClaimTypeChange(e.target.value)}
                        placeholder="e.g. Water damage"
                        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </label>
                  ) : null}
                  <div className="grid sm:grid-cols-2 gap-3">
                    <label className="block">
                      <span className="text-xs font-medium text-muted-foreground">Incident date</span>
                      <input
                        type="date"
                        value={incidentDate}
                        onChange={(e) => onIncidentDateChange(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium text-muted-foreground">
                        Estimated amount (PKR, optional)
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={estimatedAmountPkr}
                        onChange={(e) => onEstimatedAmountChange(e.target.value)}
                        placeholder="e.g. 45000"
                        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </label>
                  </div>
                  <label className="block">
                    <span className="text-xs font-medium text-muted-foreground">What happened?</span>
                    <textarea
                      value={confirmedDescription ? description : draftDescription}
                      onChange={(e) => {
                        if (confirmedDescription) {
                          onDescriptionChange(e.target.value);
                        } else {
                          setDraftDescription(e.target.value);
                        }
                      }}
                      rows={3}
                      placeholder="Describe the incident clearly — location, damage, and timeline…"
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </label>
                  {!confirmedDescription ? (
                    <motion.button
                      type="button"
                      onClick={handleConfirmDescription}
                      disabled={
                        (confirmedDescription ? description : draftDescription).trim().length < 5 ||
                        (claimType === "other" && otherClaimType.trim().length < 2)
                      }
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 hover:opacity-95 transition-opacity"
                    >
                      Continue to evidence upload
                    </motion.button>
                  ) : null}
                </div>
              </ClaimInlinePanel>
            </ClaimBotRow>
          </ClaimStepFade>
        ) : null}

        {stepIndex(displayStep) >= stepIndex("evidence") && confirmedDescription && description.trim().length >= 5 ? (
          <ClaimStepFade show={stepIndex(displayStep) >= stepIndex("evidence")}>
            <ClaimUserBubble timestamp={stepTimestamp ?? actionTime}>
              <span className="line-clamp-3">{description}</span>
            </ClaimUserBubble>

            <ClaimBotRow delay={0.04}>
              <ClaimBotBubble>
                <p>
                  Now upload your evidence. These cards show what helps most — add up to {maxFiles}{" "}
                  files below.
                </p>
              </ClaimBotBubble>
            </ClaimBotRow>

            <ClaimBotRow delay={0.06}>
              <ClaimRichCardRow cards={evidenceGuideCards} label="Recommended evidence" />
            </ClaimBotRow>

            {pendingFiles.length > 0 && !hasCnicInUploads ? (
              <ClaimBotRow delay={0.07}>
                <ClaimBotBubble>
                  <p className="font-semibold text-warning">CNIC not in your uploads</p>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    You can still submit, but your AI report will flag identity as incomplete and
                    approval confidence will be lower. Add a clear CNIC photo to move toward 100%
                    readiness.
                  </p>
                </ClaimBotBubble>
              </ClaimBotRow>
            ) : null}

            <ClaimBotRow delay={0.08}>
              <ClaimInlinePanel title="Your uploads">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={allowedTypes.join(",")}
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    onAddFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
                {pendingFiles.length === 0 ? (
                  <motion.button
                    type="button"
                    onClick={handleAttach}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/20 py-8 hover:border-primary/40 hover:bg-primary/[0.03] transition-colors"
                  >
                    <Upload className="h-8 w-8 text-primary" />
                    <span className="text-sm font-semibold">Add photos or PDFs</span>
                    <span className="text-xs text-muted-foreground">
                      JPEG, PNG, WebP, GIF, or PDF · max {maxFiles} files
                    </span>
                  </motion.button>
                ) : (
                  <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                      <div className="flex flex-wrap gap-2">
                        {pendingFiles.map((pf) => (
                          <ClaimFileChip
                            key={pf.id}
                            name={pf.file.name}
                            previewUrl={pf.previewUrl}
                            onRemove={() => onRemoveFile(pf.id)}
                          />
                        ))}
                      </div>
                    </AnimatePresence>
                    {pendingFiles.length < maxFiles ? (
                      <button
                        type="button"
                        onClick={handleAttach}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        + Add another file
                      </button>
                    ) : null}
                  </div>
                )}

                <div className="mt-4 flex flex-col sm:flex-row gap-2">
                  <motion.button
                    type="button"
                    onClick={onGenerateReport}
                    disabled={!canGenerate || analyzing}
                    whileHover={canGenerate && !analyzing ? { scale: 1.01 } : undefined}
                    whileTap={canGenerate && !analyzing ? { scale: 0.99 } : undefined}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50 shadow-sm"
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating smart insights…
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Generate AI intelligence report
                      </>
                    )}
                  </motion.button>
                  {intelligenceReport && !reportViewOpen ? (
                    <motion.button
                      type="button"
                      onClick={() => setReportViewOpen(true)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-primary bg-primary/10 text-primary font-semibold text-sm"
                    >
                      View your report
                    </motion.button>
                  ) : null}
                  <motion.button
                    type="button"
                    onClick={onSubmit}
                    disabled={!canSubmit || submitting || analyzing}
                    whileHover={canSubmit && !submitting && !analyzing ? { scale: 1.01 } : undefined}
                    whileTap={canSubmit && !submitting && !analyzing ? { scale: 0.99 } : undefined}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-border bg-background font-semibold text-sm disabled:opacity-50 hover:bg-muted/40 transition-colors"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Submitting…
                      </>
                    ) : (
                      "Submit without AI report (optional)"
                    )}
                  </motion.button>
                </div>
                <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
                  {CLAIM_INTELLIGENCE_DISCLAIMER}
                </p>
              </ClaimInlinePanel>
            </ClaimBotRow>
          </ClaimStepFade>
        ) : null}

        {analyzing ? <ClaimTypingIndicator /> : null}

        <AnimatePresence initial={false}>
          {intelligenceReport && reportViewOpen ? (
            <motion.div
              key="intelligence-report"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={quickTransition}
              className="space-y-4"
            >
              <ClaimBotRow delay={0.04}>
                <ClaimBotBubble>
                  <p className="font-semibold">Your intelligence report is ready.</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Review the cards below — they summarize readiness, evidence, and what your insurer
                    will see.
                  </p>
                </ClaimBotBubble>
              </ClaimBotRow>

              <div className="pl-12 pr-1 space-y-3">
                <button
                  type="button"
                  onClick={() => setFullReportOpen(true)}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Open full-screen report
                </button>
                <ClaimIntelligenceChatReport report={intelligenceReport} />
              </div>
              <ClaimIntelligenceFullReportDialog
                report={intelligenceReport}
                open={fullReportOpen}
                onOpenChange={setFullReportOpen}
              />

              <ClaimBotRow delay={0.12}>
                <ClaimInlinePanel>
                  <ClaimIntelligenceSubmitCard
                    report={intelligenceReport}
                    submitting={submitting}
                    canSubmit={canSubmit}
                    onSubmit={onSubmit}
                  />
                </ClaimInlinePanel>
              </ClaimBotRow>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {displayStep === "evidence" && !intelligenceReport && !analyzing && pendingFiles.length > 0 ? (
          <ClaimQuickReplies
            options={[
              { id: "documents", label: "What else should I add?", icon: HelpCircle },
            ]}
            onSelect={handleQuickReply}
            disabled={analyzing}
          />
        ) : null}
      </div>

      {displayStep === "details" && !confirmedDescription ? (
        <ClaimInputBar
          value={draftDescription}
          onChange={setDraftDescription}
          onSubmit={handleConfirmDescription}
          disabled={false}
          submitting={false}
          placeholder="Describe what happened (at least 5 characters)…"
        />
      ) : null}

      {displayStep === "evidence" && !intelligenceReport ? (
        <ClaimInputBar
          value=""
          onChange={() => undefined}
          onSubmit={() => undefined}
          onAttach={handleAttach}
          attachDisabled={pendingFiles.length >= maxFiles || analyzing}
          disabled={analyzing}
          submitting={analyzing}
          showSend={false}
          showInput={false}
          placeholder={
            analyzing
              ? "Generating your intelligence report…"
              : "Tap the clip to add more files, or use the buttons above to submit"
          }
        />
      ) : null}
    </section>
  );
}
