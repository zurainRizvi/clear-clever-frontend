import type { ReactNode } from "react";
import { Mic } from "lucide-react";
import { cn } from "./utils";

export function SpeechWaveBars({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-[3px] h-4", className)} aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="w-[3px] rounded-full bg-primary speech-wave-bar-pro"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}

type SpeechListeningBarProps = {
  interimPreview?: string | null;
  languageLabel?: string;
  languageControl?: ReactNode;
  className?: string;
};

export function SpeechListeningBar({
  interimPreview,
  languageLabel,
  languageControl,
  className,
}: SpeechListeningBarProps) {
  const hasWords = Boolean(interimPreview?.trim());

  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-3 text-sm shadow-sm",
        hasWords
          ? "border-primary/25 bg-primary/[0.06] dark:bg-primary/[0.12]"
          : "border-border bg-muted/40 dark:bg-muted/20",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
            hasWords ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
          )}
        >
          {hasWords ? <SpeechWaveBars className="h-3.5" /> : <Mic className="h-4 w-4" aria-hidden />}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            {hasWords ? "Hearing you…" : "Listening…"}
          </p>
          {hasWords ? (
            <p className="text-[15px] font-medium leading-snug text-foreground break-words">
              {interimPreview}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground leading-relaxed">
              Speak in {languageLabel ?? "your selected language"}. Your words appear here as you talk.
            </p>
          )}
        </div>
        {languageControl ? <div className="shrink-0">{languageControl}</div> : null}
      </div>
    </div>
  );
}
