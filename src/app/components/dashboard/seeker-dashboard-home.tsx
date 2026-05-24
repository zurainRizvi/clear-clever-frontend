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
  label: string;
  reason: string;
  score: number;
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
  const protectionOpportunities = useMemo(
    () => inferProtectionOpportunities(questionnaireAnswers, activeCategories),
    [questionnaireAnswers, activePolicies.length]
  );
  const relevantRecommendations = useMemo(() => {
    const aiCategories = new Set(crossSells.map((item) => item.category));
    return protectionOpportunities.filter((item) => !aiCategories.has(item.category));
  }, [crossSells, protectionOpportunities]);

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
            <h3 className="text-xl font-semibold mb-2">AI-assisted recommendations</h3>
            {crossSells.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-3 mb-4">
                {crossSells.map((item) => (
                  <Link
                    key={item.label}
                    to={item.to}
                    className="rounded-lg border border-primary/15 bg-background/70 p-4 hover:border-primary/35 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <span className="font-medium text-foreground">{item.label}</span>
                      <span className="text-xs font-semibold text-primary">
                        Recommended score: {item.score}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.reason}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground mb-4">
                Complete one questionnaire and we will use those answers to suggest related
                home, vehicle, motorcycle, life, or pet recommendations.
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
          <h3 className="text-xl font-semibold mb-4">Relevant recommendations</h3>
          <div className="space-y-3">
            {relevantRecommendations.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No additional recommendations yet. Add more questionnaire answers for smarter suggestions.
              </p>
            ) : (
              relevantRecommendations.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.label} to={item.to} className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50">
                    <Icon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{item.label}</div>
                      <div className="text-xs text-muted-foreground">{item.reason}</div>
                    </div>
                  </Link>
                );
              })
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
  const answerText = (value: unknown) =>
    Array.isArray(value) ? value.join(" ").toLowerCase() : String(value ?? "").toLowerCase();
  const answerHasPositiveSignal = (value: unknown, reject = ['no', 'none']) => {
    const values = Array.isArray(value) ? value.map(answerText) : [answerText(value)];
    return values.some(
      (item) => item.trim() !== "" && !reject.some((word) => item.includes(word))
    );
  };
  const hasSignal = (keys: string[], reject = ['no', 'none']) =>
    allAnswers.some(([key, value]) => {
      if (!keys.includes(key)) return false;
      return answerHasPositiveSignal(value, reject);
    });
  const signalText = (keys: string[]) =>
    allAnswers
      .filter(([key, value]) => keys.includes(key) && answerHasPositiveSignal(value))
      .map(([, value]) => answerText(value))
      .join(" ");

  const suggestions: CrossSell[] = [];
  const vehicleSignal = signalText(["owns_vehicle", "vehicle_type", "vehicle_make_model"]);
  if (hasSignal(["owns_vehicle", "vehicle_type", "vehicle_make_model"])) {
    if (vehicleSignal.includes("motorcycle") || vehicleSignal.includes("bike")) {
      suggestions.push({
        category: "auto",
        label: "Motorcycle insurance",
        reason: activeCategories.has("auto")
          ? "Recommended because your auto policy may include it, but motorcycle-specific options deserve their own comparison."
          : "Recommended because user owns vehicle.",
        score: 92,
        to: "/dashboard/compare",
        icon: Bike,
      });
    }
    if (!activeCategories.has("auto") && (vehicleSignal.includes("car") || vehicleSignal.includes("vehicle") || !vehicleSignal.includes("motorcycle"))) {
      suggestions.push({
        category: "auto",
        label: "Vehicle insurance",
        reason: "Recommended because user owns vehicle.",
        score: 92,
        to: "/dashboard/compare",
        icon: Car,
      });
    }
  }
  if (!activeCategories.has("pet") && hasSignal(["has_pet", "pet_type"])) {
    const petSignal = signalText(["has_pet", "pet_type"]);
    const pet = petSignal.includes("dog") ? "dog" : petSignal.includes("cat") ? "cat" : "pet";
    suggestions.push({
      category: "pet",
      label: pet === "pet" ? "Pet insurance" : `${pet[0].toUpperCase()}${pet.slice(1)} insurance`,
      reason: `Recommended because user owns ${pet === "pet" ? "a pet" : `a ${pet}`}.`,
      score: 86,
      to: "/dashboard/compare",
      icon: PawPrint,
    });
  }
  if (!activeCategories.has("life") && hasSignal(["health_condition", "occupation_risk"], ["no", "none", "office"])) {
    suggestions.push({
      category: "life",
      label: "Life insurance",
      reason: "Recommended due to high medical risk profile.",
      score: 90,
      to: "/dashboard/compare",
      icon: Shield,
    });
  }
  if (
    !activeCategories.has("life") &&
    !suggestions.some((item) => item.category === "life") &&
    hasSignal(["family_dependents", "dependents"])
  ) {
    suggestions.push({
      category: "life",
      label: "Life insurance",
      reason: "Recommended because family dependency detected.",
      score: 88,
      to: "/dashboard/compare",
      icon: Shield,
    });
  }
  if (!activeCategories.has("home") && hasSignal(["home_owner", "ownership_status"])) {
    suggestions.push({
      category: "home",
      label: "Home insurance",
      reason: "Recommended because home ownership or residence need was detected.",
      score: 84,
      to: "/dashboard/compare",
      icon: FileText,
    });
  }

  return suggestions;
}

function inferProtectionOpportunities(
  answersByCategory: Record<string, Record<string, unknown>>,
  activeCategories: Set<string | undefined>
): CrossSell[] {
  const opportunities: CrossSell[] = [];
  const hasAnswers = (category: string) =>
    !!answersByCategory[category] && Object.keys(answersByCategory[category]).length > 0;
  const queue = (category: CrossSell["category"], label: string, icon: LucideIcon, reason: string) => {
    if (activeCategories.has(category)) return;
    opportunities.push({ category, label, icon, reason, score: 75, to: "/dashboard/compare" });
  };

  if (hasAnswers("auto")) {
    queue("auto", "Vehicle insurance", Car, "you shared vehicle details, so auto coverage options are available.");
    queue("auto", "Motorcycle insurance", Bike, "motorcycle answers were detected, so bike protection options are available.");
  }
  if (hasAnswers("life")) {
    queue("life", "Life insurance", Shield, "you completed life-related questions.");
  }
  if (hasAnswers("pet")) {
    queue("pet", "Pet insurance", PawPrint, "you completed pet profile questions.");
  }
  if (hasAnswers("home")) {
    queue("home", "Home insurance", FileText, "you completed home/property questions.");
  }

  return opportunities;
}
