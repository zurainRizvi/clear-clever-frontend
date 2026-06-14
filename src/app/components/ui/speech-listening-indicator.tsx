import type { ReactNode } from "react";
import { cn } from "./utils";

export function SpeechWaveBars({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-[3px] h-3.5", className)} aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-[3px] rounded-full bg-primary/70 speech-wave-bar-pro"
          style={{ animationDelay: `${i * 0.18}s` }}
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
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-primary/15 bg-primary/[0.04] px-3 py-2.5 text-sm text-foreground",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <SpeechWaveBars />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground">Voice input active</p>
        <p className="truncate text-xs text-muted-foreground">
          {interimPreview
            ? interimPreview
            : `Speak in ${languageLabel ?? "your selected language"}, then tap stop`}
        </p>
      </div>
      {languageControl ? <div className="shrink-0">{languageControl}</div> : null}
    </div>
  );
}
