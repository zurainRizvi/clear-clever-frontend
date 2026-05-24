import { Link } from "react-router";
import {
  Shield,
  TrendingUp,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { useAuth } from "../auth-context";
import { useSavedPolicies } from "../saved-policies-context";
import { fetchRecommendations } from "@/lib/auth-api";
import { formatPkr } from "@/lib/format";
import {
  fetchClaims,
  fetchPurchases,
  fetchStoredQuestionnaireAnswers,
  type ClaimSummary,
  type PurchaseSummary,
} from "@/lib/purchase-api";
import type { CategorySlug } from "@/lib/types";

const CATEGORIES: Exclude<CategorySlug, "others">[] = ["home", "auto", "life", "pet"];

interface CrossSell {
  category: Exclude<CategorySlug, "others">;
  reason: string;
}

export function SeekerDashboardHome() {
  const { userName } = useAuth();
  const { savedPolicies } = useSavedPolicies();
  const firstName = userName?.split(" ")[0] ?? "there";
  const [purchases, setPurchases] = useState<PurchaseSummary[]>([]);
  const [claims, setClaims] = useState<ClaimSummary[]>([]);
  const [questionnaireAnswers, setQuestionnaireAnswers] = useState<Record<string, Record<string, unknown>>>({});
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
        setQuestionnaireAnswers(answersByCategory);

        const averages: Record<string, number> = {};
        await Promise.all(
          Object.entries(answersByCategory).map(async ([category, answers]) => {
            const data = await fetchRecommendations({ category, answers }).catch(() => null);
            const premiums = data?.recommendations.map((rec) => rec.policy.premiumMonthlyPkr) ?? [];
            if (premiums.length > 0) {
              averages[category] = premiums.reduce((sum, value) => sum + value, 0) / premiums.length;
            }
          })
        );
        setAverageRecommendedMonthly(averages);
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

  const crossSells = useMemo(
    () => inferCrossSells(questionnaireAnswers, activeCategories),
    [questionnaireAnswers, activePolicies.length]
  );

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = [
    {
      label: "Active policies",
      value: String(activePolicies.length),
      icon: Shield,
      trend: activePolicies.length ? "Open your policy cards" : "Complete a policy to start",
      colorClass: "text-primary bg-primary/10",
      to: "/dashboard/purchases",
    },
    {
      label: "Estimated annual savings",
      value: formatPkr(Math.round(savings)),
      icon: TrendingUp,
      trend: "Compared with average recommended premiums in matching categories",
      colorClass: "text-success bg-success/10",
      to: "/dashboard/compare",
    },
    {
      label: "Pending claims",
      value: String(pendingClaims.length),
      icon: Clock,
      trend: pendingClaims.length ? "Needs review" : "No open claim reviews",
      colorClass: "text-warning bg-warning/10",
      to: "/dashboard/claims",
    },
    {
      label: "Coverage score",
      value: `${insuranceScore}/100`,
      icon: CheckCircle2,
      trend: `${activeCategories.size} of 4 core categories covered`,
      colorClass: "text-primary bg-primary/10",
      to: "/dashboard/compare",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Welcome back, {firstName}</h1>
        <p className="text-muted-foreground">Here&apos;s an overview of your insurance portfolio</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow"
            >
              <Link to={stat.to} className="block">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${stat.colorClass}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-3xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground mb-2">{stat.label}</div>
              <div className="text-xs text-success">{stat.trend}</div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      <div className="bg-primary/5 border border-border rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold mb-2">Recommended for your profile</h3>
            {crossSells.length > 0 ? (
              <div className="space-y-2 mb-4">
                {crossSells.slice(0, 3).map((item) => (
                  <p key={item.category} className="text-muted-foreground">
                    Consider <span className="font-medium text-foreground">{item.category}</span>{" "}
                    insurance: {item.reason}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground mb-4">
                Complete one questionnaire and we will use those answers to suggest related
                home, auto, life, or pet coverage.
              </p>
            )}
            <Link
              to="/dashboard/compare"
              className="inline-flex px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all text-sm font-medium"
            >
              Explore recommendations
            </Link>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-4">Active policies</h3>
          <div className="space-y-4">
            {activePolicies.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active policy yet.</p>
            ) : (
              activePolicies.slice(0, 4).map((purchase) => (
                <Link
                  key={purchase.id}
                  to={`/dashboard/purchases?focus=${purchase.id}`}
                  className="flex items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg hover:bg-accent/60"
                >
                  <div>
                    <div className="font-medium text-sm">{purchase.policy?.name}</div>
                    <div className="text-xs text-muted-foreground">{purchase.insurer?.companyName}</div>
                  </div>
                  <div className="text-right text-sm font-medium">
                    {formatPkr(purchase.policy?.premiumMonthlyPkr ?? 0)}/mo
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-4">Coverage gaps</h3>
          <div className="space-y-3">
            {crossSells.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No obvious gaps yet. Add more questionnaire answers for smarter suggestions.
              </p>
            ) : (
              crossSells.map((item) => (
                <Link key={item.category} to="/dashboard/compare" className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50">
                  <FileText className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm capitalize">{item.category} insurance</div>
                    <div className="text-xs text-muted-foreground">{item.reason}</div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function inferCrossSells(
  answersByCategory: Record<string, Record<string, unknown>>,
  activeCategories: Set<string | undefined>
): CrossSell[] {
  const allAnswers = Object.values(answersByCategory).flatMap((answers) =>
    Object.entries(answers)
  );
  const hasSignal = (keys: string[], reject = ['no', 'none']) =>
    allAnswers.some(([key, value]) => {
      if (!keys.includes(key)) return false;
      const normalized = String(value).toLowerCase();
      return !reject.some((word) => normalized.includes(word));
    });

  const suggestions: CrossSell[] = [];
  if (!activeCategories.has("auto") && hasSignal(["owns_vehicle"])) {
    suggestions.push({ category: "auto", reason: "your answers show you own or use a vehicle." });
  }
  if (!activeCategories.has("pet") && hasSignal(["has_pet"])) {
    suggestions.push({ category: "pet", reason: "your household includes a pet." });
  }
  if (!activeCategories.has("life") && hasSignal(["family_dependents", "dependents"])) {
    suggestions.push({ category: "life", reason: "you mentioned family or dependent responsibilities." });
  }
  if (!activeCategories.has("home") && hasSignal(["home_owner", "ownership_status"])) {
    suggestions.push({ category: "home", reason: "you have a home or residence to protect." });
  }

  return suggestions;
}
