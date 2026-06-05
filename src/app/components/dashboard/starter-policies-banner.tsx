import { Link } from "react-router";
import { Sparkles } from "lucide-react";

export function StarterPoliciesBanner() {
  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex items-start gap-3 flex-1">
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-semibold">Your starter policies are ready</h2>
          <p className="text-sm text-muted-foreground">
            We&apos;ve added sample policies for home, auto, life, and pet. Review and edit them,
            then submit for admin approval to list them on ClearClever.
          </p>
        </div>
      </div>
      <Link
        to="/provider-dashboard/policies"
        className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 shrink-0"
      >
        Review policies
      </Link>
    </div>
  );
}
