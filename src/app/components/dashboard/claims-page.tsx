import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { FileText, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { AnimatedPage } from "../ui/animated-page";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { formatPkr } from "@/lib/format";
import { statusClass } from "@/lib/provider-utils";
import {
  createClaim,
  fetchClaims,
  fetchPurchases,
  type ClaimSummary,
  type PurchaseSummary,
} from "@/lib/purchase-api";

const CLAIM_TYPES = [
  { value: "accident", label: "Accident" },
  { value: "theft", label: "Theft" },
  { value: "damage", label: "Damage" },
  { value: "medical", label: "Medical" },
  { value: "pet_care", label: "Pet care" },
  { value: "home", label: "Home" },
  { value: "auto", label: "Auto / Vehicle" },
  { value: "life", label: "Life" },
  { value: "pet", label: "Pet" },
  { value: "other", label: "Other" },
];

export function ClaimsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [claims, setClaims] = useState<ClaimSummary[]>([]);
  const [purchases, setPurchases] = useState<PurchaseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState(
    searchParams.get("purchaseId") ?? ""
  );
  const [claimType, setClaimType] = useState("damage");
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().slice(0, 10));
  const [estimatedAmountPkr, setEstimatedAmountPkr] = useState("");
  const [description, setDescription] = useState("");
  const [otherClaimType, setOtherClaimType] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const focusId = searchParams.get("focus");

  const load = async () => {
    setLoading(true);
    try {
      const [claimsData, purchasesData] = await Promise.all([fetchClaims(), fetchPurchases()]);
      setClaims(claimsData.claims);
      setPurchases(purchasesData.purchases.filter((purchase) => purchase.status === "completed"));
      if (!selectedPurchaseId) {
        const first = purchasesData.purchases.find((purchase) => purchase.status === "completed");
        if (first) setSelectedPurchaseId(first.id);
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not load claims");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!focusId) return;
    window.setTimeout(() => {
      document.getElementById(`claim-${focusId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 100);
  }, [focusId]);

  const selectedPurchase = useMemo(
    () => purchases.find((purchase) => purchase.id === selectedPurchaseId),
    [purchases, selectedPurchaseId]
  );

  const submitClaim = async () => {
    if (!selectedPurchaseId) {
      toast.error("Select an active policy first");
      return;
    }
    if (description.trim().length < 5) {
      toast.error("Add a short description so your insurer knows what to review.");
      return;
    }
    if (claimType === "other" && otherClaimType.trim().length < 2) {
      toast.error("Please mention the other claim type.");
      return;
    }
    if (estimatedAmountPkr && Number(estimatedAmountPkr) < 0) {
      toast.error("Estimated amount cannot be negative.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await createClaim({
        purchaseId: selectedPurchaseId,
        claimType,
        incidentDate,
        estimatedAmountPkr: estimatedAmountPkr ? Number(estimatedAmountPkr) : undefined,
        description:
          claimType === "other"
            ? `[Other type: ${otherClaimType.trim()}] ${description.trim()}`
            : description.trim(),
      });
      setClaims((prev) => [result.claim, ...prev]);
      setDescription("");
      setEstimatedAmountPkr("");
      setOtherClaimType("");
      setSearchParams({}, { replace: true });
      toast.success("Claim sent to your insurer for review and approval");
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.errors[0] ?? err.message
          : "Could not submit claim"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AnimatedPage className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Claims</h1>
        <p className="text-muted-foreground">
          Submit a claim from an active policy. It is sent to your insurer for review and approval.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_1.2fr] gap-6">
        <section className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">New claim request</h2>
          {purchases.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Complete a policy purchase before opening a claim.
            </p>
          ) : (
            <div className="space-y-4">
              <label className="block text-sm">
                Active policy
                <select
                  value={selectedPurchaseId}
                  onChange={(e) => setSelectedPurchaseId(e.target.value)}
                  className="mt-1 w-full px-3 py-2 bg-input-background border border-border rounded-lg"
                >
                  {purchases.map((purchase) => (
                    <option key={purchase.id} value={purchase.id}>
                      {purchase.policy?.name} — {purchase.insurer?.companyName}
                    </option>
                  ))}
                </select>
              </label>
              {selectedPurchase && (
                <div className="rounded-lg bg-muted/30 p-3 text-sm text-muted-foreground">
                  {selectedPurchase.policy?.coverageSummary}
                </div>
              )}
              <label className="block text-sm">
                Claim type
                <select
                  value={claimType}
                  onChange={(e) => setClaimType(e.target.value)}
                  className="mt-1 w-full px-3 py-2 bg-input-background border border-border rounded-lg"
                >
                  {CLAIM_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </label>
              {claimType === "other" ? (
                <label className="block text-sm">
                  What is the other claim type?
                  <input
                    type="text"
                    value={otherClaimType}
                    onChange={(e) => setOtherClaimType(e.target.value)}
                    placeholder="e.g. Fire, flood, travel, etc."
                    className="mt-1 w-full px-3 py-2 bg-input-background border border-border rounded-lg"
                  />
                </label>
              ) : null}
              <label className="block text-sm">
                Incident date
                <input
                  type="date"
                  value={incidentDate}
                  onChange={(e) => setIncidentDate(e.target.value)}
                  className="mt-1 w-full px-3 py-2 bg-input-background border border-border rounded-lg"
                />
              </label>
              <label className="block text-sm">
                Estimated amount (PKR)
                <input
                  type="number"
                  value={estimatedAmountPkr}
                  onChange={(e) => setEstimatedAmountPkr(e.target.value)}
                  className="mt-1 w-full px-3 py-2 bg-input-background border border-border rounded-lg"
                />
              </label>
              <label className="block text-sm">
                What happened?
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 w-full min-h-28 px-3 py-2 bg-input-background border border-border rounded-lg"
                  placeholder="Describe the incident, damage, documents available, and any urgent help needed."
                />
              </label>
              <button
                type="button"
                onClick={() => void submitClaim()}
                disabled={submitting}
                className="w-full py-3 bg-primary text-primary-foreground rounded-lg disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit claim"}
              </button>
            </div>
          )}
        </section>

        <section className="space-y-3">
          {claims.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-10 text-center">
              <FileText className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <h2 className="font-semibold mb-1">No claims yet</h2>
              <p className="text-sm text-muted-foreground">
                Claims you submit from active policies will appear here.
              </p>
            </div>
          ) : (
            claims.map((claim, index) => (
              <motion.article
                key={claim.id}
                id={`claim-${claim.id}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className={`bg-card border rounded-xl p-5 ${
                  focusId === claim.id ? "border-primary shadow-lg shadow-primary/10" : "border-border"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{claim.policy?.name ?? "Policy claim"}</h3>
                    <p className="text-sm text-muted-foreground">
                      {claim.insurer?.companyName} · {claim.claimType.replace(/_/g, " ")}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs capitalize ${statusClass(claim.status)}`}
                  >
                    {claim.status === "submitted"
                      ? "Sent to insurer"
                      : claim.status === "in_review"
                        ? "Insurer reviewing"
                        : claim.status.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="text-sm mt-3">{claim.description}</p>
                <div className="text-xs text-muted-foreground mt-3">
                  Incident: {new Date(claim.incidentDate).toLocaleDateString()}
                  {claim.estimatedAmountPkr
                    ? ` · Estimate: ${formatPkr(claim.estimatedAmountPkr)}`
                    : ""}
                </div>
              </motion.article>
            ))
          )}
        </section>
      </div>
    </AnimatedPage>
  );
}
