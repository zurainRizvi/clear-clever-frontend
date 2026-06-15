import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import {
  Shield,
  Car,
  Bike,
  Home,
  PawPrint,
  Layers,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Heart,
  Headphones,
  Loader2,
  MessageSquare,
  GitCompare,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SEEKER_PAGE_CLASS } from "./seeker-portal-theme";
import { AnimatedPage } from "../ui/animated-page";
import { toast } from "sonner";
import { useSavedPolicies } from "../saved-policies-context";
import { fetchCategories, fetchCategoryQuestions, fetchRecommendations, trackComparePolicies } from "@/lib/auth-api";
import { fetchStoredQuestionnaireAnswers } from "@/lib/purchase-api";
import { clearPurchaseDraft } from "@/lib/purchase-draft";
import { ApiError } from "@/lib/api";
import { copy } from "@/lib/copy";
import { formatPkr, formatPkrYearly } from "@/lib/format";
import { assignRecommendationBadges, badgeLabel } from "@/lib/recommendations";
import {
  HybridRankingBadge,
  HybridRankingSummary,
} from "./hybrid-ranking-ui";
import { PolicyMatchInsight } from "./policy-match-insight";
import { matchTierFromScore, matchTierLabel, recommendationSummaryLabel } from "@/lib/policy-match";
import { cardLiftHover, fadeUpItem, fadeUpStagger, staggerDelay } from "@/lib/motion-presets";
import type { CategoryItem, PolicyQuestion, PublicPolicy, RankingMethod, ScoredRecommendation } from "@/lib/types";
import type { LucideIcon } from "lucide-react";
import { InsurerLogo } from "./insurer-logo";
import { useAssistantWidget } from "../assistant/assistant-widget-context";
import { explainRecommendation } from "@/lib/assistant-api";
import { useAuth } from "../auth-context";
import { QuestionInput, otherDetailKey } from "./questionnaire-inputs";
import {
  filterAnswersForQuestions,
  requiredQuestionsAnswered,
} from "@/lib/questionnaire-utils";
import {
  ConversationDrawer,
  type ConversationDrawerRequest,
} from "./conversation-drawer";
import {
  clearCompareFlowDraft,
  loadCompareFlowDraft,
  saveCompareFlowDraft,
} from "@/lib/compare-flow-draft";
import {
  buildCrossCategorySuggestions,
  type CrossCategorySuggestion,
} from "@/lib/cross-category-suggestions";
import { mergePresetAnswers, resolveCategoryNav } from "@/lib/category-nav";
import { PolicyResultsToolbar } from "./policy-results-toolbar";
import { PolicyCompareBar } from "./policy-compare-bar";
import { ClearCleverDisclaimers } from "./clearclever-disclaimers";
import { PolicyFeatureHighlights } from "./policy-feature-highlights";
import {
  DEFAULT_COMPARE_FILTERS,
  filterRecommendations,
  sortRecommendations,
} from "@/lib/compare-results-utils";
import { getCompareCategoryConflict, policiesShareCategory } from "@/lib/compare-utils";

const MAX_COMPARE_POLICIES = 4;

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
type UiCategoryItem = CategoryItem & {
  key: string;
  icon?: LucideIcon;
  description?: string;
  presetAnswers?: Record<string, unknown>;
};

type CompareLocationState = {
  category?: string;
  presetAnswers?: Record<string, unknown>;
};

