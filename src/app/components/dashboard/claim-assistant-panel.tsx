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
  ClaimTypingIndicator,
  ClaimUserBubble,
  type ClaimRichCardData,
} from "./claim-chat-ui";
import {
  ClaimIntelligenceChatReport,
  ClaimIntelligenceSubmitCard,
} from "./claim-intelligence-ui";

export type PendingClaimFile = {
  id: string;
  file: File;
  previewUrl?: string;
};

type FlowStep = "welcome" | "policy" | "type" | "details" | "evidence" | "report";

const CLAIM_TYPES: {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
}[] = [
  {
    id: "accident",
    label: "Accident",
    description: "Collision or road incident involving your vehicle",
    icon: Car,
    gradient: "bg-gradient-to-br from-slate-600/30 via-blue-500/20 to-slate-400/10",
  },
  {
    id: "damage",
    label: "Damage",
    description: "Physical damage to property, vehicle, or belongings",
    icon: Home,
    gradient: "bg-gradient-to-br from-amber-500/25 via-orange-400/15 to-amber-300/10",
  },
  {
    id: "theft",
    label: "Theft",
    description: "Stolen vehicle, belongings, or property",
    icon: Shield,
    gradient: "bg-gradient-to-br from-violet-500/25 via-purple-400/15 to-indigo-300/10",
  },
  {
    id: "medical",
    label: "Medical",
    description: "Health treatment, hospitalization, or medical expenses",
    icon: Stethoscope,
    gradient: "bg-gradient-to-br from-rose-500/25 via-pink-400/15 to-rose-300/10",
  },
  {
    id: "pet_care",
    label: "Pet care",
    description: "Veterinary treatment or pet-related incident",
    icon: PawPrint,
    gradient: "bg-gradient-to-br from-emerald-500/25 via-teal-400/15 to-green-300/10",
  },
  {
    id: "other",
    label: "Other",
    description: "Another claim type not listed above",
    icon: FileText,
    gradient: "bg-gradient-to-br from-slate-500/20 via-gray-400/15 to-slate-300/10",
  },
];

const INFO_REPLIES: Record<string, { title: string; body: string }> = {
  documents: {
    title: "What to upload",
    body: "Clear photos of damage, police reports, medical bills, CNIC, or your policy document work best. Up to 3 files, 4 MB each — images or PDF.",
  },
  ai: {
    title: "How AI analysis works",
    body: "Our AI reviews your description and uploads in memory only — nothing is stored until you submit. You receive a readiness score, consistency check, and executive summary for your insurer.",
  },
  privacy: {
    title: "Your privacy",
    body: "Evidence is analyzed securely and never saved to our servers until you tap Submit. You can file a claim without generating a report.",
  },
};

