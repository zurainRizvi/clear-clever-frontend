import { useEffect, useState } from "react";
import {
  ChevronDown,
  Info,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { ClaimMlRisk } from "@/lib/insurer-api";
import type { FraudMlSummary, FraudSignal } from "@/lib/admin-api";
import {
  ML_AI_DISCLAIMER,
  buildClaimFactorChartData,
  claimRiskInsightCopy,
  claimRiskPriorityLabel,
  fraudMlInsightCopy,
  fraudRulePriorityLabel,
  humanizeFraudFactor,
} from "@/lib/ml-insights";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  fadeUpItem,
  quickTransition,
  sectionGradientShift,
  staggerDelay,
} from "@/lib/motion-presets";
import { cn } from "../ui/utils";

export function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const reducedMotion = useReducedMotion();
  const [display, setDisplay] = useState(reducedMotion ? value : 0);

  useEffect(() => {
    if (reducedMotion) {
      setDisplay(value);
      return;
    }

    setDisplay(0);
    const durationMs = 720;
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(Math.round(eased * value));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, reducedMotion]);

  return (
    <motion.span
      key={value}
      initial={reducedMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={quickTransition}
      className={className}
    >
      {display}
    </motion.span>
  );
}

function RiskScoreRing({
  score,
  level,
  size = 64,
}: {
  score: number;
  level: ClaimMlRisk["level"];
  size?: number;
}) {
  const reducedMotion = useReducedMotion();
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const strokeTone =
    level === "high"
      ? "stroke-red-500"
      : level === "medium"
        ? "stroke-amber-500"
        : "stroke-emerald-500";

  const textTone =
    level === "high" ? "text-red-600" : level === "medium" ? "text-amber-600" : "text-emerald-600";

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-muted/40"
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
          transition={{ duration: reducedMotion ? 0 : 0.85, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <AnimatedNumber value={score} className={cn("text-xl font-bold tabular-nums leading-none", textTone)} />
        <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wide mt-0.5">
          Risk
        </span>
      </div>
    </div>
  );
}

function InsightExpandable({
  expanded,
  onToggle,
  collapsedLabel,
  expandedLabel,
  items,
}: {
  expanded: boolean;
  onToggle: () => void;
  collapsedLabel: string;
  expandedLabel: string;
  items: string[];
}) {
  if (items.length === 0) return null;

  return (
    <div className="pl-0 sm:pl-12">
      <motion.button
        type="button"
        onClick={onToggle}
        whileHover={{ x: 2 }}
        transition={quickTransition}
        className="inline-flex items-center gap-1 text-sm text-primary hover:underline font-medium"
        aria-expanded={expanded}
      >
        {expanded ? expandedLabel : collapsedLabel}
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={quickTransition}
          className="inline-flex"
        >
          <ChevronDown className="w-4 h-4" aria-hidden />
        </motion.span>
      </motion.button>
      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            key="factors"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={quickTransition}
            className="overflow-hidden"
          >
            <motion.ul
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.04 } },
              }}
              className="mt-2 space-y-1.5 text-sm text-muted-foreground"
            >
              {items.map((line) => (
                <motion.li key={line} variants={fadeUpItem} className="flex gap-2">
                  <span className="text-primary mt-1.5 w-1 h-1 rounded-full bg-primary shrink-0" />
                  <span>{line}</span>
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function MlDisclaimerBanner({ className }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...quickTransition, delay: 0.08 }}
      className={cn(
        "flex items-start gap-3 rounded-xl border border-border/80 bg-muted/30 px-4 py-3 text-sm",
        className
      )}
      role="note"
    >
      <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" aria-hidden />
      <p className="text-muted-foreground leading-relaxed">{ML_AI_DISCLAIMER}</p>
    </motion.div>
  );
}

