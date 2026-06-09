import { CheckCircle2 } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { copy } from "@/lib/copy";
import {
  collectMatchBullets,
  matchTierFromScore,
  matchTierDescription,
  matchTierLabel,
} from "@/lib/policy-match";
import type { ScoredRecommendation } from "@/lib/types";
import { fadeUpItem, quickTransition, staggerDelay } from "@/lib/motion-presets";
import { cn } from "../ui/utils";

function MatchQualityBar({ score, compact }: { score: number; compact?: boolean }) {
  const tier = matchTierFromScore(score);
  const fill =
    tier === "excellent" ? 92 : tier === "good" ? 68 : 45;
  const tone =
    tier === "excellent"
      ? "bg-success"
      : tier === "good"
        ? "bg-primary"
        : "bg-muted-foreground/60";

  return (
    <div className={cn("space-y-1.5", compact ? "mb-2" : "mb-3")}>
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-medium text-foreground">{matchTierLabel(tier)}</span>
        <span className="text-muted-foreground">Based on your answers</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${fill}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={cn("h-full rounded-full", tone)}
        />
      </div>
      {!compact && (
        <p className="text-xs text-muted-foreground leading-relaxed">{matchTierDescription(tier)}</p>
      )}
    </div>
  );
}

export function PolicyMatchInsight({
  rec,
  compact = false,
  className,
}: {
  rec: ScoredRecommendation;
  compact?: boolean;
  className?: string;
}) {
  const reducedMotion = useReducedMotion();
  const bullets = collectMatchBullets(rec, compact ? 2 : 4);

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={quickTransition}
      className={cn(
        "rounded-lg border border-border/80 bg-muted/15",
        compact ? "p-2.5" : "p-3.5",
        className
      )}
      aria-label={copy.compare.matchInsightTitle}
    >
      <MatchQualityBar score={rec.score} compact={compact} />
      {bullets.length > 0 && (
        <ul className="space-y-1.5">
          {bullets.map((bullet, index) => (
            <motion.li
              key={bullet}
              variants={fadeUpItem}
              initial="hidden"
              animate="visible"
              transition={{ ...quickTransition, delay: staggerDelay(index, !!reducedMotion, 0.05) }}
              className="text-xs text-muted-foreground flex items-start gap-2 leading-relaxed"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-success mt-0.5 shrink-0" aria-hidden />
              <span>{bullet}</span>
            </motion.li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}

export function PolicyMatchSummaryLine({ rec }: { rec: ScoredRecommendation }) {
  const tier = matchTierFromScore(rec.score);
  const first = collectMatchBullets(rec, 1)[0];
  return (
    <p className="text-xs font-medium text-primary">
      {matchTierLabel(tier)}
      {first ? ` — ${first}` : null}
    </p>
  );
}
