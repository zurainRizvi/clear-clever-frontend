import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  Calendar,
  CheckCircle2,
  CreditCard,
  FileText,
  Loader2,
  Mail,
  Phone,
  ShoppingBag,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { formatPkr, formatPkrYearly } from "@/lib/format";
import {
  fetchPurchases,
  rescheduleAgentCall,
  type PurchaseSummary,
} from "@/lib/purchase-api";

export function MyPurchases() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [purchases, setPurchases] = useState<PurchaseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(searchParams.get("focus"));
  const [rescheduleTarget, setRescheduleTarget] = useState<PurchaseSummary | null>(null);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("14:30");
  const focusId = searchParams.get("focus");

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchPurchases();
      setPurchases(data.purchases);
      if (!expandedId && data.purchases[0]) setExpandedId(data.purchases[0].id);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not load purchases");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (searchParams.get("completed") === "1") {
      toast.success("Purchase completed! Your timeline is updated below.");
      searchParams.delete("completed");
      searchParams.delete("purchaseId");
      setSearchParams(searchParams, { replace: true });
      void load();
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!focusId) return;
    setExpandedId(focusId);
    window.setTimeout(() => {
      document.getElementById(`purchase-${focusId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 100);
  }, [focusId]);

  const activePolicies = useMemo(
    () => purchases.filter((purchase) => purchase.status === "completed"),
    [purchases]
  );

  const submitReschedule = async () => {
    if (!rescheduleTarget) return;
    try {
      const data = await rescheduleAgentCall(rescheduleTarget.id, {
        scheduledDate,
        scheduledTime,
      });
      setPurchases((prev) =>
        prev.map((purchase) =>
          purchase.id === rescheduleTarget.id ? data.purchase : purchase
        )
      );
      setRescheduleTarget(null);
      toast.success("Agent call rescheduled");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not reschedule call");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (purchases.length === 0) {
    return (
      <div className="text-center py-20">
        <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-2xl font-bold mb-2">No purchases yet</h2>
        <p className="text-muted-foreground mb-6">
          Compare policies and complete checkout to see your active policy cards here.
        </p>
        <button
          type="button"
          onClick={() => navigate("/dashboard/compare")}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg"
        >
          Compare policies
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">My purchases</h1>
        <p className="text-muted-foreground">
          Open active policies, view benefits, reschedule agent calls, and start claims.
        </p>
      </div>

      {activePolicies.length > 0 && (
        <div className="grid sm:grid-cols-3 gap-3">
          <SummaryCard label="Active policies" value={String(activePolicies.length)} />
          <SummaryCard
            label="Monthly premium"
            value={formatPkr(
              activePolicies.reduce(
                (sum, purchase) => sum + (purchase.policy?.premiumMonthlyPkr ?? 0),
                0
              )
            )}
          />
          <SummaryCard
            label="Claims opened"
            value={String(purchases.reduce((sum, purchase) => sum + (purchase.claims?.length ?? 0), 0))}
          />
        </div>
      )}

      {purchases.map((purchase, index) => {
        const expanded = expandedId === purchase.id;
        const focused = focusId === purchase.id;
        return (
        <motion.article
          key={purchase.id}
          id={`purchase-${purchase.id}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className={`bg-card border rounded-xl p-6 transition-all ${
            focused ? "border-primary shadow-lg shadow-primary/10" : "border-border"
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-5">
            <button
              type="button"
              onClick={() => setExpandedId(expanded ? null : purchase.id)}
              className="text-left flex-1"
            >
              <h2 className="text-xl font-bold">{purchase.policy?.name ?? "Policy"}</h2>
              <p className="text-sm text-muted-foreground">
                {purchase.insurer?.companyName} · {purchase.policy?.category}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {purchase.policy?.coverageSummary}
              </p>
            </button>
            <div className="text-right">
              <StatusBadge status={purchase.status} />
              {purchase.policy?.premiumMonthlyPkr != null && (
                <p className="text-sm text-muted-foreground mt-1">
                  {formatPkr(purchase.policy.premiumMonthlyPkr)}/mo
                </p>
              )}
            </div>
          </div>

          <ol className="space-y-3">
            <TimelineItem
              done={purchase.timeline.paymentProcessed}
              icon={CreditCard}
              title="Payment processed"
              detail={
                purchase.paymentProcessedAt
                  ? new Date(purchase.paymentProcessedAt).toLocaleString()
                  : "Pending — complete payment on insurer checkout"
              }
            />
            <TimelineItem
              done={Boolean(purchase.timeline.email)}
              icon={Mail}
              title="Insurer confirmation email"
              detail={
                purchase.timeline.email
                  ? `${purchase.timeline.email.subject} · ${new Date(purchase.timeline.email.sentAt).toLocaleString()}`
                  : "Sent after purchase completion"
              }
            />
            <TimelineItem
              done={Boolean(purchase.timeline.callScheduled)}
              icon={Calendar}
              title="Agent call scheduled"
              detail={
                purchase.timeline.callScheduled
                  ? `${new Date(purchase.timeline.callScheduled.scheduledAt).toLocaleString()} · ${purchase.timeline.callScheduled.status}`
                  : "Scheduled after purchase completion"
              }
            />
            <TimelineItem
              done={purchase.timeline.completed}
              icon={CheckCircle2}
              title="Purchase completed"
              detail={
                purchase.completedAt
                  ? new Date(purchase.completedAt).toLocaleString()
                  : "Finish on insurer checkout step 4"
              }
            />
          </ol>
          {expanded && (
            <div className="mt-6 grid lg:grid-cols-2 gap-4 border-t border-border pt-5">
              <div className="rounded-xl bg-muted/30 p-4">
                <h3 className="font-semibold mb-3">Benefits and documents</h3>
                <ul className="space-y-2 text-sm">
                  {(purchase.policy?.features ?? []).map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                {purchase.policy?.documentSummary && (
                  <div className="mt-4 text-sm text-muted-foreground">
                    <p>Policy no: {purchase.policy.documentSummary.policyNumber}</p>
                    <p>Issued: {new Date(purchase.policy.documentSummary.issuedAt).toLocaleDateString()}</p>
                    <p>Deductible: {formatPkr(purchase.policy.deductiblePkr ?? 0)}</p>
                  </div>
                )}
              </div>
              <div className="rounded-xl bg-muted/30 p-4 space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Company and agent</h3>
                  <p className="text-sm">{purchase.insurer?.companyName}</p>
                  <p className="text-sm text-muted-foreground">{purchase.insurer?.contactEmail}</p>
                  <p className="text-sm text-muted-foreground">{purchase.insurer?.contactPhone}</p>
                  <p className="text-sm mt-2">
                    Agent: {purchase.timeline.callScheduled?.agentLabel ?? "ClearClever agent"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRescheduleTarget(purchase);
                      const scheduled = purchase.timeline.callScheduled?.scheduledAt;
                      if (scheduled) {
                        const pkt = new Date(new Date(scheduled).getTime() + 5 * 60 * 60 * 1000);
                        setScheduledDate(pkt.toISOString().slice(0, 10));
                        setScheduledTime(pkt.toISOString().slice(11, 16));
                      }
                    }}
                    className="px-3 py-2 border border-border rounded-lg text-sm inline-flex items-center gap-2 hover:bg-accent"
                  >
                    <Phone className="w-4 h-4" />
                    Reschedule agent
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/dashboard/claims?purchaseId=${purchase.id}`)}
                    className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm inline-flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Start claim
                  </button>
                </div>
                <div className="text-sm text-muted-foreground">
                  Premium:{" "}
                  {purchase.policy?.premiumYearlyPkr
                    ? formatPkrYearly(
                        purchase.policy.premiumMonthlyPkr,
                        purchase.policy.premiumYearlyPkr
                      )
                    : `${formatPkr(purchase.policy?.premiumMonthlyPkr ?? 0)}/mo`}
                </div>
              </div>
            </div>
          )}
        </motion.article>
        );
      })}

      {rescheduleTarget && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-2">Reschedule agent call</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Choose a future date and time in Pakistan Standard Time (PKT).
            </p>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm">
                Date
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="mt-1 w-full px-3 py-2 bg-input-background border border-border rounded-lg"
                />
              </label>
              <label className="text-sm">
                Time (PKT)
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="mt-1 w-full px-3 py-2 bg-input-background border border-border rounded-lg"
                />
              </label>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                type="button"
                onClick={() => setRescheduleTarget(null)}
                className="flex-1 py-2 border border-border rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void submitReschedule()}
                className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "completed"
      ? "bg-success/10 text-success"
      : status === "pending"
        ? "bg-amber-500/10 text-amber-600"
        : "bg-muted text-muted-foreground";

  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize ${styles}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function TimelineItem({
  done,
  icon: Icon,
  title,
  detail,
}: {
  done: boolean;
  icon: typeof CreditCard;
  title: string;
  detail: string;
}) {
  return (
    <li className="flex gap-3 text-sm">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          done ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
        }`}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-muted-foreground">{detail}</p>
      </div>
    </li>
  );
}