export function ComparePolicies() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { savePolicy, removeSavedPolicy, isPolicySaved } = useSavedPolicies();
  const { openAssistant, setAssistantCategory } = useAssistantWidget();
  const { isAuthenticated, user } = useAuth();
  const [explainingPolicyId, setExplainingPolicyId] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<CompareSortOption>("best_match");
  const [resultsFilters, setResultsFilters] = useState<CompareResultsFilters>(DEFAULT_COMPARE_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [comparePolicyIds, setComparePolicyIds] = useState<string[]>([]);

  const [step, setStep] = useState<Step>("category");
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<CategoryItem | null>(null);
  const [questions, setQuestions] = useState<PolicyQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [recommendations, setRecommendations] = useState<ScoredRecommendation[]>([]);
  const [rankingMethod, setRankingMethod] = useState<RankingMethod | undefined>();
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [loadingResults, setLoadingResults] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerRequest, setDrawerRequest] = useState<ConversationDrawerRequest | null>(null);
  const [drawerTitle, setDrawerTitle] = useState("");
  const [drawerDescription, setDrawerDescription] = useState("");
  const [prefillNotice, setPrefillNotice] = useState<string | null>(null);
  const restoredDraftRef = useRef(false);
  const handledNavStateRef = useRef(false);

  useEffect(() => {
    fetchCategories()
      .then((data) => setCategories(data.categories))
      .catch(() => toast.error(copy.errors.network))
      .finally(() => setLoadingCategories(false));
  }, []);

  useEffect(() => {
    if (loadingCategories || restoredDraftRef.current) return;
    const draft = loadCompareFlowDraft();
    if (!draft || draft.step !== "results") return;

    restoredDraftRef.current = true;
    setSelectedCategory({
      slug: draft.selectedCategorySlug,
      name: draft.selectedCategoryName,
      available: draft.selectedCategoryAvailable,
    } as CategoryItem);
    setAnswers(draft.answers);
    setRecommendations(draft.recommendations);
    setCurrentQuestion(draft.currentQuestion);
    setSortOption(draft.sort ?? "best_match");
    setResultsFilters(draft.filters ?? DEFAULT_COMPARE_FILTERS);
    setComparePolicyIds(draft.comparePolicyIds ?? []);
    setStep("results");
    setAssistantCategory(draft.selectedCategorySlug);
  }, [loadingCategories, setAssistantCategory]);

  useEffect(() => {
    if (!selectedCategory || step === "category") return;
    saveCompareFlowDraft({
      step,
      selectedCategorySlug: selectedCategory.slug,
      selectedCategoryName: selectedCategory.name,
      selectedCategoryAvailable: selectedCategory.available,
      answers,
      recommendations,
      currentQuestion,
      sort: sortOption,
      filters: resultsFilters,
      comparePolicyIds,
    });
  }, [
    step,
    selectedCategory,
    answers,
    recommendations,
    currentQuestion,
    sortOption,
    resultsFilters,
    comparePolicyIds,
  ]);

  useEffect(() => {
    return () => {
      if (step === "results" && selectedCategory) {
        saveCompareFlowDraft({
          step,
          selectedCategorySlug: selectedCategory.slug,
          selectedCategoryName: selectedCategory.name,
          selectedCategoryAvailable: selectedCategory.available,
          answers,
          recommendations,
          currentQuestion,
          sort: sortOption,
          filters: resultsFilters,
          comparePolicyIds,
        });
      }
    };
  }, [
    step,
    selectedCategory,
    answers,
    recommendations,
    currentQuestion,
    sortOption,
    resultsFilters,
    comparePolicyIds,
  ]);

  const badgeMap = useMemo(
    () => assignRecommendationBadges(recommendations, rankingMethod),
    [recommendations, rankingMethod]
  );
  const filteredRecommendations = useMemo(() => {
    const filtered = filterRecommendations(
      recommendations,
      resultsFilters,
      selectedCategory?.slug
    );
    return sortRecommendations(filtered, sortOption);
  }, [recommendations, resultsFilters, selectedCategory?.slug, sortOption]);
  const compareSelectedPolicies = useMemo(
    () =>
      comparePolicyIds
        .map((id) => recommendations.find((rec) => rec.policy.id === id)?.policy)
        .filter((policy): policy is PublicPolicy => Boolean(policy)),
    [comparePolicyIds, recommendations]
  );
  const crossCategorySuggestions = useMemo(
    () => buildCrossCategorySuggestions(answers, selectedCategory?.slug),
    [answers, selectedCategory?.slug]
  );
  const visibleCategories = useMemo<UiCategoryItem[]>(
    () =>
      categories.flatMap((category) => {
        if (category.slug !== "auto") return [{ ...category, key: category.slug }];
        return [
          {
            ...category,
            key: "vehicle",
            name: "Vehicle Insurance",
            icon: Car,
            description: "Cover your car, SUV, or commercial vehicle",
            presetAnswers: { vehicle_type: "Private car" },
          },
          {
            ...category,
            key: "motorcycle",
            name: "Motorcycle Insurance",
            icon: Bike,
            description: "Protection for bikes, daily rides, and accidents",
            presetAnswers: { vehicle_type: "Motorcycle" },
          },
        ];
      }),
    [categories]
  );

  const startCategoryFlow = async (
    category: CategoryItem,
    presetAnswers?: Record<string, unknown>
  ) => {
    if (!category.available || category.slug === "others") {
      toast.message(copy.compare.othersTitle, {
        description: copy.compare.othersBody,
      });
      return;
    }

    clearCompareFlowDraft();
    setSelectedCategory(category);
    setQuestions([]);
    setCurrentQuestion(0);
    setRecommendations([]);
    setRankingMethod(undefined);
    setStep("questionnaire");
    setLoadingQuestions(true);
    setPrefillNotice(null);
    try {
      const data = await fetchCategoryQuestions(category.slug);
      if (!data.available || data.questions.length === 0) {
        setStep("category");
        toast.message(copy.compare.othersTitle, { description: copy.compare.othersBody });
        return;
      }

      let mergedAnswers = mergePresetAnswers(presetAnswers);
      if (isAuthenticated) {
        const stored = await fetchStoredQuestionnaireAnswers(category.slug).catch(() => null);
        if (stored?.response?.answers) {
          mergedAnswers = mergePresetAnswers(stored.response.answers, mergedAnswers);
        }
      }
      mergedAnswers = filterAnswersForQuestions(mergedAnswers, data.questions);

      setQuestions(data.questions);
      setAnswers(mergedAnswers);

      const answeredCount = data.questions.filter(
        (question) => mergedAnswers[question.id] != null && mergedAnswers[question.id] !== ""
      ).length;
      const remaining = data.questions.length - answeredCount;

      if (requiredQuestionsAnswered(data.questions, mergedAnswers)) {
        setPrefillNotice("We remembered your answers — jumping to your recommendations.");
        const submitted = await submitAnswers(mergedAnswers, category, data.questions);
        if (submitted) return;
        setPrefillNotice("We need a few more details for this category.");
      }

      if (answeredCount > 0 && remaining > 0) {
        setPrefillNotice(
          `We remembered your answers — only ${remaining} question${remaining === 1 ? "" : "s"} left.`
        );
      }

      const firstUnanswered = data.questions.findIndex(
        (question) => mergedAnswers[question.id] == null || mergedAnswers[question.id] === ""
      );
      setCurrentQuestion(firstUnanswered >= 0 ? firstUnanswered : 0);
      setStep("questionnaire");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : copy.errors.generic);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleCategorySelect = async (category: UiCategoryItem) => {
    if (!category.available || category.slug === "others") {
      toast.message(copy.compare.othersTitle, {
        description: copy.compare.othersBody,
      });
      return;
    }

    await startCategoryFlow(category, category.presetAnswers);
  };

  const handleCrossCategorySelect = async (suggestion: CrossCategorySuggestion) => {
    const category =
      categories.find((item) => item.slug === suggestion.slug) ??
      ({
        slug: suggestion.slug,
        name: suggestion.label,
        available: true,
      } as CategoryItem);
    await startCategoryFlow(category, suggestion.presetAnswers);
  };

  useEffect(() => {
    if (loadingCategories || handledNavStateRef.current) return;

    const navState = location.state as CompareLocationState | null;
    const queryCategory = searchParams.get("category");
    const rawCategory = navState?.category ?? queryCategory;
    if (!rawCategory) return;

    const resolved = resolveCategoryNav(rawCategory, navState?.presetAnswers);
    const category =
      categories.find((item) => item.slug === resolved.slug) ??
      ({
        slug: resolved.slug,
        name: resolved.slug,
        available: true,
      } as CategoryItem);

    handledNavStateRef.current = true;
    if (navState?.category) {
      navigate(location.pathname, { replace: true, state: null });
    }
    void startCategoryFlow(category, resolved.presetAnswers);
  }, [loadingCategories, categories, location.pathname, location.state, navigate, searchParams]);

  const currentQ = questions[currentQuestion];
  const progress =
    questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0;

  const handleExplainPolicy = async (policyId: string, policyName: string) => {
    if (!selectedCategory) return;
    if (!isAuthenticated || user?.role !== "user") {
      toast.message("Sign in as a policy seeker for AI explanations");
      return;
    }
    setExplainingPolicyId(policyId);
    try {
      const result = await explainRecommendation({
        category: selectedCategory.slug,
        policyId,
      });
      openAssistant({
        category: selectedCategory.slug,
        presetUserMessage: `Explain why ${policyName} is recommended for me.`,
        presetReply: result.reply,
      });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : copy.errors.generic);
    } finally {
      setExplainingPolicyId(null);
    }
  };

  const submitAnswers = async (
    finalAnswers: Record<string, unknown>,
    categoryOverride?: CategoryItem,
    questionSet?: PolicyQuestion[]
  ): Promise<boolean> => {
    const activeCategory = categoryOverride ?? selectedCategory;
    if (!activeCategory) return false;

    const activeQuestions = questionSet ?? questions;
    const scopedAnswers = filterAnswersForQuestions(finalAnswers, activeQuestions);
    setLoadingResults(true);
    try {
      const data = await fetchRecommendations({
        category: activeCategory.slug,
        answers: scopedAnswers,
      });
      const recs = data.recommendations ?? [];
      setRecommendations(recs);
      setRankingMethod(data.rankingMethod ?? recs[0]?.rankingMethod);
      if (isAuthenticated && recs.length > 0) {
        void trackComparePolicies(recs.map((rec) => rec.policy.id)).catch(() => {
          /* compare tracking is best-effort */
        });
      }
      setAssistantCategory(activeCategory.slug);
      setStep("results");
      return true;
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : copy.errors.generic);
      return false;
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
      return;
    }

    if (!requiredQuestionsAnswered(questions, nextAnswers)) {
      toast.error("Please answer all required questions before continuing.");
      return;
    }
    void submitAnswers(nextAnswers);
  };

  const handleOtherDetailChange = (detail: string) => {
    if (!currentQ) return;
    setAnswers((prev) => ({ ...prev, [otherDetailKey(currentQ.id)]: detail }));
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
    setRankingMethod(undefined);
    setSortOption("best_match");
    setResultsFilters(DEFAULT_COMPARE_FILTERS);
    setComparePolicyIds([]);
  };

  const toggleComparePolicy = (policyId: string) => {
    setComparePolicyIds((prev) => {
      if (prev.includes(policyId)) {
        return prev.filter((id) => id !== policyId);
      }
      if (prev.length >= MAX_COMPARE_POLICIES) {
        toast.message(copy.compare.compareLimit);
        return prev;
      }
      const candidate = recommendations.find((rec) => rec.policy.id === policyId)?.policy;
      if (!candidate) return prev;
      const selectedPolicies = prev
        .map((id) => recommendations.find((rec) => rec.policy.id === id)?.policy)
        .filter((policy): policy is PublicPolicy => Boolean(policy));
      const conflict = getCompareCategoryConflict(selectedPolicies, candidate);
      if (conflict) {
        toast.error(conflict);
        return prev;
      }
      return [...prev, policyId];
    });
  };

  const handleOpenCompareView = () => {
    if (comparePolicyIds.length < 2) {
      toast.error("Select at least two policies to compare");
      return;
    }
    if (!policiesShareCategory(compareSelectedPolicies)) {
      toast.error(
        "Select policies from the same category to compare — for example, all home or all pet plans."
      );
      return;
    }
    navigate(`/dashboard/compare/view?ids=${comparePolicyIds.join(",")}`);
  };

  const openInquiryDrawer = (
    mode: "insurer" | "support",
    rec: ScoredRecommendation
  ) => {
    if (!isAuthenticated || user?.role !== "user") {
      toast.message("Sign in as a policy seeker to message providers");
      return;
    }

    if (mode === "insurer") {
      setDrawerRequest({
        type: "user_insurer",
        insurerProfileId: rec.policy.insurer.id,
        subject: `Inquiry: ${rec.policy.name}`,
        initialMessage: `Hi ${rec.policy.insurer.companyName}, I have a question about ${rec.policy.name} before purchase.`,
      });
      setDrawerTitle(rec.policy.insurer.companyName);
      setDrawerDescription("Ask the insurer about this policy before you buy.");
    } else {
      setDrawerRequest({
        type: "user_support",
        subject: "Pre-purchase support",
        initialMessage: "Hi ClearClever support, I need help with a policy inquiry.",
      });
      setDrawerTitle("ClearClever Support");
      setDrawerDescription("Chat with our support team about your comparison.");
    }
    setDrawerOpen(true);
  };

  const handleSavePolicy = async (rec: ScoredRecommendation) => {
    if (!isAuthenticated || user?.role !== "user") {
      toast.error(copy.errors.unauthorized);
      navigate("/signin", { state: { returnTo: "/dashboard/compare" } });
      return;
    }
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
    <AnimatedPage className={SEEKER_PAGE_CLASS}>
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
                {visibleCategories.map((category, index) => {
                  const Icon = category.icon ?? CATEGORY_ICONS[category.slug] ?? Layers;
                  const unavailable = !category.available;
                  return (
                    <motion.button
                      key={category.key}
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
                        {category.description ?? CATEGORY_DESCRIPTIONS[category.slug] ?? category.name}
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

        {step === "questionnaire" && (loadingQuestions || !currentQ) && (
          <motion.div
            key="questionnaire-loading"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-card border border-border rounded-xl p-8 flex flex-col items-center py-16 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground text-sm">Loading your questionnaire…</p>
            </div>
          </motion.div>
        )}

        {step === "questionnaire" && currentQ && !loadingQuestions && (
          <motion.div
            key="questionnaire"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-card border border-border rounded-xl p-8">
              {prefillNotice ? (
                <p className="mb-4 text-sm rounded-lg border border-primary/20 bg-primary/5 text-primary px-3 py-2">
                  {prefillNotice}
                </p>
              ) : null}
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
                  key={currentQ.id}
                  question={currentQ}
                  value={answers[currentQ.id]}
                  otherDetail={String(answers[otherDetailKey(currentQ.id)] ?? "")}
                  onAnswer={handleAnswer}
                  onOtherDetailChange={handleOtherDetailChange}
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

            {crossCategorySuggestions.length > 0 && (
              <div className="mb-6 bg-primary/5 border border-primary/20 rounded-xl p-5">
                <h2 className="font-semibold mb-2">You may also need</h2>
                <div className="flex flex-wrap gap-2">
                  {crossCategorySuggestions.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      disabled={loadingQuestions || loadingResults}
                      onClick={() => void handleCrossCategorySelect(item)}
                      className="px-3 py-2 rounded-lg bg-card border border-border text-sm text-left hover:border-primary/40 hover:bg-accent/40 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                    >
                      <span className="font-medium">{item.label}</span>
                      <span className="block text-xs text-muted-foreground">{item.reason}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <HybridRankingSummary
              rankingMethod={rankingMethod}
              recommendations={recommendations}
            />

            {recommendations.length > 0 ? (
              <PolicyResultsToolbar
                recommendations={recommendations}
                sort={sortOption}
                filters={resultsFilters}
                categorySlug={selectedCategory?.slug}
                filtersOpen={filtersOpen}
                onSortChange={setSortOption}
                onFiltersChange={setResultsFilters}
                onToggleFilters={() => setFiltersOpen((open) => !open)}
                filteredCount={filteredRecommendations.length}
              />
            ) : null}

            {filteredRecommendations.length === 0 && recommendations.length > 0 ? (
              <div className="text-center py-16 bg-card border border-border rounded-xl">
                <p className="text-muted-foreground">No policies match your filters.</p>
              </div>
            ) : filteredRecommendations.length === 0 ? (
              <div className="text-center py-16 bg-card border border-border rounded-xl">
                <p className="text-muted-foreground">{copy.compare.emptyRecommendations}</p>
              </div>
            ) : (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeUpStagger}
                className="space-y-5"
              >
                {filteredRecommendations.map((rec, index) => {
                  const badges = badgeMap.get(rec.policy.id) ?? [];
                  const isTop = recommendations[0]?.policy.id === rec.policy.id;
                  const isCompared = comparePolicyIds.includes(rec.policy.id);
                  return (
                    <motion.article
                      key={rec.policy.id}
                      variants={fadeUpItem}
                      transition={{ delay: staggerDelay(index, false, 0.06) }}
                      {...cardLiftHover}
                      className={`relative bg-card border rounded-xl p-6 transition-shadow hover:shadow-md ${
                        isTop ? "border-primary/50 shadow-sm" : "border-border"
                      }`}
                    >
                      <div className="flex flex-wrap gap-2 mb-4">
                        {badges.map((b) =>
                          b === "aiRecommended" ? (
                            <HybridRankingBadge key={b} />
                          ) : (
                            <span
                              key={b}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
                            >
                              {badgeLabel(b)}
                            </span>
                          )
                        )}
                        <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {recommendationSummaryLabel(rec)}
                        </span>
                      </div>

                      <PolicyMatchInsight rec={rec} className="mb-4" />

                      <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-bold mb-1">{rec.policy.name}</h3>
                          <div className="mb-4 flex items-center gap-2">
                            <span className="text-muted-foreground text-sm">{rec.policy.insurer.companyName}</span>
                            <InsurerLogo companyName={rec.policy.insurer.companyName} />
                          </div>
                          {rec.answerHighlights && rec.answerHighlights.length > 0 && (
                            <div className="mb-4">
                              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                                Matched to your answers
                              </p>
                              <ul className="space-y-1.5">
                                {rec.answerHighlights.map((highlight) => (
                                  <li
                                    key={`${highlight.questionText}-${highlight.userAnswer}`}
                                    className="text-sm text-muted-foreground flex items-start gap-2"
                                  >
                                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                                    <span>
                                      <span className="font-medium text-foreground">{highlight.userAnswer}</span>
                                      {" — "}
                                      {highlight.policyAlignment}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          <PolicyFeatureHighlights
                            sections={rec.policy.featureSections}
                            features={rec.policy.features}
                            onViewAll={() =>
                              navigate(`/dashboard/compare/features?policyId=${rec.policy.id}`)
                            }
                          />
                        </div>

                        <div className="lg:w-64 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
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
                            onClick={() => toggleComparePolicy(rec.policy.id)}
                            className={`w-full py-2.5 border rounded-lg transition-all text-sm font-medium inline-flex items-center justify-center gap-2 ${
                              isCompared
                                ? "border-primary text-primary bg-primary/5"
                                : "border-border hover:bg-accent"
                            }`}
                          >
                            <GitCompare className="w-4 h-4" />
                            {isCompared ? "In compare" : "Compare"}
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleExplainPolicy(rec.policy.id, rec.policy.name)}
                            disabled={explainingPolicyId === rec.policy.id}
                            className="w-full py-2.5 border border-primary/40 text-primary rounded-lg hover:bg-primary/5 transition-all text-sm font-medium inline-flex items-center justify-center gap-2"
                          >
                            {explainingPolicyId === rec.policy.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Sparkles className="w-4 h-4" />
                            )}
                            Explain with AI
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
                          <button
                            type="button"
                            onClick={() => openInquiryDrawer("insurer", rec)}
                            className="w-full py-2.5 border border-border rounded-lg hover:bg-accent transition-all text-sm font-medium inline-flex items-center justify-center gap-2"
                          >
                            <MessageSquare className="w-4 h-4" />
                            Inquire agent
                          </button>
                          <button
                            type="button"
                            onClick={() => openInquiryDrawer("support", rec)}
                            className="w-full py-2.5 border border-border rounded-lg hover:bg-accent transition-all text-sm font-medium inline-flex items-center justify-center gap-2"
                          >
                            <Headphones className="w-4 h-4" />
                            Support inquiry
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              clearPurchaseDraft();
                              navigate("/dashboard/purchase", {
                                state: {
                                  policy: rec.policy,
                                  answers: filterAnswersForQuestions(answers, questions),
                                  category: selectedCategory?.slug,
                                  returnTo: "/dashboard/compare",
                                },
                              });
                            }}
                            className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all text-sm font-medium"
                          >
                            {copy.purchase.purchaseCta}
                          </button>
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <ConversationDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={drawerTitle}
        description={drawerDescription}
        request={drawerRequest}
      />

      <PolicyCompareBar
        selected={compareSelectedPolicies}
        maxCount={MAX_COMPARE_POLICIES}
        onRemove={toggleComparePolicy}
        onClear={() => setComparePolicyIds([])}
        onCompare={handleOpenCompareView}
      />

      {step === "results" ? (
        <div className="mt-8">
          <ClearCleverDisclaimers compact />
        </div>
      ) : null}
    </AnimatedPage>
  );
}

