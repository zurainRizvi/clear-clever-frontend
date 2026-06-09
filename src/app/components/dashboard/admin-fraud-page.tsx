import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Loader2, ShieldCheck } from "lucide-react";
import { Link, useSearchParams } from "react-router";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import {
  fetchFraudSignals,
  type FraudCategory,
  type FraudMlSummary,
  type FraudSignal,
} from "@/lib/admin-api";
import { motion, useReducedMotion } from "motion/react";
import { fadeUpItem, quickTransition, staggerDelay } from "@/lib/motion-presets";
import { AnimatedPage } from "../ui/animated-page";
import { AnimatedPillTabs } from "../ui/animated-pill-tabs";
import {
  FraudCategorySummary,
  FraudSignalInsightCard,
  MlDisclaimerBanner,
} from "./ml-insight-ui";

const TABS: { id: FraudCategory; label: string; description: string }[] = [
  {
    id: "account",
    label: "Account risk",
    description: "Sign-ins, duplicate identities, and provider verification",
  },
  {
    id: "claims",
    label: "Claims",
    description: "Unusual filing patterns and rejection trends",
  },
  {
    id: "commerce",
    label: "Commerce",
    description: "Checkout activity and lead volume anomalies",
  },
  {
    id: "catalog",
    label: "Provider catalog",
    description: "Policy review delays and rejection rates",
  },
];

function isFraudCategory(value: string | null): value is FraudCategory {
  return value === "account" || value === "claims" || value === "commerce" || value === "catalog";
}

function isInternalFraudLink(link: string): boolean {
  try {
    const url = new URL(link, window.location.origin);
    return url.pathname === "/admin-dashboard/fraud";
  } catch {
    return link.startsWith("/admin-dashboard/fraud");
  }
}

function focusFromFraudLink(link: string): string | null {
  try {
    const url = new URL(link, window.location.origin);
    return url.searchParams.get("focus");
  } catch {
    return null;
  }
}

export function AdminFraudPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get("category");
  const focusId = searchParams.get("focus");
  const tab: FraudCategory = isFraudCategory(categoryParam) ? categoryParam : "account";

  const [signals, setSignals] = useState<FraudSignal[]>([]);
  const [mlSummary, setMlSummary] = useState<FraudMlSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedMlId, setExpandedMlId] = useState<string | null>(null);
  const scrolledFocusRef = useRef<string | null>(null);

  const setTab = (next: FraudCategory) => {
    scrolledFocusRef.current = null;
    setExpandedMlId(null);
    setSearchParams(
      (prev) => {
        const nextParams = new URLSearchParams(prev);
        nextParams.set("category", next);
        nextParams.delete("focus");
        return nextParams;
      },
      { replace: true }
    );
  };

  const focusSignal = (signalId: string) => {
    scrolledFocusRef.current = null;
    setSearchParams(
      (prev) => {
        const nextParams = new URLSearchParams(prev);
        nextParams.set("category", tab);
        nextParams.set("focus", signalId);
        return nextParams;
      },
      { replace: true }
    );
  };

  const load = useCallback(async (category: FraudCategory) => {
    setLoading(true);
    try {
      const data = await fetchFraudSignals(category);
      setSignals(data.signals);
      setMlSummary(data.mlSummary ?? null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not load fraud signals");
      setSignals([]);
      setMlSummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(tab);
  }, [tab, load]);

  useEffect(() => {
    if (!focusId || loading) return;
    if (scrolledFocusRef.current === focusId) return;

    const timer = window.setTimeout(() => {
      const el = document.getElementById(`fraud-signal-${focusId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
        scrolledFocusRef.current = focusId;
      }
    }, 150);

    return () => window.clearTimeout(timer);
  }, [focusId, loading, signals]);

  const activeMeta = TABS.find((item) => item.id === tab);

  const renderReviewAction = (alert: FraudSignal) => {
    if (!alert.link) return null;

    if (isInternalFraudLink(alert.link)) {
      const linkedFocus = focusFromFraudLink(alert.link) ?? alert.id;
      return (
        <button
          type="button"
          onClick={() => focusSignal(linkedFocus)}
          className="text-sm text-primary hover:underline shrink-0 font-medium"
        >
          View in list
        </button>
      );
    }

    return (
      <Link
        to={alert.link}
        className="text-sm text-primary hover:underline shrink-0 font-medium"
      >
        Open details
      </Link>
    );
  };

  const pillTabs = TABS.map((item) => ({ id: item.id, label: item.label }));
  const reducedMotion = useReducedMotion();

  return (
    <AnimatedPage className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Risk monitoring</h1>
        <p className="text-muted-foreground max-w-2xl leading-relaxed">
          ClearClever watches for unusual activity across your platform. Rule-based alerts tell you
          what changed; AI estimates how likely each pattern is fraudulent so you can prioritize
          investigations.
        </p>
      </div>

      <AnimatedPillTabs
        tabs={pillTabs}
        activeId={tab}
        onChange={(id) => setTab(id as FraudCategory)}
        layoutId="admin-fraud-category"
      />

      <p className="text-sm text-muted-foreground">{activeMeta?.description}</p>

      {!loading && mlSummary && signals.length > 0 ? (
        <FraudCategorySummary
          summary={mlSummary}
          signalCount={signals.length}
          categoryLabel={activeMeta?.label ?? "This category"}
        />
      ) : null}

      <MlDisclaimerBanner />

      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : signals.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground space-y-3">
            <ShieldCheck className="w-12 h-12 mx-auto text-success/70" />
            <div>
              <p className="font-medium text-foreground">Nothing to review right now</p>
              <p className="text-sm mt-1 max-w-md mx-auto">
                No alerts in {activeMeta?.label?.toLowerCase() ?? "this category"}. We will surface
                new signals here when activity looks unusual.
              </p>
            </div>
          </div>
        ) : (
          signals.map((alert, idx) => {
            const isFocused = focusId === alert.id;
            return (
              <motion.article
                key={alert.id}
                id={`fraud-signal-${alert.id}`}
                variants={fadeUpItem}
                initial="hidden"
                animate="visible"
                transition={{ ...quickTransition, delay: staggerDelay(idx, !!reducedMotion, 0.05) }}
                layout
                className={`rounded-xl border border-border bg-accent/20 p-5 space-y-4 ${
                  isFocused ? "ring-2 ring-primary shadow-md border-primary/30" : ""
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="min-w-0 space-y-1">
                    <h2 className="font-semibold text-base leading-snug">{alert.type}</h2>
                    <p className="text-sm font-medium">{alert.subject}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{alert.detail}</p>
                    <p className="text-xs text-muted-foreground pt-1">
                      Detected {new Date(alert.detectedAt).toLocaleString()}
                    </p>
                  </div>
                  {renderReviewAction(alert)}
                </div>

                <div className="border-t border-border/60 pt-4">
                  <FraudSignalInsightCard
                    signal={alert}
                    expanded={expandedMlId === alert.id}
                    onToggleExpand={() =>
                      setExpandedMlId((prev) => (prev === alert.id ? null : alert.id))
                    }
                  />
                </div>
              </motion.article>
            );
          })
        )}
      </div>

      {!loading && signals.length > 0 ? (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...quickTransition, delay: 0.2 }}
          className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1.5"
        >
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden />
          Rule alerts and AI scores work together — investigate before taking action on any account.
        </motion.p>
      ) : null}
    </AnimatedPage>
  );
}
