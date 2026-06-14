import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  ExternalLink,
  Loader2,
  Shield,
  User,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { useAuth } from "../auth-context";
import { fetchCategoryQuestions, fetchPublicPolicy, fetchRecommendations, updateMeProfile } from "@/lib/auth-api";
import { ApiError } from "@/lib/api";
import { copy } from "@/lib/copy";
import { formatCnicWhileTyping, isValidCnicInput, normalizeCnicInput } from "@/lib/cnic";
import { formatPkr, formatPkrYearly } from "@/lib/format";
import { isValidPkPhone, normalizePkPhone, toLocalPkPhoneDisplay } from "@/lib/phone";
import { createPurchase, fetchStoredQuestionnaireAnswers } from "@/lib/purchase-api";
import {
  clearPurchaseDraft,
  loadPurchaseDraft,
  savePurchaseDraft,
} from "@/lib/purchase-draft";
import type { PolicyQuestion, PublicPolicy } from "@/lib/types";
import { ClearCleverLogo } from "../auth/clearclever-logo";
import { InsurerLogo } from "./insurer-logo";
import { KycStatusBadge } from "./kyc-verification-ui";
import { QuestionInput, otherDetailKey } from "./questionnaire-inputs";
import {
  firstIncompleteQuestionIndex,
  firstUnansweredQuestionIndex,
  filterAnswersForQuestions,
  requiredQuestionsAnswered,
} from "@/lib/questionnaire-utils";

type Step = "questionnaire" | "contact" | "review";

interface PurchaseLocationState {
  policy?: PublicPolicy;
  answers?: Record<string, unknown>;
  category?: string;
  returnTo?: string;
}

interface ContactForm {
  fullName: string;
  email: string;
  phone: string;
  cnic: string;
  address: string;
  city: string;
  postalCode: string;
}

function isPublicPolicy(value: unknown): value is PublicPolicy {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "premiumMonthlyPkr" in value &&
    "insurer" in value
  );
}