export interface ClaimAssistantPanelProps {
  purchases: PurchaseSummary[];
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

export function ClaimAssistantPanel({
  purchases,
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
  const [started, setStarted] = useState(false);
  const [infoReply, setInfoReply] = useState<string | null>(null);
  const [draftDescription, setDraftDescription] = useState("");
  const [confirmedDescription, setConfirmedDescription] = useState(false);

  const selectedPurchase = purchases.find((p) => p.id === selectedPurchaseId);
  const claimTypeMeta = CLAIM_TYPES.find((t) => t.id === claimType);

  const derivedStep = useMemo((): FlowStep => {
    if (!started) return "welcome";
    if (intelligenceReport) return "report";
    if (confirmedDescription && description.trim().length >= 5) return "evidence";
    if (claimType && selectedPurchaseId) return "details";
    if (selectedPurchaseId) return "type";
    return "policy";
  }, [
    started,
    intelligenceReport,
    confirmedDescription,
    description,
    claimType,
    selectedPurchaseId,
  ]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [derivedStep, intelligenceReport, analyzing, infoReply, pendingFiles.length, description]);

  const handleStartClaim = () => {
    setInfoReply(null);
    setStarted(true);
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
    onSelectPurchase(id);
  };

  const handleSelectClaimType = (id: string) => {
    onClaimTypeChange(id);
  };

  const handleConfirmDescription = () => {
    const trimmed = draftDescription.trim();
    if (trimmed.length < 5) return;
    onDescriptionChange(trimmed);
    setConfirmedDescription(true);
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
            Complete a policy purchase first, then return here to file a claim with AI-assisted
            evidence review.
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
            <p className="font-bold text-base tracking-tight truncate">Claims Assistant</p>
            <p className="text-xs text-muted-foreground">AI-assisted filing · Secure & private</p>
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
              Hi there! I&apos;m your ClearClever claims assistant. I&apos;ll guide you through
              filing a claim, reviewing your evidence, and preparing an intelligence report for your
              insurer.
            </p>
          </ClaimBotBubble>
        </ClaimBotRow>

        {derivedStep === "welcome" && (
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

        {started ? (
          <>
            <ClaimUserBubble timestamp={actionTime}>
              I&apos;d like to file a claim
            </ClaimUserBubble>

            <ClaimBotRow delay={0.03}>
              <ClaimBotBubble>
                <p>Which policy is this claim for? Select the coverage that applies.</p>
              </ClaimBotBubble>
            </ClaimBotRow>

            <ClaimBotRow delay={0.05}>
              <ClaimInlinePanel title="Your policies">
                <div className="grid sm:grid-cols-2 gap-2">
                  {purchases.map((purchase) => {
                    const active = purchase.id === selectedPurchaseId;
                    return (
                      <motion.button
                        key={purchase.id}
                        type="button"
                        onClick={() => handleSelectPolicy(purchase.id)}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className={cn(
                          "rounded-xl border p-3.5 text-left transition-colors",
                          active
                            ? "border-primary bg-primary/[0.06] ring-1 ring-primary/25"
                            : "border-border bg-background hover:border-primary/30 hover:bg-muted/30"
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
              </ClaimInlinePanel>
            </ClaimBotRow>
          </>
        ) : null}

        {selectedPurchase && started ? (
          <ClaimUserBubble timestamp={actionTime}>
            {selectedPurchase.policy?.name ?? "Selected policy"}
            {selectedPurchase.insurer?.companyName
              ? ` — ${selectedPurchase.insurer.companyName}`
              : ""}
          </ClaimUserBubble>
        ) : null}

        {started && selectedPurchaseId ? (
          <>
            <ClaimBotRow delay={0.04}>
              <ClaimBotBubble>
                <p>What type of claim are you filing? Pick the option that best describes your situation.</p>
              </ClaimBotBubble>
            </ClaimBotRow>

            <ClaimBotRow delay={0.06}>
              <div className="w-full overflow-x-auto pb-1 -mx-1 px-1">
                <div className="flex gap-2.5 min-w-max sm:min-w-0 sm:grid sm:grid-cols-3 sm:gap-2">
                  {CLAIM_TYPES.map((type) => {
                    const Icon = type.icon;
                    const active = claimType === type.id;
                    return (
                      <motion.button
                        key={type.id}
                        type="button"
                        onClick={() => handleSelectClaimType(type.id)}
                        whileHover={{ y: -2 }}
                        transition={quickTransition}
                        className={cn(
                          "flex w-[148px] sm:w-auto flex-col rounded-xl border p-3 text-left shrink-0 sm:shrink",
                          active
                            ? "border-primary bg-primary/[0.06] shadow-sm ring-1 ring-primary/20"
                            : "border-border bg-card hover:border-primary/25 hover:shadow-sm"
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
              </div>
            </ClaimBotRow>
          </>
        ) : null}

        {started && claimTypeMeta && (derivedStep === "details" || derivedStep === "evidence" || derivedStep === "report") ? (
          <ClaimUserBubble timestamp={actionTime}>
            {claimType === "other" && otherClaimType.trim()
              ? otherClaimType.trim()
              : claimTypeMeta.label}{" "}
            claim
          </ClaimUserBubble>
        ) : null}

        {(derivedStep === "details" || derivedStep === "evidence" || derivedStep === "report") &&
        selectedPurchaseId ? (
          <>
            <ClaimBotRow delay={0.04}>
              <ClaimBotBubble>
                <p>
                  Tell me what happened — include the date, estimated cost if you know it, and a
                  clear description. This helps our AI check consistency with your photos.
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
          </>
        ) : null}

        {(derivedStep === "evidence" || derivedStep === "report") && description.trim().length >= 5 ? (
          <>
            <ClaimUserBubble timestamp={actionTime}>
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

            <ClaimBotRow delay={0.08}>
              <ClaimInlinePanel title="Your uploads">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={allowedTypes.join(",")}
                  multiple
                  className="hidden"
                  onChange={(e) => onAddFiles(e.target.files)}
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
                        Generating report…
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Generate AI Claims Intelligence Report
                      </>
                    )}
                  </motion.button>
                </div>
                <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
                  {CLAIM_INTELLIGENCE_DISCLAIMER}
                </p>
              </ClaimInlinePanel>
            </ClaimBotRow>
          </>
        ) : null}

        {analyzing ? <ClaimTypingIndicator /> : null}

        <AnimatePresence initial={false}>
          {intelligenceReport ? (
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

              <div className="pl-12 pr-1">
                <ClaimIntelligenceChatReport report={intelligenceReport} />
              </div>

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

        {derivedStep === "evidence" && !intelligenceReport && !analyzing && pendingFiles.length > 0 ? (
          <ClaimQuickReplies
            options={[
              { id: "documents", label: "What else should I add?", icon: HelpCircle },
            ]}
            onSelect={handleQuickReply}
            disabled={analyzing}
          />
        ) : null}
      </div>

      {derivedStep !== "report" && (
        <ClaimInputBar
          value={draftDescription}
          onChange={(v) => {
            setDraftDescription(v);
            if (confirmedDescription) {
              onDescriptionChange(v);
            }
          }}
          onSubmit={() => {
            if (draftDescription.trim().length >= 5) {
              handleConfirmDescription();
            }
          }}
          onAttach={derivedStep === "evidence" || derivedStep === "details" ? handleAttach : undefined}
          attachDisabled={pendingFiles.length >= maxFiles}
          disabled={derivedStep === "welcome"}
          submitting={analyzing}
          placeholder={
            derivedStep === "welcome"
              ? "Type a message or use the suggestions above…"
              : "Add more detail about your incident…"
          }
        />
      )}
    </section>
  );
}
