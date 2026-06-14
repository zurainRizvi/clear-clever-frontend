import { ChevronDown, Loader2, Mic, Square } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import {
  SPEECH_LANGUAGE_OPTIONS,
  type SpeechLanguage,
} from "@/lib/speech-to-text/speech-language";
import { useSpeechInputContext } from "./speech-input-context";
import { SpeechListeningBar, SpeechWaveBars } from "./speech-listening-indicator";
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
    />
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

export function SpeechLanguagePicker({ size = "default" }: { size?: "default" | "sm" }) {
  const { language, isListening, setSpeechLanguage, isSupported, status, disabled } =
    useSpeechInputContext();
  const isDisabled = disabled || !isSupported || status === "unsupported" || isListening;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={isDisabled}
          className={cn(
            "flex shrink-0 items-center gap-0.5 rounded-lg px-1.5 text-[10px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50",
            size === "sm" ? "h-8" : "h-9",
          )}
          aria-label="Speech language"
          title="Speech language"
        >
          <span>{language.split("-")[0].toUpperCase()}</span>
          <ChevronDown className="h-3 w-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-48 p-1">
        {SPEECH_LANGUAGE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={isListening}
            onClick={() => setSpeechLanguage(option.value as SpeechLanguage)}
            className={cn(
              "w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent",
              language === option.value && "bg-accent font-medium",
            )}
          >
            {option.label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

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
    <div className="flex items-center gap-1">
      <SpeechLanguagePicker size={size} />
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => {
              if (isDisabled || status === "loading" || status === "processing") return;
              toggleListening();
            }}
            disabled={isDisabled}
            aria-label={isListening ? "Stop speech input" : "Start speech input"}
            aria-pressed={isListening}
            className={cn(
              "relative flex shrink-0 items-center justify-center rounded-xl border border-border bg-card text-primary hover:bg-accent disabled:opacity-50",
              isListening && "border-destructive/60 bg-destructive/10 text-destructive shadow-[0_0_0_4px_rgba(239,68,68,0.12)]",
              sizeClasses[size],
              className,
            )}
          >
            {isListening ? (
              <span
                className="absolute inset-0 rounded-xl border-2 border-destructive/40 animate-ping"
                aria-hidden
              />
            ) : null}
            {isBusy ? (
              <Loader2 className={cn(iconClasses[size], "animate-spin relative z-10")} />
            ) : isListening ? (
              <span className="relative z-10 flex items-center gap-1">
                <SpeechWaveBars className="text-destructive" />
                <Square className={cn(iconClasses[size], "h-3.5 w-3.5")} />
              </span>
            ) : (
              <Mic className={cn(iconClasses[size], "relative z-10")} />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">{tooltipText}</TooltipContent>
      </Tooltip>
    </div>
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
      <SpeechMicButton className={className} size={size} />
    </SpeechInputProvider>
  );
}

export { SpeechInputProvider } from "./speech-input-context";
