import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { ArrowLeft, CheckCircle2, CreditCard, FileText, Shield, Upload, User } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import type { PublicPolicy } from "@/lib/types";
import { formatPkrYearly } from "@/lib/format";

function isPublicPolicy(policy: unknown): policy is PublicPolicy {
  return (
    typeof policy === "object" &&
    policy !== null &&
    "insurer" in policy &&
    "premiumMonthlyPkr" in policy
  );
}

export function PurchaseFlow() {
  const navigate = useNavigate();
  const location = useLocation();
  const policy = location.state?.policy;

  const [step, setStep] = useState<"details" | "documents" | "payment" | "confirmation">("details");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    idCard: null as File | null,
    medicalReport: null as File | null,
    paymentMethod: "card"
  });

  if (!policy) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-4">No Policy Selected</h2>
        <p className="text-muted-foreground mb-6">Please select a policy from the comparison page</p>
        <button
          onClick={() => navigate("/dashboard/compare")}
          className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl hover:shadow-lg transition-all"
        >
          Compare Policies
        </button>
      </div>
    );
  }

  const handleFileChange = (field: "idCard" | "medicalReport", file: File | null) => {
    setFormData({ ...formData, [field]: file });
  };

  const handleSubmit = () => {
    setStep("confirmation");
    toast.success("Purchase completed successfully!");
  };

  const progress = {
    details: 25,
    documents: 50,
    payment: 75,
    confirmation: 100
  }[step];

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate("/dashboard/compare")}
        className="text-primary hover:underline mb-6 flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Comparison
      </button>

      <div className="bg-card border border-border rounded-2xl p-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">Purchase Insurance</h1>
            <span className="text-sm text-muted-foreground">{progress}% Complete</span>
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

        {/* Policy Summary */}
        <div className="mb-8 p-6 bg-accent/50 rounded-xl">
          <div className="flex items-center gap-4 mb-4">
            {!isPublicPolicy(policy) && policy.logo ? (
              <div className="text-5xl">{policy.logo}</div>
            ) : (
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
            )}
            <div>
              <h3 className="text-xl font-bold">{policy.name}</h3>
              <p className="text-muted-foreground">
                {isPublicPolicy(policy)
                  ? policy.insurer.companyName
                  : policy.provider}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Premium</div>
              <div className="text-2xl font-bold">
                {isPublicPolicy(policy)
                  ? formatPkrYearly(policy.premiumMonthlyPkr, policy.premiumYearlyPkr)
                  : policy.premium}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Coverage</div>
              <div className="text-2xl font-bold">
                {isPublicPolicy(policy) ? policy.coverageSummary : policy.coverage}
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === "details" && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white">
                  <User className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-bold">Personal Details</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2">Full Name</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                    className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+92 300 1234567"
                    className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Karachi"
                    className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm mb-2">Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="123 Main Street, Area Name"
                    className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Postal Code</label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    placeholder="75500"
                    className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>

              <button
                onClick={() => setStep("documents")}
                className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl hover:shadow-lg transition-all"
              >
                Continue to Documents
              </button>
            </motion.div>
          )}

          {step === "documents" && (
            <motion.div
              key="documents"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white">
                  <FileText className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-bold">Upload Documents</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-2">National ID Card / Passport</label>
                  <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary transition-all cursor-pointer">
                    <Upload className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                    <input
                      type="file"
                      onChange={(e) => handleFileChange("idCard", e.target.files?.[0] || null)}
                      className="hidden"
                      id="idCard"
                      accept="image/*,.pdf"
                    />
                    <label htmlFor="idCard" className="cursor-pointer">
                      {formData.idCard ? (
                        <span className="text-success">{formData.idCard.name}</span>
                      ) : (
                        <span className="text-muted-foreground">Click to upload or drag and drop</span>
                      )}
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm mb-2">Medical Report (if applicable)</label>
                  <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary transition-all cursor-pointer">
                    <Upload className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                    <input
                      type="file"
                      onChange={(e) => handleFileChange("medicalReport", e.target.files?.[0] || null)}
                      className="hidden"
                      id="medicalReport"
                      accept="image/*,.pdf"
                    />
                    <label htmlFor="medicalReport" className="cursor-pointer">
                      {formData.medicalReport ? (
                        <span className="text-success">{formData.medicalReport.name}</span>
                      ) : (
                        <span className="text-muted-foreground">Click to upload or drag and drop</span>
                      )}
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep("details")}
                  className="flex-1 py-3 border border-border rounded-xl hover:bg-accent transition-all"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep("payment")}
                  className="flex-1 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl hover:shadow-lg transition-all"
                >
                  Continue to Payment
                </button>
              </div>
            </motion.div>
          )}

          {step === "payment" && (
            <motion.div
              key="payment"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-bold">Payment Method</h2>
              </div>

              <div className="space-y-3">
                {[
                  { id: "card", label: "Credit / Debit Card", icon: "💳" },
                  { id: "bank", label: "Bank Transfer", icon: "🏦" },
                  { id: "wallet", label: "Digital Wallet", icon: "📱" }
                ].map((method) => (
                  <div
                    key={method.id}
                    onClick={() => setFormData({ ...formData, paymentMethod: method.id })}
                    className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      formData.paymentMethod === method.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{method.icon}</span>
                      <span className="font-medium">{method.label}</span>
                      {formData.paymentMethod === method.id && (
                        <CheckCircle2 className="w-5 h-5 text-primary ml-auto" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {formData.paymentMethod === "card" && (
                <div className="space-y-4 p-6 bg-accent/30 rounded-xl">
                  <div>
                    <label className="block text-sm mb-2">Card Number</label>
                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm mb-2">Expiry Date</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-2">CVV</label>
                      <input
                        type="text"
                        placeholder="123"
                        className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="p-6 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-muted-foreground">Annual Premium</span>
                  <span className="font-semibold">{policy.premium.split("/")[0]}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-muted-foreground">Processing Fee</span>
                  <span className="font-semibold">₨500</span>
                </div>
                <div className="border-t border-border my-3 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-lg">Total Amount</span>
                    <span className="font-bold text-2xl text-primary">
                      ₨{parseInt(policy.premium.match(/\d+/)?.[0] || "0") + 500}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep("documents")}
                  className="flex-1 py-3 border border-border rounded-xl hover:bg-accent transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl hover:shadow-lg transition-all"
                >
                  Complete Purchase
                </button>
              </div>
            </motion.div>
          )}

          {step === "confirmation" && (
            <motion.div
              key="confirmation"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-success to-emerald-600 flex items-center justify-center"
              >
                <CheckCircle2 className="w-16 h-16 text-white" />
              </motion.div>
              <h2 className="text-3xl font-bold mb-4">Purchase Successful!</h2>
              <p className="text-xl text-muted-foreground mb-2">
                Your insurance policy has been activated
              </p>
              <p className="text-muted-foreground mb-8">
                Policy ID: INS-{Math.random().toString(36).substr(2, 9).toUpperCase()}
              </p>
              <div className="max-w-md mx-auto space-y-3">
                <button
                  onClick={() => navigate("/dashboard/purchases")}
                  className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl hover:shadow-lg transition-all"
                >
                  View My Policies
                </button>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="w-full py-3 border border-border rounded-xl hover:bg-accent transition-all"
                >
                  Go to Dashboard
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
