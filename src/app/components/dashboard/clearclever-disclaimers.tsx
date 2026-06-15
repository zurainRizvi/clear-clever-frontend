import { FileText, ShieldCheck } from "lucide-react";

export function ClearCleverDisclaimers({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`rounded-2xl border border-border bg-muted/20 dark:bg-muted/10 space-y-4 ${
        compact ? "p-4" : "p-5 sm:p-6"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Disclaimers
      </p>

      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 text-primary" aria-hidden />
          </div>
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-semibold text-foreground">Trusted agency</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              ClearClever is an authorized agency of the listed insurance companies. You can verify
              the policy number generated upon issuance directly with the insurance company of your
              choice.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-primary" aria-hidden />
          </div>
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-semibold text-foreground">Policy issuance</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your policy will be issued directly by the insurance company of your choice.
              ClearClever acts as an independent guiding and purchasing platform. All claims
              procedures would be handled by the insurance company directly. You will be emailed
              the documentation of your policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
