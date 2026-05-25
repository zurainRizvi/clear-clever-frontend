import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Link, useSearchParams } from "react-router";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import {
  fetchFraudSignals,
  type FraudCategory,
  type FraudSignal,
} from "@/lib/admin-api";

const TABS: { id: FraudCategory; label: string; description: string }[] = [
  {
    id: "account",
    label: "Account risk",
    description: "Duplicate emails, unverified providers, deactivation spikes",
  },
  {
    id: "claims",
    label: "Claims",
    description: "Unusual claim frequency and rejection patterns",
  },
  {
    id: "commerce",
    label: "Commerce",
    description: "Pending purchases and abnormal lead volume",
  },
  {
    id: "catalog",
    label: "Provider catalog",
    description: "Stale policy reviews and high rejection rates",
  },
];

function severityClass(severity: FraudSignal["severity"]) {
  if (severity === "critical") return "bg-destructive text-destructive-foreground";
  if (severity === "high") return "bg-warning text-warning-foreground";
  if (severity === "medium") return "bg-primary/15 text-primary";
  return "bg-muted text-muted-foreground";
}

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
  const [loading, setLoading] = useState(true);
  const scrolledFocusRef = useRef<string | null>(null);

  const setTab = (next: FraudCategory) => {
    scrolledFocusRef.current = null;
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
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not load fraud signals");
      setSignals([]);
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
          Highlight →
        </button>
      );
    }

    return (
      <Link
        to={alert.link}
        className="text-sm text-primary hover:underline shrink-0 font-medium"
      >
        Review →
      </Link>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Fraud detection</h1>
        <p className="text-muted-foreground">
          Live heuristics from your ClearClever database — suspicious patterns by category
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium ${
              tab === item.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">{activeMeta?.description}</p>

      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : signals.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>No signals in this category right now.</p>
          </div>
        ) : (
          signals.map((alert) => {
            const isFocused = focusId === alert.id;
            return (
              <div
                key={alert.id}
                id={`fraud-signal-${alert.id}`}
                className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-accent/30 rounded-xl border-l-4 border-warning transition-shadow ${
                  isFocused ? "ring-2 ring-primary shadow-md" : ""
                }`}
              >
                <div className="flex-1">
                  <div className="font-semibold mb-1 flex flex-wrap items-center gap-2">
                    {alert.type}
                    <span
                      className={`px-2 py-0.5 rounded text-xs capitalize ${severityClass(alert.severity)}`}
                    >
                      {alert.severity}
                    </span>
                  </div>
                  <div className="text-sm font-medium">{alert.subject}</div>
                  <div className="text-sm text-muted-foreground mt-1">{alert.detail}</div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {new Date(alert.detectedAt).toLocaleString()}
                  </div>
                </div>
                {renderReviewAction(alert)}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
