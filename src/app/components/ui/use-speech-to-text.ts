import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { resolveSpeechToTextProvider } from "@/lib/speech-to-text/resolve-provider";
import type { SpeechToTextStatus } from "@/lib/speech-to-text/types";

type UseSpeechToTextOptions = {
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
  const [activeLanguage, setActiveLanguage] = useState<string | null>(null);

  onTranscriptRef.current = onTranscript;

  const isSupported = providerRef.current?.isSupported() ?? false;

  useEffect(() => {
    return () => {
      providerRef.current?.abort();
    };
  }, []);

  const handleError = useCallback((message: string) => {
    setErrorMessage(message);
    setStatus("error");
  }, []);

  const startListening = useCallback(async () => {
    const provider = providerRef.current;
    if (!provider || disabled) return;

    setErrorMessage(null);
    setActiveLanguage(provider.getDefaultLanguage());

    await provider.start({
      onStatusChange: setStatus,
      onInterimTranscript: (text) => {
        onTranscriptRef.current(text);
      },
      onFinalTranscript: (text) => {
        onTranscriptRef.current(text);
      },
      onError: handleError,
    });
  }, [disabled, handleError]);

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

  const statusLabel = useMemo(() => {
    switch (status) {
      case "loading":
        return "Loading speech engine…";
      case "listening":
        return "Listening… Click to stop.";
      case "processing":
        return "Processing speech…";
      case "unsupported":
        return "Speech input is not supported in this browser.";
      case "error":
        return errorMessage ?? "Speech recognition failed.";
      default:
        return "Speak your message";
    }
  }, [errorMessage, status]);

  return {
    status,
    isSupported,
    errorMessage,
    activeLanguage,
    statusLabel,
    startListening,
    stopListening,
    toggleListening,
  };
}
