import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  Loader2,
  Shield,
  User,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { useAuth } from "../auth-context";
import { fetchCategoryQuestions } from "@/lib/auth-api";
import { ApiError } from "@/lib/api";
import { copy } from "@/lib/copy";
import { formatPkrYearly } from "@/lib/format";
import { isValidPkPhone, normalizePkPhone } from "@/lib/phone";
import { createPurchase, fetchStoredQuestionnaireAnswers } from "@/lib/purchase-api";
import {
  clearPurchaseDraft,
  loadPurchaseDraft,
  savePurchaseDraft,
} from "@/lib/purchase-draft";
import type { PolicyQuestion, PublicPolicy } from "@/lib/types";
import { ClearCleverLogo } from "../auth/clearclever-logo";
import { InsurerLogo } from "./insurer-logo";

type Step = "questionnaire" | "contact" | "review";

interface PurchaseLocationState {
  policy?: PublicPolicy;
  answers?: Record<string, unknown>;
  category?: string;
}

interface ContactForm {
  fullName: string;
  email: string;
  phone: string;
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

function requiredQuestionsAnswered(
  questions: PolicyQuestion[],
  answers: Record<string, unknown>
): boolean {
  return questions
    .filter((q) => q.required !== false)
    .every((q) => {
      const value = answers[q.id];
      if (value === undefined || value === null || value === "") return false;
      if (Array.isArray(value) && value.length === 0) return false;
      if (typeof value === "number" && !Number.isFinite(value)) return false;
      return true;
    });
}

function firstUnansweredQuestionIndex(
  questions: PolicyQuestion[],
  answers: Record<string, unknown>
): number {
  const index = questions.findIndex((question) => {
    if (question.required === false) return false;
    const value = answers[question.id];
    return value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);
  });
  return index === -1 ? 0 : index;
}

export function PurchaseFlow() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userName, userEmail, user } = useAuth();

  const locationState = (location.state ?? {}) as PurchaseLocationState;
  const storedDraft = loadPurchaseDraft();

  const policy = isPublicPolicy(locationState.policy)
    ? locationState.policy
    : storedDraft?.policy;

  const category =
    locationState.category ?? policy?.category ?? storedDraft?.category ?? "";

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
    fullName: userName ?? "",
    email: userEmail ?? "",
    phone: user?.phone ?? "",
    address: "",
    city: "",
    postalCode: "",
  });

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
        const storedAnswers = stored?.response?.answers ?? {};
        const mergedAnswers = { ...storedAnswers, ...answers };
        setQuestions(nextQuestions);
        setAnswers(mergedAnswers);
        setCurrentQuestion(firstUnansweredQuestionIndex(nextQuestions, mergedAnswers));
        const complete = requiredQuestionsAnswered(nextQuestions, mergedAnswers);
        setStep(complete ? "contact" : "questionnaire");
      })
      .catch(() => {
        if (!cancelled) setStep("contact");
      })
      .finally(() => {
        if (!cancelled) setLoadingQuestions(false);
      });

    return () => {
      cancelled = true;
    };
  }, [policy?.id, category]);

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
          onClick={() => navigate("/dashboard/compare")}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all"
        >
          Compare policies
        </button>
      </motion.div>
    );
  }

  if (loadingQuestions && questions.length === 0) {
    return (
      <motion.div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
    }
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
      errors.phone = "Enter a valid Pakistan mobile number (e.g. 03XX XXXXXXX or +923XX XXXXXXX).";
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
      return;
    }

    setSubmitting(true);
    try {
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
        onClick={() => navigate("/dashboard/compare")}
        className="text-primary hover:underline mb-6 flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to comparison
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
                question={currentQ}
                value={answers[currentQ.id]}
                onAnswer={handleQuestionAnswer}
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
                  label="Mobile number (Pakistan)"
                  error={fieldErrors.phone}
                  input={
                    <input
                      type="tel"
                      value={contact.phone}
                      onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                      placeholder="03XX XXXXXXX or +923XX XXXXXXX"
                      className={inputClass(!!fieldErrors.phone)}
                    />
                  }
                />
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
                    onClick={() => setStep("questionnaire")}
                    className="flex-1 py-3 border border-border rounded-xl hover:bg-accent transition-all"
                  >
                    Back to questionnaire
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (validateContact()) setStep("review");
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

              <div className="rounded-xl border border-border p-5 space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Policyholder:</span> {contact.fullName}
                </p>
                <p>
                  <span className="text-muted-foreground">Phone:</span>{" "}
                  {normalizePkPhone(contact.phone)}
                </p>
                <p>
                  <span className="text-muted-foreground">Email:</span> {contact.email}
                </p>
                <p>
                  <span className="text-muted-foreground">Address:</span> {contact.address},{" "}
                  {contact.city}
                </p>
              </div>

              {Object.keys(answers).length > 0 && (
                <div className="rounded-xl border border-border p-5">
                  <h3 className="font-semibold mb-3">Questionnaire answers</h3>
                  <ul className="space-y-1 text-sm">
                    {Object.entries(answers).map(([key, value]) => (
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

  if (question.type === "multi" && question.options?.length) {
    return <MultiQuestionInput question={question} value={value} onAnswer={onAnswer} />;
  }

  if (question.type === "number") {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const raw = new FormData(e.currentTarget).get("answer");
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

function MultiQuestionInput({
  question,
  value,
  onAnswer,
}: {
  question: PolicyQuestion;
  value: unknown;
  onAnswer: (value: unknown) => void;
}) {
  const [selected, setSelected] = useState<string[]>(Array.isArray(value) ? value.map(String) : []);
  const toggle = (option: string) =>
    setSelected((current) =>
      current.includes(option)
        ? current.filter((item) => item !== option)
        : [...current, option]
    );

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {question.options?.map((option) => {
          const checked = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              className={`w-full text-left p-4 rounded-lg border transition-all duration-200 flex items-center gap-3 ${
                checked
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30 hover:bg-accent/50"
              }`}
            >
              <span
                className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                  checked ? "bg-primary border-primary text-primary-foreground" : "border-border"
                }`}
              >
                {checked ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
              </span>
              {option}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => onAnswer(selected)}
        disabled={question.required !== false && selected.length === 0}
        className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50"
      >
        {copy.compare.questionnaireCta}
      </button>
    </div>
  );
}