function InsightMetric({
  label,
  value,
  sub,
  tone = "default",
  index = 0,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "warning" | "success";
  index?: number;
}) {
  const reducedMotion = useReducedMotion();
  const valueClass =
    tone === "warning"
      ? "text-warning"
      : tone === "success"
        ? "text-success"
        : "text-foreground";

  const numericMatch = value.match(/^(\d+)(.*)$/);
  const numericValue = numericMatch ? Number(numericMatch[1]) : null;
  const valueSuffix = numericMatch ? numericMatch[2] : null;

  return (
    <motion.div
      variants={fadeUpItem}
      initial="hidden"
      animate="visible"
      transition={{ ...quickTransition, delay: staggerDelay(index, !!reducedMotion, 0.06) }}
      whileHover={reducedMotion ? undefined : { y: -2, transition: quickTransition }}
      className="rounded-xl border border-border bg-card/80 p-4 min-w-0 sm:min-w-[140px] flex-1 shadow-sm"
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("text-2xl font-semibold mt-1 tabular-nums", valueClass)}>
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

export function ClaimRiskQueueSummary({
  highPriority,
  mediumPriority,
  lowPriority,
  total,
}: {
  highPriority: number;
  mediumPriority: number;
  lowPriority: number;
  total: number;
}) {
  if (total === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={quickTransition}
      className="relative overflow-hidden rounded-xl border border-primary/15 bg-gradient-to-br from-primary/5 via-card to-card p-5 space-y-4 shadow-sm"
      aria-label="AI review summary"
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[length:200%_200%] bg-gradient-to-r from-primary/[0.04] via-transparent to-primary/[0.06] opacity-60"
        {...sectionGradientShift}
      />
      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div>
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...quickTransition, delay: 0.05 }}
            className="flex items-center gap-2 text-primary font-medium text-sm"
          >
            <motion.span
              animate={{ rotate: [0, 8, -8, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" }}
            >
              <Sparkles className="w-4 h-4" aria-hidden />
            </motion.span>
            ClearClever AI review assist
          </motion.div>
          <h2 className="text-lg font-semibold mt-1">Claims queue at a glance</h2>
          <p className="text-sm text-muted-foreground mt-0.5 max-w-2xl">
            AI highlights claims that may need more attention. Use it to decide what to review first
            — not as an automatic decision.
          </p>
        </div>
      </div>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
        }}
        className="relative flex flex-wrap gap-3"
      >
        <InsightMetric
          label="Needs review"
          value={String(highPriority)}
          sub="High priority"
          tone={highPriority > 0 ? "warning" : "default"}
          index={0}
        />
        <InsightMetric label="Closer look" value={String(mediumPriority)} sub="Medium priority" index={1} />
        <InsightMetric
          label="Routine"
          value={String(lowPriority)}
          sub="Low priority"
          tone="success"
          index={2}
        />
        <InsightMetric label="With AI insights" value={String(total)} sub="In this list" index={3} />
      </motion.div>
    </motion.section>
  );
}

const CLAIM_TONE_STYLES: Record<
  ClaimMlRisk["level"],
  { border: string; bg: string; badge: string; icon: LucideIcon }
> = {
  low: {
    border: "border-emerald-200/80 dark:border-emerald-900/50",
    bg: "bg-emerald-50/50 dark:bg-emerald-950/20",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
    icon: ShieldCheck,
  },
  medium: {
    border: "border-amber-200/80 dark:border-amber-900/50",
    bg: "bg-amber-50/40 dark:bg-amber-950/20",
    badge: "bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-800",
    icon: Sparkles,
  },
  high: {
    border: "border-red-200/80 dark:border-red-900/50",
    bg: "bg-red-50/40 dark:bg-red-950/20",
    badge: "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800",
    icon: Sparkles,
  },
};

