import { useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Clock3, LogOut, Shield } from "lucide-react";
import { motion } from "motion/react";
import { BackToHomeLink } from "./back-to-home";
import { DarkModeToggle } from "../dark-mode-toggle";
import { useAuth, useLogout } from "../auth-context";
import { routeForInsurer } from "@/lib/auth-api";

export function ProviderPending() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const handleLogout = useLogout();

  useEffect(() => {
    if (!user) return;
    const target = routeForInsurer(user);
    if (target !== "/provider-pending") {
      navigate(target, { replace: true });
    }
  }, [navigate, user]);

  useEffect(() => {
    const refreshOnFocus = () => {
      void refreshUser();
    };
    window.addEventListener("focus", refreshOnFocus);
    return () => window.removeEventListener("focus", refreshOnFocus);
  }, [refreshUser]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void refreshUser();
    }, 30000);
    return () => window.clearInterval(interval);
  }, [refreshUser]);

  if (!user || routeForInsurer(user) !== "/provider-pending") {
    return null;
  }

  const onboarding = user.insurerOnboarding;

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background relative">
      <div className="absolute top-6 left-6">
        <BackToHomeLink />
      </div>
      <div className="absolute top-6 right-6 flex items-center gap-3">
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
        <DarkModeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg text-center"
      >
        <Link to="/" className="inline-flex items-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl font-[Poppins]">ClearClever</span>
        </Link>

        <div className="w-16 h-16 rounded-2xl bg-warning/10 text-warning flex items-center justify-center mx-auto mb-5">
          <Clock3 className="w-8 h-8" />
        </div>

        <h1 className="text-3xl font-bold mb-3">Application under review</h1>
        <p className="text-muted-foreground mb-8">
          Your provider application has been submitted. A Super Admin will review your company
          details and starter policies. You&apos;ll be notified when your portal is approved.
        </p>

        <div className="bg-card border border-border rounded-2xl p-6 text-left space-y-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Company</div>
            <div className="font-semibold text-lg">{onboarding?.companyName ?? "—"}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Portal slug</div>
            <div className="font-mono text-sm">{onboarding?.slug ?? "—"}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Contact email</div>
            <div className="text-sm">{user.email}</div>
          </div>
          <div className="rounded-xl bg-accent/40 px-4 py-3 text-sm text-muted-foreground">
            Four sample policies (home, auto, life, pet) are ready as drafts. After approval, sign
            in to review and customize them before submitting for public listing.
          </div>
        </div>
      </motion.div>
    </div>
  );
}
