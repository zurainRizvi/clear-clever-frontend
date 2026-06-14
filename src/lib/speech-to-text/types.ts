export type SpeechToTextStatus =
  | "idle"
  | "loading"
  | "listening"
  | "processing"
  | "unsupported"
  | "error";

export type SpeechToTextCallbacks = {
  onInterimTranscript?: (text: string) => void;
  onFinalTranscript?: (text: string) => void;
  onStatusChange?: (status: SpeechToTextStatus) => void;
  onError?: (message: string) => void;
};

export type SpeechToTextProvider = {
  id: "web-speech" | "whisper";
  isSupported: () => boolean;
  /** Preferred BCP-47 language tag when listening starts. */
  getDefaultLanguage: () => string;
  start: (callbacks: SpeechToTextCallbacks) => Promise<void>;
  stop: () => void;
  abort: () => void;
};

/** Language preference chain for Pakistani English, English, and Urdu. */
export const SPEECH_LANGUAGE_PREFERENCES = ["en-PK", "en-US", "ur-PK"] as const;

export function resolvePreferredSpeechLanguage(): string {
  if (typeof navigator === "undefined") return "en-PK";

  const languages = navigator.languages ?? [navigator.language];
  for (const pref of SPEECH_LANGUAGE_PREFERENCES) {
    if (languages.some((lang) => lang.toLowerCase().startsWith(pref.toLowerCase()))) {
      return pref;
    }
  }
  return "en-PK";
}

export function isWebSpeechSupported(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(
    (window as Window & { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
      .SpeechRecognition ??
      (window as Window & { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition,
  );
}

export function isWhisperEnabled(): boolean {
  return import.meta.env.VITE_STT_WHISPER === "1";
}
