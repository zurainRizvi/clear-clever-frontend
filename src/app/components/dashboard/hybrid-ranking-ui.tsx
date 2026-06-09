import { ArrowRight, Info, Sparkles } from "lucide-react";
import { Link } from "react-router";
import { motion, useReducedMotion } from "motion/react";
import { copy } from "@/lib/copy";
import {
  HYBRID_RANKING_DISCLAIMER,
  hybridTopPicks,
  isHybridRanking,
} from "@/lib/hybrid-recommendation";
import { formatPkr } from "@/lib/format";
import { recommendationSummaryLabel } from "@/lib/policy-match";
import type { RankingMethod, ScoredRecommendation } from "@/lib/types";
import {
  cardLiftHover,
  fadeUpItem,
  fadeUpStagger,
  quickTransition,
  sectionGradientShift,
  staggerDelay,
} from "@/lib/motion-presets";
import { cn } from "../ui/utils";
import { PolicyMatchInsight, PolicyMatchSummaryLine } from "./policy-match-insight";

const CATEGORY_LABELS: Record<string, string> = {
  home: "Home",
  auto: "Auto",
  life: "Life",
  pet: "Pet",
};

export function HybridRankingBadge({ className }: { className?: string }) {
  const reducedMotion = useReducedMotion();
  return (
    <motion.span
      initial={reducedMotion ? false : { opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={quickTransition}
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary",
        className
      )}
    >
      <motion.span
        animate={reducedMotion ? undefined : { rotate: [0, 8, -8, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" }}
      >
        <Sparkles className="w-3 h-3" aria-hidden />
      </motion.span>
      {copy.compare.badge.aiRecommended}
    </motion.span>
  );
}

export function HybridRankingSummary({
  rankingMethod,
  recommendations,
  className,
  compact = false,
}: {
  rankingMethod?: RankingMethod;
  recommendations: ScoredRecommendation[];
  className?: string;
  compact?: boolean;
}) {
  const reducedMotion = useReducedMotion();
  if (!isHybridRanking(rankingMethod, recommendations) && recommendations.length === 0) {
    return null;
  }

  return (
    <motion.section
      initial={reducedMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={quickTransition}
      className={cn(
        "relative overflow-hidden rounded-xl border border-primary/25 bg-gradient-to-br from-primary/8 via-card to-card shadow-sm",
        compact ? "p-4 mb-4" : "p-5 mb-6",
        className
      )}
      aria-label="Smart recommendations summary"
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[length:200%_200%] bg-gradient-to-r from-primary/[0.05] via-transparent to-primary/[0.08] opacity-70"
        {...(reducedMotion ? {} : sectionGradientShift)}
      />
      <div className="relative flex items-start gap-3">
        <motion.div
          initial={reducedMotion ? false : { scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ ...quickTransition, delay: 0.04 }}
          className="rounded-lg bg-primary/10 p-2 text-primary shrink-0"
        >
          <motion.span
            animate={reducedMotion ? undefined : { rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2.6, repeat: Infinity, repeatDelay: 3.5, ease: "easeInOut" }}
          >
            <Sparkles className="w-5 h-5" aria-hidden />
          </motion.span>
        </motion.div>
        <div className="min-w-0 flex-1">
          <h2 className={cn("font-semibold mb-1", compact ? "text-sm" : "text-base")}>
            {copy.compare.smartRecommendationsTitle}
          </h2>
          <p className={cn("text-muted-foreground", compact ? "text-xs mb-2" : "text-sm mb-3")}>
            {copy.compare.smartRecommendationsBody}
          </p>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUpStagger}
            className="flex flex-wrap gap-2 text-xs"
          >
            <motion.span
              variants={fadeUpItem}
              className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 font-medium text-primary"
            >
              {copy.compare.personalizedChip}
            </motion.span>
          </motion.div>
          {!compact && (
            <motion.p
              initial={reducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ ...quickTransition, delay: 0.14 }}
              className="mt-3 text-xs text-muted-foreground flex items-start gap-1.5"
            >
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden />
              {HYBRID_RANKING_DISCLAIMER}
            </motion.p>
          )}
        </div>
      </div>
    </motion.section>
  );
}

/** @deprecated Use PolicyMatchInsight — kept for import compatibility */
export function HybridScoreBreakdown({
  rec,
  compact = false,
}: {
  rec: ScoredRecommendation;
  compact?: boolean;
}) {
  return <PolicyMatchInsight rec={rec} compact={compact} />;
}

export function HybridRecommendationPickCard({
  rec,
  category,
  index = 0,
  to = "/dashboard/compare",
}: {
  rec: ScoredRecommendation;
  category: string;
  index?: number;
  to?: string;
}) {
  const reducedMotion = useReducedMotion();
  const showAiBadge = rec.rankingMethod === "hybrid" || rec.score >= 55;

  return (
    <motion.div
      variants={fadeUpItem}
      initial="hidden"
      animate="visible"
      transition={{ ...quickTransition, delay: staggerDelay(index, !!reducedMotion, 0.08) }}
      {...(reducedMotion ? {} : cardLiftHover)}
      className="min-w-0 h-full"
    >
      <Link
        to={to}
        className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-primary/15 bg-background/80 p-4 transition-colors hover:border-primary/35 hover:bg-accent/20"
      >
        <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-primary/5 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
        <div className="relative flex flex-wrap items-center gap-2 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {CATEGORY_LABELS[category] ?? category}
          </span>
          {showAiBadge ? <HybridRankingBadge /> : null}
        </div>
        <h4 className="relative font-semibold text-foreground leading-snug mb-1">
          {rec.policy.name}
        </h4>
        <p className="relative text-xs text-muted-foreground mb-3">
          {rec.policy.insurer.companyName} · {formatPkr(rec.policy.premiumMonthlyPkr)}/mo
        </p>
        <PolicyMatchInsight rec={rec} compact className="relative mb-2" />
        <span className="relative mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
          View comparison
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </Link>
    </motion.div>
  );
}

export function HybridRecommendationPickGrid({
  picks,
  className,
}: {
  picks: Array<{ category: string; rec: ScoredRecommendation }>;
  className?: string;
}) {
  const reducedMotion = useReducedMotion();
  if (picks.length === 0) return null;

  const allRecs = picks.map((pick) => pick.rec);
  const rankingMethod = allRecs[0]?.rankingMethod;

  return (
    <div className={className}>
      <HybridRankingSummary
        rankingMethod={rankingMethod}
        recommendations={allRecs}
        compact
      />
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUpStagger}
        className="grid md:grid-cols-2 gap-4"
      >
        {picks.map((pick, index) => (
          <HybridRecommendationPickCard
            key={`${pick.category}-${pick.rec.policy.id}`}
            rec={pick.rec}
            category={pick.category}
            index={index}
          />
        ))}
      </motion.div>
      {!reducedMotion && picks.length > 0 ? (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...quickTransition, delay: 0.2 + picks.length * 0.06 }}
          className="mt-3 text-[11px] text-muted-foreground"
        >
          {HYBRID_RANKING_DISCLAIMER}
        </motion.p>
      ) : null}
    </div>
  );
}

export function collectHybridTopPicks(
  results: Array<{
    category: string;
    rankingMethod?: RankingMethod;
    recommendations: ScoredRecommendation[];
  }>,
  options?: { excludeCategories?: Set<string>; limit?: number }
): Array<{ category: string; rec: ScoredRecommendation }> {
  const limit = options?.limit ?? 4;
  const exclude = options?.excludeCategories ?? new Set<string>();
  const picks: Array<{ category: string; rec: ScoredRecommendation }> = [];

  for (const result of results) {
    if (exclude.has(result.category)) continue;
    const top = hybridTopPicks(result.recommendations, 1)[0];
    if (!top) continue;
    picks.push({ category: result.category, rec: top });
  }

  return picks
    .sort((a, b) => b.rec.score - a.rec.score)
    .slice(0, limit);
}

export { recommendationSummaryLabel, PolicyMatchSummaryLine };
