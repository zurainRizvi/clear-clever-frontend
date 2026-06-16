import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { playMicStartTone, playMicStopTone } from "@/lib/speech-to-text/speech-feedback";
import {
  getSpeechLanguageLabel,
  getStoredSpeechLanguage,
  setStoredSpeechLanguage,
  type SpeechLanguage,
} from "@/lib/speech-to-text/speech-language";
import { resolveSpeechToTextProvider } from "@/lib/speech-to-text/resolve-provider";
import type { SpeechToTextStatus } from "@/lib/speech-to-text/types";

type UseSpeechToTextOptions = {
  /** Called once when the user stops listening with the final transcript segment. */
  onTranscript: (text: string) => void;
  disabled?: boolean;
};

export function useSpeechToText({ onTranscript, disabled = false }: UseSpeechToTextOptions) {
  const providerRef = useRef(resolveSpeechToTextProvider());
  const onTranscriptRef = useRef(onTranscript);
  const [status, setStatus] = useState<SpeechToTextStatus>(() =>
    providerRef.current ? "idle" : "unsupported",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [interimPreview, setInterimPreview] = useState<string | null>(null);
  const [language, setLanguage] = useState<SpeechLanguage>(() => getStoredSpeechLanguage());
  const prevStatusRef = useRef<SpeechToTextStatus>("idle");

  onTranscriptRef.current = onTranscript;

  const isSupported = providerRef.current?.isSupported() ?? false;

  useEffect(() => {
    return () => {
      providerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    const prev = prevStatusRef.current;
    if (prev !== "listening" && status === "listening") {
      playMicStartTone();
    }
    if (prev === "listening" && (status === "idle" || status === "processing" || status === "error")) {
      playMicStopTone();
    }
    prevStatusRef.current = status;
  }, [status]);

  const handleError = useCallback((message: string) => {
    setErrorMessage(message);
    setInterimPreview(null);
    setStatus("error");
  }, []);

  const startListening = useCallback(async () => {
    const provider = providerRef.current;
    if (!provider || disabled) return;

    setErrorMessage(null);
    setInterimPreview(null);

    await provider.start(
      {
        onStatusChange: setStatus,
        onInterimTranscript: (text) => {
          setInterimPreview(text.trim() ? text.trim() : null);
        },
        onFinalTranscript: (text) => {
          const trimmed = text.trim();
          setInterimPreview(null);
          if (trimmed) {
            onTranscriptRef.current(trimmed);
          }
        },
        onError: handleError,
      },
      { language },
    );
  }, [disabled, handleError, language]);

  const stopListening = useCallback(() => {
    providerRef.current?.stop();
  }, []);

  const toggleListening = useCallback(() => {
    if (status === "listening") {
      stopListening();
      return;
    }
    if (status === "idle" || status === "error") {
      void startListening();
    }
  }, [startListening, status, stopListening]);

  const setSpeechLanguage = useCallback((next: SpeechLanguage) => {
    setStoredSpeechLanguage(next);
    setLanguage(next);
  }, []);

  const statusLabel = useMemo(() => {
    switch (status) {
      case "loading":
        return "Starting microphone…";
      case "listening":
        return "Listening… Click stop when finished.";
      case "processing":
        return "Finishing transcript…";
      case "unsupported":
        return "Speech input is not supported in this browser.";
      case "error":
        return errorMessage ?? "Speech recognition failed.";
      default:
        return `Speak in ${getSpeechLanguageLabel(language)}`;
    }
  }, [errorMessage, language, status]);

  const isListening = status === "listening";

  return {
    status,
    isSupported,
    isListening,
    disabled,
    errorMessage,
    interimPreview,
    language,
    languageLabel: getSpeechLanguageLabel(language),
    statusLabel,
    setSpeechLanguage,
    startListening,
    stopListening,
    toggleListening,
  };
}
