import { Globe, Loader2, Mic, Square } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import {
  SPEECH_LANGUAGE_OPTIONS,
  getSpeechLanguageLabel,
  type SpeechLanguage,
} from "@/lib/speech-to-text/speech-language";
import { useSpeechInputContext } from "./speech-input-context";
import { SpeechListeningBar } from "./speech-listening-indicator";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";
import { cn } from "./utils";

export function SpeechListeningBanner({ className }: { className?: string }) {
  const { isListening, interimPreview, languageLabel } = useSpeechInputContext();
  if (!isListening) return null;
  return (
    <SpeechListeningBar
      className={className}
      interimPreview={interimPreview}
      languageLabel={languageLabel}
      languageControl={<SpeechLanguagePicker variant="inline" />}
    />
  );
}

function SpeechLanguagePicker({ variant = "inline" }: { variant?: "inline" | "footer" }) {
  const { language, isListening, setSpeechLanguage, isSupported, status, disabled } =
    useSpeechInputContext();
  const isDisabled = disabled || !isSupported || status === "unsupported" || isListening;

  const triggerClass =
    variant === "footer"
      ? "inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
      : "inline-flex items-center gap-1 rounded-md border border-border/70 bg-background px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" disabled={isDisabled} className={triggerClass} aria-label="Voice language">
          {variant === "footer" ? <Globe className="h-3.5 w-3.5" /> : null}
          <span>{getSpeechLanguageLabel(language)}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-52 p-1">
        <p className="px-2 py-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Voice language
        </p>
        {SPEECH_LANGUAGE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={isListening}
            onClick={() => setSpeechLanguage(option.value as SpeechLanguage)}
            className={cn(
              "w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent",
              language === option.value && "bg-accent font-medium text-foreground",
            )}
          >
            {option.label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

export function SpeechVoiceLanguageLink() {
  const { isSupported, status } = useSpeechInputContext();
  if (!isSupported || status === "unsupported") return null;

  return (
    <div className="flex items-center justify-end px-1">
      <SpeechLanguagePicker variant="footer" />
    </div>
  );
}

type SpeechMicButtonProps = {
  className?: string;
  size?: "default" | "sm";
};

const sizeClasses = {
  default: "h-11 w-11",
  sm: "h-10 w-10",
} as const;

const iconClasses = {
  default: "h-5 w-5",
  sm: "h-4 w-4",
} as const;

export function SpeechMicButton({ className, size = "default" }: SpeechMicButtonProps) {
  const {
    status,
    isSupported,
    isListening,
    disabled,
    errorMessage,
    interimPreview,
    statusLabel,
    toggleListening,
  } = useSpeechInputContext();

  useEffect(() => {
    if (status !== "error" || !errorMessage) return;
    toast.error(errorMessage);
  }, [errorMessage, status]);

  const isBusy = status === "loading" || status === "processing";
  const isDisabled = disabled || !isSupported || status === "unsupported";

  const tooltipText =
    !isSupported || status === "unsupported"
      ? "Speech input is not supported in this browser."
      : isListening && interimPreview
        ? `${statusLabel} — "${interimPreview}"`
        : statusLabel;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={() => {
            if (isDisabled || status === "loading" || status === "processing") return;
            toggleListening();
          }}
          disabled={isDisabled}
          aria-label={isListening ? "Stop voice input" : "Start voice input"}
          aria-pressed={isListening}
          className={cn(
            "relative flex shrink-0 items-center justify-center rounded-xl border border-border bg-card text-primary hover:bg-accent disabled:opacity-50 transition-colors",
            isListening && "border-primary/40 bg-primary/10 text-primary ring-2 ring-primary/20",
            sizeClasses[size],
            className,
          )}
        >
          {isListening ? (
            <span
              className="absolute inset-1 rounded-lg bg-primary/10 speech-mic-glow"
              aria-hidden
            />
          ) : null}
          {isBusy ? (
            <Loader2 className={cn(iconClasses[size], "animate-spin relative z-10")} />
          ) : isListening ? (
            <Square className={cn(iconClasses[size], "relative z-10 h-4 w-4 fill-current")} />
          ) : (
            <Mic className={cn(iconClasses[size], "relative z-10")} />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">{tooltipText}</TooltipContent>
    </Tooltip>
  );
}

/** Convenience wrapper when a single mic button is enough (messages panels). */
export function SpeechInputButton({
  onTranscript,
  disabled = false,
  className,
  size = "default",
}: {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  className?: string;
  size?: "default" | "sm";
}) {
  return (
    <SpeechInputProvider onTranscript={onTranscript} disabled={disabled}>
      <SpeechListeningBanner className={className} />
      <div className="flex items-center gap-2">
        <SpeechMicButton className={className} size={size} />
        <SpeechVoiceLanguageLink />
      </div>
    </SpeechInputProvider>
  );
}

export { SpeechInputProvider } from "./speech-input-context";
