import { Link } from "react-router";
import {
  Shield,
  TrendingUp,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  PawPrint,
  Bike,
  Car,
  ShoppingCart,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { SEEKER_PAGE_CLASS } from "./seeker-portal-theme";
import { AnimatedPage } from "../ui/animated-page";
import { DashboardStatsCarousel, type DashboardStatItem } from "../ui/dashboard-stats-carousel";
import { fadeUpItem, fadeUpStagger, quickTransition, staggerDelay } from "@/lib/motion-presets";
import { useAuth } from "../auth-context";
import { useSavedPolicies } from "../saved-policies-context";
import { fetchRecommendations } from "@/lib/auth-api";
import { formatPkr } from "@/lib/format";
import { copy } from "@/lib/copy";
import { matchTierFromScore, matchTierLabel, recommendationSummaryLabel } from "@/lib/policy-match";
import {
  fetchClaims,
  fetchPurchases,
  fetchStoredQuestionnaireAnswers,
  type ClaimSummary,
  type PurchaseSummary,
} from "@/lib/purchase-api";
import type { CategorySlug, RankingMethod, ScoredRecommendation } from "@/lib/types";
import {
  allAnswersFlat,
  buildCrossCategorySuggestions,
  mergeAnswersByCategory,
  type CrossCategorySuggestion,
} from "@/lib/cross-category-suggestions";
import {
  HybridRecommendationPickGrid,
  HybridRankingBadge,
  collectHybridTopPicks,
} from "./hybrid-ranking-ui";

const CATEGORIES: Exclude<CategorySlug, "others">[] = ["home", "auto", "life", "pet"];

interface CategoryHybridResult {
  category: Exclude<CategorySlug, "others">;
  rankingMethod?: RankingMethod;
  recommendations: ScoredRecommendation[];
}

interface CrossSell {
  category: Exclude<CategorySlug, "others">;
  label: string;
  reason: string;
  score: number;
  hybridScore?: number;
  mlConfidence?: number;
  rankingMethod?: RankingMethod;
  to: string;
  icon: LucideIcon;
}

export function SeekerDashboardHome() {
  const { userName } = useAuth();
  const { savedPolicies } = useSavedPolicies();
  const firstName = userName?.split(" ")[0] ?? "there";
  const [purchases, setPurchases] = useState<PurchaseSummary[]>([]);
  const [claims, setClaims] = useState<ClaimSummary[]>([]);
  const [questionnaireAnswers, setQuestionnaireAnswers] = useState<Record<string, Record<string, unknown>>>({});
  const [hybridResults, setHybridResults] = useState<CategoryHybridResult[]>([]);
  const [averageRecommendedMonthly, setAverageRecommendedMonthly] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [purchaseData, claimData, ...answerResults] = await Promise.all([
          fetchPurchases(),
          fetchClaims(),
          ...CATEGORIES.map((category) =>
            fetchStoredQuestionnaireAnswers(category).catch(() => null)
          ),
        ]);

        setPurchases(purchaseData.purchases);
        setClaims(claimData.claims);

        const answersByCategory: Record<string, Record<string, unknown>> = {};
        answerResults.forEach((result, index) => {
          if (result?.response?.answers) {
            answersByCategory[CATEGORIES[index]] = result.response.answers;
          }
        });

        const purchaseAnswerSources = purchaseData.purchases
          .filter((purchase) => purchase.policy?.category && purchase.answers)
          .map((purchase) => ({
            category: purchase.policy!.category!,
            answers: purchase.answers,
          }));

        const mergedAnswers = mergeAnswersByCategory(answersByCategory, purchaseAnswerSources);
        setQuestionnaireAnswers(mergedAnswers);

        const averages: Record<string, number> = {};
        const hybridByCategory: CategoryHybridResult[] = [];

        await Promise.all(
          Object.entries(mergedAnswers).map(async ([category, answers]) => {
            const data = await fetchRecommendations({ category, answers }).catch(() => null);
            const premiums = data?.recommendations.map((rec) => rec.policy.premiumMonthlyPkr) ?? [];
            if (premiums.length > 0) {
              averages[category] = premiums.reduce((sum, value) => sum + value, 0) / premiums.length;
            }
            if (data?.recommendations?.length) {
              hybridByCategory.push({
                category: category as Exclude<CategorySlug, "others">,
                rankingMethod: data.rankingMethod,
                recommendations: data.recommendations,
              });
            }
          })
        );

        setAverageRecommendedMonthly(averages);
        setHybridResults(hybridByCategory);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const activePolicies = purchases.filter((purchase) => purchase.status === "completed");
  const activeCategories = new Set(activePolicies.map((purchase) => purchase.policy?.category));
  const monthlyPremium = activePolicies.reduce(
    (sum, purchase) => sum + (purchase.policy?.premiumMonthlyPkr ?? 0),
    0
  );
  const pendingClaims = claims.filter((claim) => claim.status === "submitted" || claim.status === "in_review");
  const savings = activePolicies.reduce((sum, purchase) => {
    const category = purchase.policy?.category;
    const average = category ? averageRecommendedMonthly[category] : undefined;
    if (!average || !purchase.policy?.premiumMonthlyPkr) return sum;
    return sum + Math.max(0, (average - purchase.policy.premiumMonthlyPkr) * 12);
  }, 0);
  const insuranceScore = Math.min(100, activeCategories.size * 20 + (savedPolicies.length > 0 ? 10 : 0));

  const hybridTopPicks = useMemo(
    () =>
      collectHybridTopPicks(hybridResults, {
        excludeCategories: activeCategories as Set<string>,
        limit: 4,
      }),
    [hybridResults, activePolicies.length]
  );

  const hybridByCategory = useMemo(() => {
    const map = new Map<string, ScoredRecommendation>();
    for (const result of hybridResults) {
      const top = result.recommendations[0];
      if (top) map.set(result.category, top);
    }
    return map;
  }, [hybridResults]);

  const crossSells = useMemo(
    () => mapCrossCategorySuggestions(questionnaireAnswers, activeCategories, hybridByCategory),
    [questionnaireAnswers, activeCategories, hybridByCategory]
  );

  const relevantHybridPicks = useMemo(() => {
    const shownCategories = new Set(hybridTopPicks.map((pick) => pick.category));
    return collectHybridTopPicks(hybridResults, {
      excludeCategories: new Set([...activeCategories, ...shownCategories] as string[]),
      limit: 3,
    });
  }, [hybridResults, hybridTopPicks, activePolicies.length]);

  const protectionOpportunities = useMemo(
    () => inferProtectionOpportunities(questionnaireAnswers, activeCategories, hybridByCategory),
    [questionnaireAnswers, activeCategories, hybridByCategory]
  );

  const relevantRecommendations = useMemo(() => {
    const aiCategories = new Set([
      ...crossSells.map((item) => item.category),
      ...hybridTopPicks.map((pick) => pick.category),
    ]);
    return protectionOpportunities.filter((item) => !aiCategories.has(item.category));
  }, [crossSells, hybridTopPicks, protectionOpportunities]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = [
    {
      label: "Policies protecting you",
      value: String(activePolicies.length),
      icon: Shield,
      trend: activePolicies.length ? "View documents, claims, and agent info" : "Complete a policy to start",
      colorClass: "text-primary bg-primary/10",
      to: "/dashboard/purchases",
    },
    {
      label: "Monthly premium spend",
      value: formatPkr(monthlyPremium),
      icon: ShoppingCart,
      trend: activePolicies.length ? "Across active policies" : "No active premium yet",
      colorClass: "text-success bg-success/10",
      to: "/dashboard/purchases",
    },
    {
      label: "Pending claims",
      value: String(pendingClaims.length),
      icon: Clock,
      trend: pendingClaims.length ? "Awaiting insurer review" : "No open claims with insurer",
      colorClass: "text-warning bg-warning/10",
      to: "/dashboard/claims",
    },
    {
      label: "AI savings opportunity",
      value: formatPkr(Math.round(savings)),
      icon: CheckCircle2,
      trend: savings ? "Potential yearly saving from better matching" : `${insuranceScore}/100 portfolio readiness`,
      colorClass: "text-primary bg-primary/10",
      to: "/dashboard/compare",
    },
  ];

  const statItems: DashboardStatItem[] = stats.map((stat) => {
    const Icon = stat.icon;
    return {
      id: stat.label,
      icon: (
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.colorClass}`}>
          <Icon className="w-5 h-5" />
        </div>
      ),
      value: stat.value,
      label: stat.label,
      footer: <span className="text-success">{stat.trend}</span>,
      sparkColor: "#2563EB",
      href: stat.to,
    };
  });

  const hasHybridContent = hybridTopPicks.length > 0 || crossSells.length > 0;

  return (
    <AnimatedPage className={SEEKER_PAGE_CLASS}>
      <div>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="text-3xl font-bold mb-2"
        >
          Welcome back, {firstName}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="text-muted-foreground"
        >
          Here&apos;s an overview of your insurance portfolio
        </motion.p>
      </div>

      <DashboardStatsCarousel items={statItems} />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-primary/5 border border-border rounded-xl p-6"
      >
        <div className="flex items-start gap-4">
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ ...quickTransition, delay: 0.38 }}
            className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shrink-0"
          >
            <TrendingUp className="w-6 h-6 text-primary-foreground" />
          </motion.div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-semibold mb-1">{copy.dashboard.hybridPicksTitle}</h3>
            <p className="text-sm text-muted-foreground mb-4">{copy.dashboard.hybridPicksSubtitle}</p>

            {hybridTopPicks.length > 0 ? (
              <HybridRecommendationPickGrid
                picks={hybridTopPicks}
                questionnaireAnswers={questionnaireAnswers}
                className="mb-4"
              />
            ) : null}

            {crossSells.length > 0 ? (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeUpStagger}
                className="grid md:grid-cols-2 gap-4 md:gap-5 mb-4"
              >
                {crossSells.map((item, idx) => (
                  <motion.div
                    key={item.label}
                    variants={fadeUpItem}
                    transition={{ delay: staggerDelay(idx, false, 0.07) }}
                    className="min-w-0"
                  >
                    <Link
                      to="/dashboard/compare"
                      state={{
                        category: item.category,
                        presetAnswers: questionnaireAnswers[item.category],
                      }}
                      className="group block h-full rounded-lg border border-primary/15 bg-background/70 p-4 hover:border-primary/35 transition-colors"
                    >
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-medium text-foreground">{item.label}</span>
                        {item.rankingMethod === "hybrid" ? <HybridRankingBadge /> : null}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{item.reason}</p>
                      <p className="text-xs font-semibold text-primary">
                        {matchTierLabel(matchTierFromScore(item.hybridScore ?? item.score))}
                      </p>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            ) : null}

            {!hasHybridContent && (
              <p className="text-muted-foreground mb-4">{copy.dashboard.hybridPicksEmpty}</p>
            )}

            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...quickTransition, delay: 0.45 }}
            >
              <Link
                to="/dashboard/compare"
                className="inline-flex px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all text-sm font-medium"
              >
                Explore recommendations
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-4">Active policies</h3>
          <div className="space-y-4">
            {activePolicies.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active policy yet.</p>
            ) : (
              activePolicies.slice(0, 4).map((purchase, idx) => (
                <motion.div
                  key={purchase.id}
                  variants={fadeUpItem}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: idx * 0.06 }}
                >
                  <Link
                    to={`/dashboard/purchases?focus=${purchase.id}`}
                    className="group relative flex items-center justify-between gap-4 overflow-hidden p-4 bg-muted/30 rounded-lg hover:bg-accent/60"
                  >
                    <span className="absolute left-0 top-0 h-full w-1 -translate-x-full bg-primary transition-transform group-hover:translate-x-0" />
                    <div>
                      <div className="font-medium text-sm">{purchase.policy?.name}</div>
                      <div className="text-xs text-muted-foreground">{purchase.insurer?.companyName}</div>
                    </div>
                    <div className="text-right text-sm font-medium">
                      {formatPkr(purchase.policy?.premiumMonthlyPkr ?? 0)}/mo
                    </div>
                  </Link>
                </motion.div>
              ))
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-1">{copy.dashboard.relevantHybridTitle}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {relevantHybridPicks.length > 0 || relevantRecommendations.length > 0
              ? "Additional categories and hybrid-ranked options based on your profile."
              : copy.dashboard.relevantHybridEmpty}
          </p>
          <div className="space-y-3">
            {relevantHybridPicks.map((pick, idx) => (
              <motion.div
                key={`${pick.category}-${pick.rec.policy.id}`}
                variants={fadeUpItem}
                initial="hidden"
                animate="visible"
                transition={{ delay: idx * 0.07 }}
              >
                <Link
                  to="/dashboard/compare"
                  className="group relative flex items-start gap-3 overflow-hidden p-3 rounded-lg border border-border/70 hover:border-primary/25 hover:bg-accent/40"
                >
                  <span className="absolute left-0 top-0 h-full w-1 -translate-x-full bg-primary transition-transform group-hover:translate-x-0" />
                  <Shield className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <span className="font-medium text-sm">{pick.rec.policy.name}</span>
                      {pick.rec.rankingMethod === "hybrid" ? <HybridRankingBadge /> : null}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {pick.rec.policy.insurer.companyName} · {recommendationSummaryLabel(pick.rec)}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
            {relevantRecommendations.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.label}
                  variants={fadeUpItem}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: (relevantHybridPicks.length + idx) * 0.07 }}
                >
                  <Link
                    to={item.to}
                    className="group relative flex items-start gap-3 overflow-hidden p-3 rounded-lg hover:bg-accent/50"
                  >
                    <span className="absolute left-0 top-0 h-full w-1 -translate-x-full bg-primary transition-transform group-hover:translate-x-0" />
                    <Icon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{item.label}</div>
                      <div className="text-xs text-muted-foreground">{item.reason}</div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
}

function crossSellIcon(key: string): LucideIcon {
  if (key.startsWith("pet")) return PawPrint;
  if (key === "motorcycle") return Bike;
  if (key === "vehicle") return Car;
  if (key === "home") return FileText;
  return Shield;
}

function enrichCrossSellFromHybrid(
  item: CrossSell,
  hybridByCategory: Map<string, ScoredRecommendation>
): CrossSell {
  const hybrid = hybridByCategory.get(item.category);
  if (!hybrid) return item;
  return {
    ...item,
    score: hybrid.score,
    hybridScore: hybrid.score,
    mlConfidence: hybrid.mlConfidence,
    rankingMethod: hybrid.rankingMethod,
  };
}

function mapCrossCategorySuggestions(
  answersByCategory: Record<string, Record<string, unknown>>,
  activeCategories: Set<string | undefined>,
  hybridByCategory: Map<string, ScoredRecommendation>
): CrossSell[] {
  const flatAnswers = allAnswersFlat(answersByCategory);
  return buildCrossCategorySuggestions(flatAnswers)
    .filter((item) => {
      if (item.slug === "auto" && item.key === "vehicle" && activeCategories.has("auto")) {
        return false;
      }
      if (item.slug !== "auto" && activeCategories.has(item.slug)) {
        return false;
      }
      return true;
    })
    .map((item) =>
      enrichCrossSellFromHybrid(toDashboardCrossSell(item, activeCategories), hybridByCategory)
    );
}

function toDashboardCrossSell(
  item: CrossCategorySuggestion,
  activeCategories: Set<string | undefined>
): CrossSell {
  const reason =
    item.key === "motorcycle" && activeCategories.has("auto")
      ? "Your auto policy is active — motorcycle-specific plans may still offer better bike cover."
      : item.reason;

  return {
    category: item.slug,
    label: item.label,
    reason,
    score: item.score ?? 80,
    to: "/dashboard/compare",
    icon: crossSellIcon(item.key),
  };
}

function inferProtectionOpportunities(
  answersByCategory: Record<string, Record<string, unknown>>,
  activeCategories: Set<string | undefined>,
  hybridByCategory: Map<string, ScoredRecommendation>
): CrossSell[] {
  const opportunities: CrossSell[] = [];
  const hasAnswers = (category: string) =>
    !!answersByCategory[category] && Object.keys(answersByCategory[category]).length > 0;
  const queue = (category: CrossSell["category"], label: string, icon: LucideIcon, reason: string) => {
    if (activeCategories.has(category)) return;
    opportunities.push({ category, label, icon, reason, score: 75, to: "/dashboard/compare" });
  };

  const flatAnswers = allAnswersFlat(answersByCategory);
  const autoSuggestions = buildCrossCategorySuggestions(flatAnswers, "home").filter(
    (item) => item.slug === "auto"
  );
  for (const item of autoSuggestions) {
    if (activeCategories.has("auto") && item.key === "vehicle") continue;
    opportunities.push(
      enrichCrossSellFromHybrid(
        {
          category: "auto",
          label: item.label,
          icon: crossSellIcon(item.key),
          reason: item.reason,
          score: item.score ?? 75,
          to: "/dashboard/compare",
        },
        hybridByCategory
      )
    );
  }
  if (hasAnswers("life")) {
    queue("life", "Life insurance", Shield, "you completed life-related questions.");
  }
  if (hasAnswers("pet")) {
    const petSuggestions = buildCrossCategorySuggestions(flatAnswers, "home").filter(
      (item) => item.slug === "pet"
    );
    if (petSuggestions.length > 0) {
      for (const item of petSuggestions) {
        opportunities.push(
          enrichCrossSellFromHybrid(
            {
              category: "pet",
              label: item.label,
              icon: PawPrint,
              reason: item.reason,
              score: item.score ?? 75,
              to: "/dashboard/compare",
            },
            hybridByCategory
          )
        );
      }
    } else {
      queue("pet", "Pet insurance", PawPrint, "you completed pet profile questions.");
    }
  }
  if (hasAnswers("home")) {
    queue("home", "Home insurance", FileText, "you completed home/property questions.");
  }

  return opportunities.map((item) => enrichCrossSellFromHybrid(item, hybridByCategory));
}
