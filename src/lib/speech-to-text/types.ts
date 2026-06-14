export type SpeechToTextStatus =
  | "idle"
  | "loading"
  | "listening"
  | "processing"
  | "unsupported"
  | "error";

export type SpeechToTextStartOptions = {
  language?: string;
};

export type SpeechToTextCallbacks = {
  onInterimTranscript?: (text: string) => void;
  onFinalTranscript?: (text: string) => void;
  onStatusChange?: (status: SpeechToTextStatus) => void;
  onError?: (message: string) => void;
};

export type SpeechToTextProvider = {
  id: "web-speech" | "whisper";
  isSupported: () => boolean;
  getDefaultLanguage: () => string;
  start: (callbacks: SpeechToTextCallbacks, options?: SpeechToTextStartOptions) => Promise<void>;
  stop: () => void;
  abort: () => void;
};

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
