import { Loader2, Mic, Square } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { cn } from "./utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";
import { useSpeechToText } from "./use-speech-to-text";

type SpeechInputButtonProps = {
  onTranscript: (text: string) => void;
  disabled?: boolean;
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

export function SpeechInputButton({
  onTranscript,
  disabled = false,
  className,
  size = "default",
}: SpeechInputButtonProps) {
  const {
    status,
    isSupported,
    errorMessage,
    activeLanguage,
    statusLabel,
    toggleListening,
  } = useSpeechToText({ onTranscript, disabled });

  useEffect(() => {
    if (status !== "error" || !errorMessage) return;
    toast.error(errorMessage);
  }, [errorMessage, status]);

  const isListening = status === "listening";
  const isBusy = status === "loading" || status === "processing";
  const isDisabled = disabled || !isSupported || status === "unsupported";

  const tooltipText =
    status === "unsupported" || !isSupported
      ? "Speech input is not supported in this browser."
      : activeLanguage && isListening
        ? `${statusLabel} (${activeLanguage})`
        : statusLabel;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={() => {
            if (isDisabled) return;
            toggleListening();
          }}
          disabled={isDisabled}
          aria-label={isListening ? "Stop speech input" : "Start speech input"}
          aria-pressed={isListening}
          className={cn(
            "flex shrink-0 items-center justify-center rounded-xl border border-border bg-card text-primary hover:bg-accent disabled:opacity-50",
            isListening && "border-destructive/50 bg-destructive/10 text-destructive",
            sizeClasses[size],
            className,
          )}
        >
          {isBusy ? (
            <Loader2 className={cn(iconClasses[size], "animate-spin")} />
          ) : isListening ? (
            <Square className={iconClasses[size]} />
          ) : (
            <Mic className={iconClasses[size]} />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">{tooltipText}</TooltipContent>
    </Tooltip>
  );
}
