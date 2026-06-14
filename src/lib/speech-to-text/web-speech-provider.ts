import {
  isWebSpeechSupported,
  resolvePreferredSpeechLanguage,
  type SpeechToTextCallbacks,
  type SpeechToTextProvider,
} from "./types";

type SpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function mapSpeechError(error: string): string {
  switch (error) {
    case "not-allowed":
    case "service-not-allowed":
      return "Microphone permission denied.";
    case "no-speech":
      return "No speech detected. Try again.";
    case "network":
      return "Speech recognition needs a network connection in this browser.";
    case "aborted":
      return "Speech input was cancelled.";
    default:
      return "Speech recognition failed. Try again.";
  }
}

export function createWebSpeechProvider(): SpeechToTextProvider {
  let recognition: SpeechRecognitionInstance | null = null;
  let callbacksRef: SpeechToTextCallbacks | null = null;
  let finalTranscript = "";

  const cleanup = () => {
    recognition = null;
    callbacksRef = null;
    finalTranscript = "";
  };

  return {
    id: "web-speech",
    isSupported: isWebSpeechSupported,
    getDefaultLanguage: resolvePreferredSpeechLanguage,

    async start(callbacks: SpeechToTextCallbacks) {
      const Ctor = getSpeechRecognitionConstructor();
      if (!Ctor) {
        callbacks.onError?.("Speech input is not supported in this browser.");
        callbacks.onStatusChange?.("unsupported");
        return;
      }

      callbacksRef = callbacks;
      finalTranscript = "";
      callbacks.onStatusChange?.("loading");

      recognition = new Ctor();
      recognition.lang = resolvePreferredSpeechLanguage();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const result = event.results[i];
          const text = result[0]?.transcript ?? "";
          if (result.isFinal) {
            finalTranscript = `${finalTranscript} ${text}`.trim();
          } else {
            interim = `${interim} ${text}`.trim();
          }
        }

        const combined = `${finalTranscript} ${interim}`.trim();
        if (combined) {
          callbacksRef?.onInterimTranscript?.(combined);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (event.error === "aborted") {
          callbacksRef?.onStatusChange?.("idle");
          cleanup();
          return;
        }
        callbacksRef?.onError?.(mapSpeechError(event.error));
        callbacksRef?.onStatusChange?.("error");
        cleanup();
      };

      recognition.onend = () => {
        const text = finalTranscript.trim();
        if (text) {
          callbacksRef?.onFinalTranscript?.(text);
        }
        callbacksRef?.onStatusChange?.("idle");
        cleanup();
      };

      try {
        callbacks.onStatusChange?.("listening");
        recognition.start();
      } catch {
        callbacks.onError?.("Could not start speech recognition. Try again.");
        callbacks.onStatusChange?.("error");
        cleanup();
      }
    },

    stop() {
      if (!recognition) return;
      callbacksRef?.onStatusChange?.("processing");
      try {
        recognition.stop();
      } catch {
        callbacksRef?.onStatusChange?.("idle");
        cleanup();
      }
    },

    abort() {
      if (!recognition) return;
      try {
        recognition.abort();
      } catch {
        // ignore
      }
      cleanup();
      callbacksRef?.onStatusChange?.("idle");
    },
  };
}
