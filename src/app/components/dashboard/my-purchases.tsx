import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  Calendar,
  CheckCircle2,
  CreditCard,
  Loader2,
  Mail,
  ShoppingBag,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { formatPkr } from "@/lib/format";
import { fetchPurchases, type PurchaseSummary } from "@/lib/purchase-api";

export function MyPurchases() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [purchases, setPurchases] = useState<PurchaseSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchPurchases();
      setPurchases(data.purchases);
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
          Compare policies and complete checkout to see your purchase timeline here.
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
          Track payment, insurer email, and scheduled advisor calls.
        </p>
      </div>

      {purchases.map((purchase, index) => (
        <motion.article
          key={purchase.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-5">
            <div>
              <h2 className="text-xl font-bold">{purchase.policy?.name ?? "Policy"}</h2>
              <p className="text-sm text-muted-foreground">
                {purchase.insurer?.companyName} · {purchase.policy?.category}
              </p>
            </div>
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
              title="Advisor call scheduled"
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
        </motion.article>
      ))}
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
