import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Shield,
  Car,
  Home,
  PawPrint,
  Layers,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Heart,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { useSavedPolicies } from "../saved-policies-context";
import { fetchCategories, fetchCategoryQuestions, fetchRecommendations } from "@/lib/auth-api";
import { ApiError } from "@/lib/api";
import { copy } from "@/lib/copy";
import { formatPkr, formatPkrYearly } from "@/lib/format";
import { assignRecommendationBadges, badgeLabel } from "@/lib/recommendations";
import type { CategoryItem, PolicyQuestion, ScoredRecommendation } from "@/lib/types";
import type { LucideIcon } from "lucide-react";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  home: Home,
  auto: Car,
  life: Shield,
  pet: PawPrint,
  others: Layers,
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  home: "Protect your home and belongings",
  auto: "Comprehensive vehicle protection",
  life: "Secure your family's financial future",
  pet: "Care coverage for your pets",
  others: "Additional categories coming soon",
};

type Step = "category" | "questionnaire" | "results";

export function ComparePolicies() {
  const navigate = useNavigate();
  const { savePolicy, removeSavedPolicy, isPolicySaved } = useSavedPolicies();

  const [step, setStep] = useState<Step>("category");
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<CategoryItem | null>(null);
  const [questions, setQuestions] = useState<PolicyQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [recommendations, setRecommendations] = useState<ScoredRecommendation[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [loadingResults, setLoadingResults] = useState(false);

  useEffect(() => {
    fetchCategories()
      .then((data) => setCategories(data.categories))
      .catch(() => toast.error(copy.errors.network))
      .finally(() => setLoadingCategories(false));
  }, []);

  const badgeMap = useMemo(
    () => assignRecommendationBadges(recommendations),
    [recommendations]
  );

  const handleCategorySelect = async (category: CategoryItem) => {
    if (!category.available || category.slug === "others") {
      toast.message(copy.compare.othersTitle, {
        description: copy.compare.othersBody,
      });
      return;
    }

    setSelectedCategory(category);
    setLoadingQuestions(true);
    try {
      const data = await fetchCategoryQuestions(category.slug);
      if (!data.available || data.questions.length === 0) {
        toast.message(copy.compare.othersTitle, { description: copy.compare.othersBody });
        return;
      }
      setQuestions(data.questions);
      setAnswers({});
      setCurrentQuestion(0);
      setStep("questionnaire");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : copy.errors.generic);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const currentQ = questions[currentQuestion];
  const progress =
    questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0;

  const submitAnswers = async (finalAnswers: Record<string, unknown>) => {
    if (!selectedCategory) return;
    setLoadingResults(true);
    try {
      const data = await fetchRecommendations({
        category: selectedCategory.slug,
        answers: finalAnswers,
      });
      setRecommendations(data.recommendations ?? []);
      setStep("results");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : copy.errors.generic);
    } finally {
      setLoadingResults(false);
    }
  };

  const handleAnswer = (value: unknown) => {
    if (!currentQ) return;
    const nextAnswers = { ...answers, [currentQ.id]: value };
    setAnswers(nextAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      void submitAnswers(nextAnswers);
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    } else {
      setStep("category");
      setSelectedCategory(null);
      setQuestions([]);
      setAnswers({});
      setCurrentQuestion(0);
    }
  };

  const resetFlow = () => {
    setStep("category");
    setSelectedCategory(null);
    setQuestions([]);
    setAnswers({});
    setCurrentQuestion(0);
    setRecommendations([]);
  };

  const handleSavePolicy = async (rec: ScoredRecommendation) => {
    try {
      if (isPolicySaved(rec.policy.id)) {
        await removeSavedPolicy(rec.policy.id);
        toast.success(copy.saved.removed);
      } else {
        await savePolicy(rec.policy);
        toast.success(copy.saved.saved);
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : copy.errors.generic);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <AnimatePresence mode="wait">
        {step === "category" && (
          <motion.div
            key="category"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">{copy.compare.title}</h1>
              <p className="text-muted-foreground">{copy.compare.subtitle}</p>
            </div>

            {loadingCategories ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {categories.map((category, index) => {
                  const Icon = CATEGORY_ICONS[category.slug] ?? Layers;
                  const unavailable = !category.available;
                  return (
                    <motion.button
                      key={category.slug}
                      type="button"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      disabled={loadingQuestions}
                      onClick={() => void handleCategorySelect(category)}
                      className={`text-left bg-card border border-border rounded-xl p-6 transition-all duration-200 ${
                        unavailable
                          ? "opacity-70 cursor-default"
                          : "hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5"
                      }`}
                    >
                      <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                        <Icon className="w-7 h-7" />
                      </div>
                      <h3 className="text-lg font-semibold mb-1">{category.name}</h3>
                      <p className="text-muted-foreground text-sm mb-4">
                        {CATEGORY_DESCRIPTIONS[category.slug] ?? category.name}
                      </p>
                      <span className="text-primary text-sm font-medium inline-flex items-center gap-1">
                        {unavailable ? "Coming soon" : "Get started"}
                        {!unavailable && <ArrowRight className="w-4 h-4" />}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {step === "questionnaire" && currentQ && (
          <motion.div
            key="questionnaire"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-card border border-border rounded-xl p-8">
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3 text-sm text-muted-foreground">
                  <span>
                    Question {currentQuestion + 1} of {questions.length}
                  </span>
                  <span className="text-primary font-medium">{Math.round(progress)}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
              </div>

              <h2 className="text-xl font-bold mb-6">{currentQ.text}</h2>

              {loadingResults ? (
                <div className="flex flex-col items-center py-12 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-muted-foreground text-sm">Building your comparison…</p>
                </div>
              ) : (
                <QuestionInput
                  question={currentQ}
                  value={answers[currentQ.id]}
                  onAnswer={handleAnswer}
                />
              )}

              <div className="mt-8">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={loadingResults}
                  className="px-5 py-2.5 border border-border rounded-lg hover:bg-accent transition-all inline-flex items-center gap-2 text-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === "results" && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="mb-8">
              <button
                type="button"
                onClick={resetFlow}
                className="text-primary hover:underline mb-4 inline-flex items-center gap-2 text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Start new comparison
              </button>
              <h1 className="text-3xl font-bold mb-2">{copy.compare.resultsTitle}</h1>
              <p className="text-muted-foreground">
                {copy.compare.resultsSubtitle(recommendations.length)}
              </p>
            </div>

            {recommendations.length === 0 ? (
              <div className="text-center py-16 bg-card border border-border rounded-xl">
                <p className="text-muted-foreground">{copy.compare.emptyRecommendations}</p>
              </div>
            ) : (
              <div className="space-y-5">
                {recommendations.map((rec, index) => {
                  const badges = badgeMap.get(rec.policy.id) ?? [];
                  const isTop = index === 0;
                  return (
                    <motion.article
                      key={rec.policy.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.06 }}
                      className={`relative bg-card border rounded-xl p-6 transition-shadow hover:shadow-md ${
                        isTop ? "border-primary/50" : "border-border"
                      }`}
                    >
                      <div className="flex flex-wrap gap-2 mb-4">
                        {badges.map((b) => (
                          <span
                            key={b}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
                          >
                            {b === "aiRecommended" && <Sparkles className="w-3 h-3" />}
                            {badgeLabel(b)}
                          </span>
                        ))}
                        <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                          {Math.round(rec.score)}% match
                        </span>
                      </div>

                      <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold mb-1">{rec.policy.name}</h3>
                          <p className="text-muted-foreground text-sm mb-3">
                            {rec.policy.insurer.companyName}
                          </p>
                          {rec.matchReasons.length > 0 && (
                            <ul className="mb-4 space-y-1">
                              {rec.matchReasons.map((reason) => (
                                <li
                                  key={reason}
                                  className="text-sm text-muted-foreground flex items-start gap-2"
                                >
                                  <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                                  {reason}
                                </li>
                              ))}
                            </ul>
                          )}
                          <ul className="space-y-1">
                            {rec.policy.features.slice(0, 4).map((feature) => (
                              <li
                                key={feature}
                                className="text-sm flex items-start gap-2"
                              >
                                <CheckCircle2 className="w-4 h-4 text-success/80 mt-0.5 shrink-0" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="lg:w-56 flex flex-col gap-3">
                          <div className="bg-muted/30 rounded-lg p-4 border border-border">
                            <p className="text-xs text-muted-foreground mb-1">Premium</p>
                            <p className="text-lg font-bold">
                              {formatPkrYearly(
                                rec.policy.premiumMonthlyPkr,
                                rec.policy.premiumYearlyPkr
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2 mb-1">Coverage</p>
                            <p className="text-sm font-medium">{rec.policy.coverageSummary}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              navigate("/dashboard/purchase", {
                                state: {
                                  policy: rec.policy,
                                  answers,
                                  category: selectedCategory?.slug,
                                },
                              })
                            }
                            className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all text-sm font-medium"
                          >
                            {copy.purchase.purchaseCta}
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleSavePolicy(rec)}
                            className={`w-full py-2.5 border rounded-lg transition-all text-sm inline-flex items-center justify-center gap-2 ${
                              isPolicySaved(rec.policy.id)
                                ? "border-primary text-primary bg-primary/5"
                                : "border-border hover:bg-accent"
                            }`}
                          >
                            <Heart
                              className={`w-4 h-4 ${isPolicySaved(rec.policy.id) ? "fill-primary" : ""}`}
                            />
                            {isPolicySaved(rec.policy.id) ? "Saved" : "Save policy"}
                          </button>
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function QuestionInput({
  question,
  value,
  onAnswer,
}: {
  question: PolicyQuestion;
  value: unknown;
  onAnswer: (value: unknown) => void;
}) {
  if (question.type === "single" && question.options?.length) {
    return (
      <div className="space-y-2">
        {question.options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onAnswer(option)}
            className={`w-full text-left p-4 rounded-lg border transition-all duration-200 ${
              value === option
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/30 hover:bg-accent/50"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    );
  }

  if (question.type === "number") {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const raw = new FormData(form).get("answer");
          const num = Number(raw);
          if (Number.isFinite(num) && num > 0) onAnswer(num);
        }}
        className="space-y-4"
      >
        <input
          name="answer"
          type="number"
          defaultValue={value !== undefined ? String(value) : ""}
          className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
          placeholder="Enter amount in PKR"
          required
        />
        <button
          type="submit"
          className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
        >
          {copy.compare.questionnaireCta}
        </button>
      </form>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const raw = new FormData(e.currentTarget).get("answer");
        if (typeof raw === "string" && raw.trim()) onAnswer(raw.trim());
      }}
      className="space-y-4"
    >
      <input
        name="answer"
        type="text"
        defaultValue={value !== undefined ? String(value) : ""}
        className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
        required
      />
      <button
        type="submit"
        className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
      >
        {copy.compare.questionnaireCta}
      </button>
    </form>
  );
}
