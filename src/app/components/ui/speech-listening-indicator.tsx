import { cn } from "./utils";

export function SpeechWaveBars({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-end gap-0.5 h-4", className)} aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="w-0.5 rounded-full bg-current speech-wave-bar"
          style={{ animationDelay: `${i * 0.12}s` }}
        />
      ))}
    </span>
  );
}

type SpeechListeningBarProps = {
  interimPreview?: string | null;
  languageLabel?: string;
  className?: string;
};

export function SpeechListeningBar({
  interimPreview,
  languageLabel,
  className,
}: SpeechListeningBarProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive animate-in fade-in slide-in-from-bottom-1 duration-200",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <SpeechWaveBars />
      <span className="font-medium shrink-0">Listening…</span>
      {languageLabel ? (
        <span className="text-xs text-destructive/70 shrink-0">({languageLabel})</span>
      ) : null}
      {interimPreview ? (
        <span className="truncate text-destructive/80 italic">&ldquo;{interimPreview}&rdquo;</span>
      ) : (
        <span className="truncate text-destructive/60">Speak clearly, then click stop when done</span>
      )}
    </div>
  );
}
