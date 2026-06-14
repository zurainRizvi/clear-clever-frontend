import {
  getStoredSpeechLanguage,
  resolvePreferredSpeechLanguage,
} from "./speech-language";
import {
  isWebSpeechSupported,
  type SpeechToTextCallbacks,
  type SpeechToTextProvider,
  type SpeechToTextStartOptions,
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

const MIN_INTERIM_CONFIDENCE = 0.35;

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

function getResultText(result: SpeechRecognitionResult): string {
  return result[0]?.transcript?.trim() ?? "";
}

function getResultConfidence(result: SpeechRecognitionResult): number {
  const confidence = result[0]?.confidence;
  return typeof confidence === "number" && confidence > 0 ? confidence : 1;
}

export function createWebSpeechProvider(): SpeechToTextProvider {
  let recognition: SpeechRecognitionInstance | null = null;
  let callbacksRef: SpeechToTextCallbacks | null = null;
  let finalTranscript = "";
  let keepListening = false;
  let activeLanguage = getStoredSpeechLanguage();

  const cleanup = () => {
    recognition = null;
    callbacksRef = null;
    finalTranscript = "";
    keepListening = false;
  };

  const finalizeSession = () => {
    keepListening = false;
    const text = finalTranscript.trim();
    if (text) {
      callbacksRef?.onFinalTranscript?.(text);
    }
    callbacksRef?.onStatusChange?.("idle");
    cleanup();
  };

  return {
    id: "web-speech",
    isSupported: isWebSpeechSupported,
    getDefaultLanguage: () => getStoredSpeechLanguage() ?? resolvePreferredSpeechLanguage(),

    async start(callbacks: SpeechToTextCallbacks, options?: SpeechToTextStartOptions) {
      const Ctor = getSpeechRecognitionConstructor();
      if (!Ctor) {
        callbacks.onError?.("Speech input is not supported in this browser.");
        callbacks.onStatusChange?.("unsupported");
        return;
      }

      callbacksRef = callbacks;
      finalTranscript = "";
      keepListening = true;
      activeLanguage = options?.language ?? getStoredSpeechLanguage();
      callbacks.onStatusChange?.("loading");

      const attachHandlers = (instance: SpeechRecognitionInstance) => {
        instance.onresult = (event: SpeechRecognitionEvent) => {
          let interim = "";
          for (let i = event.resultIndex; i < event.results.length; i += 1) {
            const result = event.results[i];
            const text = getResultText(result);
            if (!text) continue;

            if (result.isFinal) {
              finalTranscript = `${finalTranscript} ${text}`.trim();
              continue;
            }

            const confidence = getResultConfidence(result);
            if (confidence >= MIN_INTERIM_CONFIDENCE) {
              interim = `${interim} ${text}`.trim();
            }
          }

          const preview = `${finalTranscript} ${interim}`.trim();
          if (preview) {
            callbacksRef?.onInterimTranscript?.(preview);
          }
        };

        instance.onerror = (event: SpeechRecognitionErrorEvent) => {
          keepListening = false;
          if (event.error === "aborted") {
            callbacksRef?.onStatusChange?.("idle");
            cleanup();
            return;
          }
          if (event.error === "no-speech") {
            finalizeSession();
            return;
          }
          callbacksRef?.onError?.(mapSpeechError(event.error));
          callbacksRef?.onStatusChange?.("error");
          cleanup();
        };

        instance.onend = () => {
          finalizeSession();
        };
      };

      recognition = new Ctor();
      recognition.lang = activeLanguage;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      attachHandlers(recognition);

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
      keepListening = false;
      callbacksRef?.onStatusChange?.("processing");
      try {
        recognition.stop();
      } catch {
        finalizeSession();
      }
    },

    abort() {
      keepListening = false;
      if (!recognition) {
        cleanup();
        callbacksRef?.onStatusChange?.("idle");
        return;
      }
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