export function ClaimRiskInsightCard({
  mlRisk,
  expanded,
  onToggleExpand,
  claimContext,
}: {
  mlRisk: ClaimMlRisk;
  expanded: boolean;
  onToggleExpand: () => void;
  claimContext?: {
    incidentDate?: string;
    estimatedAmountPkr?: number;
    description?: string;
  };
}) {
  const copy = claimRiskInsightCopy(mlRisk);
  const tone = CLAIM_TONE_STYLES[mlRisk.level];
  const Icon = tone.icon;
  const chartData = buildClaimFactorChartData(mlRisk.topFactors);
  const signalCount = mlRisk.topFactors.length;

  return (
    <motion.section
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={quickTransition}
      className={cn("rounded-xl border p-4 space-y-3 shadow-sm", tone.border, tone.bg)}
      aria-label="AI claim review insight"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ ...quickTransition, delay: 0.06 }}
            className="w-9 h-9 rounded-full bg-background/80 border border-border/60 flex items-center justify-center shrink-0"
          >
            <Icon className="w-4 h-4 text-primary" aria-hidden />
          </motion.div>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                ClearClever review assistant
              </span>
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ ...quickTransition, delay: 0.1 }}
                className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
                  tone.badge
                )}
              >
                {claimRiskPriorityLabel(mlRisk.level)}
              </motion.span>
            </div>
            <h3 className="font-semibold text-base leading-snug">
              {signalCount > 0
                ? `${signalCount} signal${signalCount === 1 ? "" : "s"} influenced this review`
                : copy.headline}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{copy.subtitle}</p>
          </div>
        </div>
      </div>

      {claimContext?.description ? (
        <p className="text-xs text-muted-foreground border-l-2 border-primary/30 pl-3 line-clamp-2">
          From the customer: “{claimContext.description.slice(0, 160)}
          {claimContext.description.length > 160 ? "…" : ""}”
        </p>
      ) : null}

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...quickTransition, delay: 0.14 }}
        className="text-sm font-medium text-foreground/90"
      >
        {copy.actionHint}
      </motion.p>

      <button
        type="button"
        onClick={onToggleExpand}
        className="text-xs font-medium text-primary hover:underline"
      >
        {expanded ? "Hide influence breakdown" : "What influenced this review"}
      </button>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden space-y-3"
          >
            <p className="text-xs text-muted-foreground">
              Key signals that shaped this review score (strongest first).
            </p>
            <div className="space-y-2.5">
              {chartData.map((item, index) => {
                const barColor =
                  mlRisk.level === "high"
                    ? "bg-red-500"
                    : mlRisk.level === "medium"
                      ? "bg-amber-500"
                      : "bg-emerald-500";
                return (
                  <div
                    key={`${item.label}-${index}`}
                    className="group rounded-lg border border-border/60 bg-background/60 px-3 py-2"
                    title={item.label}
                    aria-label={`${item.rankLabel}: ${item.label}`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-xs font-medium text-foreground line-clamp-2">{item.label}</span>
                      <span className="text-[11px] text-muted-foreground shrink-0">{item.rankLabel}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.weight}%` }}
                        transition={{ duration: 0.45, delay: index * 0.05 }}
                        className={`h-full rounded-full ${barColor}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.section>
  );
}

export function FraudCategorySummary({
  summary,
  signalCount,
  categoryLabel,
}: {
  summary: FraudMlSummary;
  signalCount: number;
  categoryLabel: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={quickTransition}
      className="relative overflow-hidden rounded-xl border border-primary/15 bg-gradient-to-br from-primary/5 via-card to-card p-5 space-y-4 shadow-sm"
      aria-label="AI fraud monitoring summary"
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[length:200%_200%] bg-gradient-to-r from-primary/[0.04] via-transparent to-primary/[0.06] opacity-60"
        {...sectionGradientShift}
      />
      <div className="relative">
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...quickTransition, delay: 0.05 }}
          className="flex items-center gap-2 text-primary font-medium text-sm"
        >
          <motion.span
            animate={{ rotate: [0, 8, -8, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" }}
          >
            <Sparkles className="w-4 h-4" aria-hidden />
          </motion.span>
          ClearClever AI monitoring
        </motion.div>
        <h2 className="text-lg font-semibold mt-1">{categoryLabel}</h2>
        <p className="text-sm text-muted-foreground mt-0.5 max-w-2xl">
          Rules surface possible issues. AI estimates how likely each pattern is fraudulent so you
          can focus on what matters most.
        </p>
      </div>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
        }}
        className="relative flex flex-wrap gap-3"
      >
        <InsightMetric label="Active alerts" value={String(signalCount)} sub="In this category" index={0} />
        <InsightMetric
          label="Avg. fraud likelihood"
          value={`${summary.averageScore}%`}
          sub="Across alerts with AI scores"
          index={1}
        />
        <InsightMetric
          label="High likelihood"
          value={String(summary.highConfidenceCount)}
          sub="Estimated ≥70% fraud risk"
          tone={summary.highConfidenceCount > 0 ? "warning" : "default"}
          index={2}
        />
      </motion.div>
    </motion.section>
  );
}

function fraudMlTone(score: number): string {
  if (score >= 70) {
    return "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800";
  }
  if (score >= 45) {
    return "bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-800";
  }
  return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800";
}

const RULE_SEVERITY_STYLES: Record<FraudSignal["severity"], string> = {
  critical: "bg-destructive/15 text-destructive border-destructive/30",
  high: "bg-warning/15 text-warning border-warning/30",
  medium: "bg-primary/10 text-primary border-primary/20",
  low: "bg-muted text-muted-foreground border-border",
};

export function FraudSignalInsightCard({
  signal,
  expanded,
  onToggleExpand,
}: {
  signal: FraudSignal;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  const mlCopy = typeof signal.mlScore === "number" ? fraudMlInsightCopy(signal.mlScore) : null;
  const insights = (signal.mlFactors ?? []).map(humanizeFraudFactor);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={quickTransition}
      className="space-y-3"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Rule alert
        </span>
        <motion.span
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...quickTransition, delay: 0.04 }}
          className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize",
            RULE_SEVERITY_STYLES[signal.severity]
          )}
        >
          {fraudRulePriorityLabel(signal.severity)}
        </motion.span>
        {typeof signal.mlScore === "number" ? (
          <>
            <span className="text-muted-foreground text-xs" aria-hidden>
              ·
            </span>
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              AI assessment
            </span>
            <motion.span
              initial={{ opacity: 0, scale: 0.85, x: -6 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 480, damping: 26, delay: 0.08 }}
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border",
                fraudMlTone(signal.mlScore)
              )}
            >
              <Sparkles className="w-3 h-3" aria-hidden />
              <AnimatedNumber value={signal.mlScore} className="tabular-nums" />% fraud likelihood
            </motion.span>
          </>
        ) : null}
      </div>

      <AnimatePresence initial={false}>
        {mlCopy ? (
          <motion.div
            key="ml-copy"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={quickTransition}
            className="overflow-hidden"
          >
            <div className="rounded-lg border border-border/70 bg-background/60 p-3 space-y-1">
              <p className="text-sm font-semibold">{mlCopy.headline}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{mlCopy.subtitle}</p>
              <p className="text-sm font-medium pt-1">{mlCopy.actionHint}</p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <InsightExpandable
        expanded={expanded}
        onToggle={onToggleExpand}
        collapsedLabel="What influenced this score"
        expandedLabel="Hide what influenced this score"
        items={insights}
      />
    </motion.div>
  );
}
