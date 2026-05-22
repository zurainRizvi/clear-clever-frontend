import { useState } from "react";
import { useNavigate } from "react-router";
import { Shield, Heart, Car, Home, Briefcase, ArrowRight, ArrowLeft, CheckCircle2, Star, TrendingDown, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useSavedPolicies } from "../saved-policies-context";
import { toast } from "sonner";

export function ComparePolicies() {
  const navigate = useNavigate();
  const { savePolicy, isPolicySaved, removeSavedPolicy } = useSavedPolicies();
  const [step, setStep] = useState<"category" | "questionnaire" | "results">("category");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const categories = [
    {
      id: "health",
      icon: <Heart className="w-8 h-8" />,
      title: "Health Insurance",
      description: "Medical coverage for you and your family",
      color: "from-red-500 to-pink-500"
    },
    {
      id: "auto",
      icon: <Car className="w-8 h-8" />,
      title: "Auto Insurance",
      description: "Comprehensive vehicle protection",
      color: "from-blue-500 to-cyan-500"
    },
    {
      id: "home",
      icon: <Home className="w-8 h-8" />,
      title: "Home Insurance",
      description: "Protect your property and belongings",
      color: "from-green-500 to-emerald-500"
    },
    {
      id: "life",
      icon: <Shield className="w-8 h-8" />,
      title: "Life Insurance",
      description: "Secure your family's financial future",
      color: "from-purple-500 to-violet-500"
    },
    {
      id: "business",
      icon: <Briefcase className="w-8 h-8" />,
      title: "Business Insurance",
      description: "Coverage for your company assets",
      color: "from-orange-500 to-amber-500"
    }
  ];

  const questions = [
    {
      question: "What is your age?",
      type: "select",
      options: ["18-25", "26-35", "36-45", "46-55", "56+"]
    },
    {
      question: "What is your annual income?",
      type: "select",
      options: ["< ₨500,000", "₨500,000 - ₨1,000,000", "₨1,000,000 - ₨2,000,000", "> ₨2,000,000"]
    },
    {
      question: "How many family members do you want to cover?",
      type: "select",
      options: ["Just me", "2 members", "3-4 members", "5+ members"]
    },
    {
      question: "Do you have any pre-existing conditions?",
      type: "select",
      options: ["No", "Yes - Minor", "Yes - Major"]
    },
    {
      question: "What is your preferred coverage amount?",
      type: "select",
      options: ["₨500,000 - ₨1M", "₨1M - ₨2M", "₨2M - ₨5M", "> ₨5M"]
    }
  ];

  const mockPolicies = [
    {
      id: 1,
      name: "Platinum Health Plan",
      provider: "Jubilee Life Insurance",
      logo: "🏥",
      premium: "₨35,000/year",
      coverage: "₨5,000,000",
      rating: 4.8,
      reviews: 1240,
      category: "health",
      features: [
        "Comprehensive hospitalization coverage",
        "Outpatient consultation included",
        "Free annual health checkup",
        "Maternity benefits",
        "No waiting period for accidents"
      ],
      savings: "Save ₨12,000 vs competitors",
      recommended: true
    },
    {
      id: 2,
      name: "Gold Health Shield",
      provider: "EFU Life Assurance",
      logo: "⚕️",
      premium: "₨28,000/year",
      coverage: "₨3,000,000",
      rating: 4.5,
      reviews: 890,
      category: "health",
      features: [
        "Hospitalization coverage",
        "Emergency ambulance service",
        "Pre and post hospitalization",
        "Day care procedures",
        "Room upgrade benefits"
      ],
      savings: "Save ₨8,000 vs competitors"
    },
    {
      id: 3,
      name: "Essential Health Care",
      provider: "Adamjee Insurance",
      logo: "🩺",
      premium: "₨22,000/year",
      coverage: "₨2,000,000",
      rating: 4.3,
      reviews: 654,
      category: "health",
      features: [
        "Basic hospitalization",
        "ICU coverage",
        "Diagnostic tests covered",
        "Pharmacy benefits",
        "Telemedicine consultations"
      ],
      savings: "Save ₨5,000 vs competitors"
    }
  ];

  const handleSavePolicy = (policy: typeof mockPolicies[0]) => {
    if (isPolicySaved(policy.id)) {
      removeSavedPolicy(policy.id);
      toast.success("Policy removed from saved");
    } else {
      savePolicy(policy);
      toast.success("Policy saved successfully!");
    }
  };

  const handlePurchase = (policy: typeof mockPolicies[0]) => {
    navigate("/dashboard/purchase", { state: { policy } });
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setStep("questionnaire");
  };

  const handleAnswer = (answer: string) => {
    setAnswers({ ...answers, [currentQuestion]: answer });
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setStep("results");
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    } else {
      setStep("category");
      setSelectedCategory(null);
      setAnswers({});
      setCurrentQuestion(0);
    }
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="max-w-7xl mx-auto">
      <AnimatePresence mode="wait">
        {step === "category" && (
          <motion.div
            key="category"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Compare Insurance Policies</h1>
              <p className="text-muted-foreground">Select an insurance category to get started</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleCategorySelect(category.id)}
                  className="group relative bg-card border border-border rounded-2xl p-6 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center text-white mb-4`}>
                    {category.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{category.title}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{category.description}</p>
                  <div className="flex items-center gap-2 text-primary text-sm font-medium">
                    Get Started <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {step === "questionnaire" && (
          <motion.div
            key="questionnaire"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-card border border-border rounded-2xl p-8">
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-muted-foreground">
                    Question {currentQuestion + 1} of {questions.length}
                  </span>
                  <span className="text-sm font-medium text-primary">
                    {Math.round(progress)}% Complete
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary to-secondary"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              <h2 className="text-2xl font-bold mb-6">
                {questions[currentQuestion].question}
              </h2>

              <div className="space-y-3 mb-8">
                {questions[currentQuestion].options.map((option, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleAnswer(option)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all hover:border-primary hover:bg-accent ${
                      answers[currentQuestion] === option
                        ? "border-primary bg-accent"
                        : "border-border"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        answers[currentQuestion] === option
                          ? "border-primary bg-primary"
                          : "border-border"
                      }`}>
                        {answers[currentQuestion] === option && (
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <span>{option}</span>
                    </div>
                  </motion.button>
                ))}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleBack}
                  className="px-6 py-3 border border-border rounded-xl hover:bg-accent transition-all flex items-center gap-2"
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-8">
              <button
                onClick={() => {
                  setStep("category");
                  setSelectedCategory(null);
                  setAnswers({});
                  setCurrentQuestion(0);
                }}
                className="text-primary hover:underline mb-4 flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Start New Comparison
              </button>
              <h1 className="text-3xl font-bold mb-2">Top Recommendations for You</h1>
              <p className="text-muted-foreground">Based on your responses, we've found {mockPolicies.length} matching policies</p>
            </div>

            <div className="space-y-6">
              {mockPolicies.map((policy, index) => (
                <motion.div
                  key={policy.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative bg-card border-2 rounded-2xl p-6 hover:shadow-xl transition-all ${
                    policy.recommended ? "border-primary" : "border-border"
                  }`}
                >
                  {policy.recommended && (
                    <div className="absolute -top-3 left-6 px-4 py-1 bg-gradient-to-r from-primary to-secondary text-white text-sm font-semibold rounded-full flex items-center gap-1">
                      <Sparkles className="w-4 h-4" />
                      AI Recommended
                    </div>
                  )}

                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="text-5xl">{policy.logo}</div>
                        <div>
                          <h3 className="text-xl font-bold mb-1">{policy.name}</h3>
                          <p className="text-muted-foreground text-sm mb-2">{policy.provider}</p>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-warning text-warning" />
                              <span className="font-medium">{policy.rating}</span>
                            </div>
                            <span className="text-muted-foreground text-sm">({policy.reviews} reviews)</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        {policy.features.map((feature, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 text-sm text-success">
                        <TrendingDown className="w-4 h-4" />
                        {policy.savings}
                      </div>
                    </div>

                    <div className="lg:w-64 flex flex-col justify-between">
                      <div className="bg-accent/50 rounded-xl p-4 mb-4">
                        <div className="text-sm text-muted-foreground mb-1">Premium</div>
                        <div className="text-2xl font-bold mb-3">{policy.premium}</div>
                        <div className="text-sm text-muted-foreground mb-1">Coverage</div>
                        <div className="text-lg font-semibold">{policy.coverage}</div>
                      </div>

                      <div className="space-y-2">
                        <button
                          onClick={() => handlePurchase(policy)}
                          className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl hover:shadow-lg transition-all"
                        >
                          Purchase Now
                        </button>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleSavePolicy(policy)}
                            className={`py-3 border rounded-xl transition-all flex items-center justify-center gap-2 ${
                              isPolicySaved(policy.id)
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border hover:bg-accent"
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${isPolicySaved(policy.id) ? "fill-primary" : ""}`} />
                            {isPolicySaved(policy.id) ? "Saved" : "Save"}
                          </button>
                          <button className="py-3 border border-border rounded-xl hover:bg-accent transition-all">
                            Details
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