export function PurchaseFlow() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, refreshUser } = useAuth();

  const locationState = (location.state ?? {}) as PurchaseLocationState;
  const storedDraft = loadPurchaseDraft();

  const [policy, setPolicy] = useState<PublicPolicy | null>(() =>
    isPublicPolicy(locationState.policy)
      ? locationState.policy
      : storedDraft?.policy ?? null
  );
  const [policyLoading, setPolicyLoading] = useState(false);

  const category =
    locationState.category ?? policy?.category ?? storedDraft?.category ?? "";

  const returnTo =
    typeof locationState.returnTo === "string" && locationState.returnTo.startsWith("/dashboard")
      ? locationState.returnTo
      : "/dashboard/compare";

  const returnLabel = returnTo.includes("/saved")
    ? "Back to saved policies"
    : "Back to comparison";

  const [step, setStep] = useState<Step>("contact");
  const [questions, setQuestions] = useState<PolicyQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>(
    () => locationState.answers ?? storedDraft?.answers ?? {}
  );
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [contact, setContact] = useState<ContactForm>({
    fullName: "",
    email: "",
    phone: "",
    cnic: "",
    address: "",
    city: "",
    postalCode: "",
  });

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    if (!user) return;
    const maskedCnic =
      user.cnicMasked && user.cnicMasked.replace(/\D/g, "").length === 13
        ? user.cnicMasked
        : "";
    setContact((prev) => ({
      ...prev,
      fullName: prev.fullName || user.fullName || "",
      email: prev.email || user.email || "",
      phone: prev.phone || (user.phone ? toLocalPkPhoneDisplay(user.phone) : ""),
      cnic: prev.cnic || maskedCnic,
      address: prev.address || user.profile?.addressLine || "",
      city: prev.city || user.profile?.city || "",
      postalCode: prev.postalCode || user.profile?.postalCode || "",
    }));
  }, [user?.id, user?.fullName, user?.email, user?.phone, user?.profile?.addressLine, user?.profile?.city, user?.profile?.postalCode, user?.cnicMasked]);

  useEffect(() => {
    const statePolicy = isPublicPolicy(locationState.policy) ? locationState.policy : null;
    const draft = loadPurchaseDraft();
    const policyId = statePolicy?.id ?? draft?.policy?.id;
    if (!policyId) return;

    if (statePolicy) {
      clearPurchaseDraft();
    }

    let cancelled = false;
    setPolicyLoading(true);
    fetchPublicPolicy(policyId)
      .then(({ policy: fresh }) => {
        if (!cancelled) setPolicy(fresh);
      })
      .catch(() => {
        if (!cancelled) {
          if (statePolicy) setPolicy(statePolicy);
          else if (draft?.policy) setPolicy(draft.policy);
        }
      })
      .finally(() => {
        if (!cancelled) setPolicyLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [locationState.policy?.id]);

  useEffect(() => {
    if (!policy) return;
    savePurchaseDraft({
      policy,
      answers,
      category: category || policy.category,
    });
  }, [policy, answers, category]);

  useEffect(() => {
    if (!policy || !category || category === "others") return;

    let cancelled = false;
    setLoadingQuestions(true);
    Promise.all([
      fetchCategoryQuestions(category),
      fetchStoredQuestionnaireAnswers(category).catch(() => null),
    ])
      .then(([data, stored]) => {
        if (cancelled) return;
        const nextQuestions = data.questions ?? [];
        const storedAnswers = stored?.response?.answers;
        const flowAnswers =
          locationState.answers ??
          (Object.keys(answers).length > 0 ? answers : undefined) ??
          storedAnswers ??
          {};
        const scopedAnswers = filterAnswersForQuestions(flowAnswers, nextQuestions);
        setQuestions(nextQuestions);
        setAnswers(scopedAnswers);
        setCurrentQuestion(firstUnansweredQuestionIndex(nextQuestions, scopedAnswers));
        const complete = requiredQuestionsAnswered(nextQuestions, scopedAnswers);
        setStep(complete ? "contact" : "questionnaire");
      })
      .catch(() => {
        if (!cancelled) {
          toast.error("Could not load questionnaire for this category.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingQuestions(false);
      });

    return () => {
      cancelled = true;
    };
  }, [policy?.id, category]);

  const reviewAnswers = useMemo(
    () => filterAnswersForQuestions(answers, questions),
    [answers, questions]
  );

  const currentQ = questions[currentQuestion];
  const questionnaireProgress =
    questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0;

  const stepProgress = useMemo(() => {
    if (step === "questionnaire") return Math.max(20, questionnaireProgress * 0.4);
    if (step === "contact") return 60;
    return 90;
  }, [step, questionnaireProgress]);

  if (!policy) {
    return (
      <motion.div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-4">No policy selected</h2>
        <p className="text-muted-foreground mb-6">
          Compare policies and choose a plan to start checkout.
        </p>
        <button
          type="button"
          onClick={() => navigate(returnTo)}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all"
        >
          Compare policies
        </button>
      </motion.div>
    );
  }

  if (loadingQuestions || policyLoading) {
    return (
      <motion.div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </motion.div>
    );
  }

  const kycVerified = user?.kycStatus === "verified";
  if (!kycVerified) {
    return (
      <motion.div className="max-w-lg mx-auto space-y-5 py-10">
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 dark:bg-amber-950/30 dark:border-amber-900/40 p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-bold">Complete KYC before checkout</h2>
            {user?.kycStatus ? (
              <KycStatusBadge status={user.kycStatus} cnicOnFile={Boolean(user?.hasCnic)} />
            ) : user?.hasCnic ? (
              <KycStatusBadge status="none" cnicOnFile />
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Save your CNIC in Settings, upload a clear CNIC photo, and wait for verification. Your
            contact details and address will then pre-fill automatically at checkout.
          </p>
          <Link
            to="/dashboard/settings"
            className="inline-flex items-center justify-center px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90"
          >
            Go to Settings
          </Link>
        </div>
        <button
          type="button"
          onClick={() => navigate(returnTo)}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Back to comparison
        </button>
      </motion.div>
    );
  }

  const handleQuestionAnswer = (value: unknown) => {
    if (!currentQ) return;
    const nextAnswers = { ...answers, [currentQ.id]: value };
    setAnswers(nextAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      return;
    }

    if (requiredQuestionsAnswered(questions, nextAnswers)) {
      setStep("contact");
      if (category && category !== "others") {
        void fetchRecommendations({ category, answers: nextAnswers }).catch(() => undefined);
      }
    } else {
      setCurrentQuestion(firstIncompleteQuestionIndex(questions, nextAnswers));
      toast.error("Please answer all required questions, including details for Other options.");
    }
  };

  const handleOtherDetailChange = (detail: string) => {
    if (!currentQ) return;
    setAnswers((prev) => ({ ...prev, [otherDetailKey(currentQ.id)]: detail }));
  };

  const validateContact = (): boolean => {
    const errors: Record<string, string> = {};
    if (!contact.fullName.trim() || contact.fullName.trim().length < 2) {
      errors.fullName = "Enter your full legal name (at least 2 characters).";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim())) {
      errors.email = "Enter a valid email address.";
    }
    if (!isValidPkPhone(contact.phone)) {
      errors.phone = "Enter a valid Pakistan mobile number (e.g. 03001234567).";
    }
    if (!user?.hasCnic) {
      if (!isValidCnicInput(contact.cnic)) {
        errors.cnic = "CNIC is required (13 digits, e.g. 42101-1234567-1).";
      }
    }
    if (!contact.address.trim()) {
      errors.address = "Street address is required.";
    }
    if (!contact.city.trim()) {
      errors.city = "City is required.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const buildPurchaseAnswers = (): Record<string, unknown> => ({
    ...answers,
    contact_full_name: contact.fullName.trim(),
    contact_email: contact.email.trim(),
    contact_phone: normalizePkPhone(contact.phone),
    ...(user?.hasCnic
      ? {}
      : { contact_cnic: normalizeCnicInput(contact.cnic) }),
    contact_address: contact.address.trim(),
    contact_city: contact.city.trim(),
    contact_postal_code: contact.postalCode.trim() || undefined,
  });

  const startInsurerCheckout = async () => {
    if (!validateContact()) {
      toast.error("Please fix the highlighted fields before continuing.");
      return;
    }

    if (questions.length > 0 && !requiredQuestionsAnswered(questions, answers)) {
      toast.error("Please complete the insurance questionnaire first.");
      setStep("questionnaire");
      setCurrentQuestion(firstIncompleteQuestionIndex(questions, answers));
      return;
    }

    setSubmitting(true);
    try {
      if (!user?.hasCnic) {
        await updateMeProfile({ cnic: normalizeCnicInput(contact.cnic) });
        await refreshUser();
      }

      const result = await createPurchase({
        policyId: policy.id,
        answers: buildPurchaseAnswers(),
      });
      clearPurchaseDraft();
      toast.success("Redirecting to secure insurer checkout…");
      window.location.assign(result.redirectUrl);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : copy.errors.generic;
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <button
        type="button"
        onClick={() => navigate(returnTo)}
        className="text-primary hover:underline mb-6 flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        {returnLabel}
      </button>

      <div className="bg-card border border-border rounded-2xl p-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">Purchase insurance</h1>
            <span className="text-sm text-muted-foreground">{Math.round(stepProgress)}% complete</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-secondary"
              initial={{ width: 0 }}
              animate={{ width: `${stepProgress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <div className="mb-8 p-6 bg-accent/50 rounded-xl">
          <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-border bg-background/80 px-4 py-3">
            <ClearCleverLogo linkToHome={false} />
            <InsurerLogo companyName={policy.insurer.companyName} className="h-8 w-auto max-w-[140px]" />
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold">{policy.name}</h3>
              <p className="text-muted-foreground">{policy.insurer.companyName}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Premium</div>
              <div className="text-2xl font-bold">
                {formatPkrYearly(policy.premiumMonthlyPkr, policy.premiumYearlyPkr)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Coverage</div>
              <div className="text-2xl font-bold">{policy.coverageSummary}</div>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === "questionnaire" && currentQ && (
            <motion.div
              key={`q-${currentQ.id}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Insurance questionnaire</h2>
                  <p className="text-sm text-muted-foreground">
                    Question {currentQuestion + 1} of {questions.length}
                  </p>
                </div>
              </div>
              <p className="text-lg font-medium">{currentQ.text}</p>
              <QuestionInput
                key={currentQ.id}
                question={currentQ}
                value={answers[currentQ.id]}
                otherDetail={String(answers[otherDetailKey(currentQ.id)] ?? "")}
                onAnswer={handleQuestionAnswer}
                onOtherDetailChange={handleOtherDetailChange}
              />
              {currentQuestion > 0 && (
                <button
                  type="button"
                  onClick={() => setCurrentQuestion((prev) => prev - 1)}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  ← Previous question
                </button>
              )}
            </motion.div>
          )}

          {step === "contact" && (
            <motion.div
              key="contact"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <motion.div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white">
                  <User className="w-5 h-5" />
                </motion.div>
                <h2 className="text-2xl font-bold">Contact & policyholder details</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Field
                  label="Full name"
                  error={fieldErrors.fullName}
                  input={
                    <input
                      type="text"
                      value={contact.fullName}
                      onChange={(e) => setContact({ ...contact, fullName: e.target.value })}
                      className={inputClass(!!fieldErrors.fullName)}
                    />
                  }
                />
                <Field
                  label="Email"
                  error={fieldErrors.email}
                  input={
                    <input
                      type="email"
                      value={contact.email}
                      onChange={(e) => setContact({ ...contact, email: e.target.value })}
                      className={inputClass(!!fieldErrors.email)}
                    />
                  }
                />
                <Field
                  label="Mobile number"
                  error={fieldErrors.phone}
                  input={
                    <input
                      type="tel"
                      value={contact.phone}
                      onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                      placeholder="03001234567"
                      className={inputClass(!!fieldErrors.phone)}
                    />
                  }
                />
                {user?.hasCnic ? (
                  <Field
                    label="CNIC"
                    input={
                      <input
                        type="text"
                        readOnly
                        value={user.cnicMasked ?? "On file"}
                        className={`${inputClass(false)} bg-muted/40 font-mono tracking-wide`}
                      />
                    }
                  />
                ) : (
                  <Field
                    label="CNIC"
                    error={fieldErrors.cnic}
                    input={
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          type="text"
                          inputMode="numeric"
                          value={contact.cnic}
                          onChange={(e) =>
                            setContact({
                              ...contact,
                              cnic: formatCnicWhileTyping(e.target.value),
                            })
                          }
                          placeholder="42101-1234567-1"
                          className={`${inputClass(!!fieldErrors.cnic)} pl-10 font-mono tracking-wide`}
                        />
                      </div>
                    }
                  />
                )}
                <Field
                  label="City"
                  error={fieldErrors.city}
                  input={
                    <input
                      type="text"
                      value={contact.city}
                      onChange={(e) => setContact({ ...contact, city: e.target.value })}
                      className={inputClass(!!fieldErrors.city)}
                    />
                  }
                />
                <div className="md:col-span-2">
                  <Field
                    label="Street address"
                    error={fieldErrors.address}
                    input={
                      <input
                        type="text"
                        value={contact.address}
                        onChange={(e) => setContact({ ...contact, address: e.target.value })}
                        className={inputClass(!!fieldErrors.address)}
                      />
                    }
                  />
                </div>
                <Field
                  label="Postal code (optional)"
                  input={
                    <input
                      type="text"
                      value={contact.postalCode}
                      onChange={(e) => setContact({ ...contact, postalCode: e.target.value })}
                      className={inputClass(false)}
                    />
                  }
                />
              </div>

              <div className="flex gap-4">
                {questions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setStep("questionnaire");
                      setCurrentQuestion(firstIncompleteQuestionIndex(questions, answers));
                    }}
                    className="flex-1 py-3 border border-border rounded-xl hover:bg-accent transition-all"
                  >
                    Back to questionnaire
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (!validateContact()) return;
                    if (
                      questions.length > 0 &&
                      !requiredQuestionsAnswered(questions, answers)
                    ) {
                      toast.error("Please complete the insurance questionnaire first.");
                      setStep("questionnaire");
                      setCurrentQuestion(firstIncompleteQuestionIndex(questions, answers));
                      return;
                    }
                    setStep("review");
                  }}
                  className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all"
                >
                  Review & continue
                </button>
              </div>
            </motion.div>
          )}

          {step === "review" && (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold">Review before insurer checkout</h2>
              <p className="text-muted-foreground">
                Payment card details are collected securely on {policy.insurer.companyName}&apos;s
                checkout page (simulated for demo — no real charge).
              </p>

              <div className="rounded-xl border border-border p-5 space-y-4">
                <div className="flex items-start gap-4">
                  <InsurerLogo insurer={policy.insurer} className="w-14 h-14 rounded-lg shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold">{policy.name}</h3>
                    <p className="text-sm text-muted-foreground">{policy.insurer.companyName}</p>
                    <p className="text-sm text-muted-foreground mt-2">{policy.description}</p>
                  </div>
                </div>
                <div className="grid sm:grid-cols-3 gap-3 text-sm">
                  <div className="rounded-lg bg-muted/40 p-3">
                    <p className="text-muted-foreground text-xs mb-1">Monthly premium</p>
                    <p className="font-semibold">{formatPkr(policy.premiumMonthlyPkr)}</p>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-3">
                    <p className="text-muted-foreground text-xs mb-1">Yearly premium</p>
                    <p className="font-semibold">{formatPkrYearly(policy.premiumYearlyPkr)}</p>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-3">
                    <p className="text-muted-foreground text-xs mb-1">Deductible</p>
                    <p className="font-semibold">
                      {policy.deductiblePkr > 0 ? formatPkr(policy.deductiblePkr) : "None"}
                    </p>
                  </div>
                </div>
                {policy.features.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">What&apos;s covered</h4>
                    <ul className="grid sm:grid-cols-2 gap-2 text-sm">
                      {policy.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-border p-5 space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Policyholder:</span> {contact.fullName}
                </p>
                <p>
                  <span className="text-muted-foreground">Phone:</span>{" "}
                  {normalizePkPhone(contact.phone)}
                </p>
                <p>
                  <span className="text-muted-foreground">CNIC:</span>{" "}
                  {user?.hasCnic ? user.cnicMasked : contact.cnic}
                </p>
                <p>
                  <span className="text-muted-foreground">Email:</span> {contact.email}
                </p>
                <p>
                  <span className="text-muted-foreground">Address:</span> {contact.address},{" "}
                  {contact.city}
                </p>
              </div>

              {Object.keys(reviewAnswers).length > 0 && (
                <div className="rounded-xl border border-border p-5">
                  <h3 className="font-semibold mb-3">Questionnaire answers</h3>
                  <ul className="space-y-1 text-sm">
                    {Object.entries(reviewAnswers).map(([key, value]) => (
                      <li key={key}>
                        <span className="text-muted-foreground capitalize">
                          {key.replace(/_/g, " ")}:
                        </span>{" "}
                        {Array.isArray(value) ? value.join(", ") : String(value)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <motion.div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex gap-3 text-sm">
                <ExternalLink className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p>
                  You will leave ClearClever and complete payment on the insurer affiliate page.
                  Use the header link to return if you need to compare other policies.
                </p>
              </motion.div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep("contact")}
                  disabled={submitting}
                  className="flex-1 py-3 border border-border rounded-xl hover:bg-accent transition-all disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => void startInsurerCheckout()}
                  disabled={submitting}
                  className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all inline-flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Starting checkout…
                    </>
                  ) : (
                    <>
                      Continue to {policy.insurer.companyName}
                      <ExternalLink className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function inputClass(hasError: boolean): string {
  return `w-full px-4 py-3 bg-input-background border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 ${
    hasError ? "border-destructive" : "border-border"
  }`;
}

function Field({
  label,
  error,
  input,
}: {
  label: string;
  error?: string;
  input: ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm mb-2">{label}</label>
      {input}
      {error ? <p className="text-xs text-destructive mt-1">{error}</p> : null}
    </div>
  );
}
