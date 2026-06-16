import { useSpeechInputContext } from "./speech-input-context";
import { cn } from "./utils";
import type { KeyboardEvent } from "react";

type SpeechLiveTextareaProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  onKeyDown?: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
};

export function SpeechLiveTextarea({
  value,
  onChange,
  className,
  disabled,
  placeholder,
  rows = 1,
  maxLength,
  onKeyDown,
}: SpeechLiveTextareaProps) {
  const { isListening, interimPreview } = useSpeechInputContext();

  const liveSuffix =
    isListening && interimPreview
      ? interimPreview.startsWith(value.trim())
        ? interimPreview.slice(value.trim().length).trimStart()
        : interimPreview
      : "";

  const displayValue =
    isListening && liveSuffix
      ? value.trim()
        ? `${value.trim()} ${liveSuffix}`
        : liveSuffix
      : value;

  return (
    <textarea
      value={displayValue}
      onChange={(event) => {
        const next = event.target.value;
        if (isListening && liveSuffix && next.endsWith(liveSuffix)) {
          onChange(next.slice(0, next.length - liveSuffix.length).trimEnd());
          return;
        }
        if (isListening && liveSuffix && value.trim() && next.startsWith(value.trim())) {
          onChange(next.slice(0, value.trim().length).trimEnd());
          return;
        }
        onChange(next);
      }}
      disabled={disabled}
      placeholder={placeholder}
      rows={rows}
      maxLength={maxLength}
      onKeyDown={onKeyDown}
      className={cn(
        className,
        isListening && liveSuffix && "ring-1 ring-primary/25 bg-primary/[0.03]"
      )}
      aria-live={isListening ? "polite" : undefined}
    />
  );
}
