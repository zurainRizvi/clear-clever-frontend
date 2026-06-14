import { isWhisperEnabled, type SpeechToTextProvider } from "./types";

/**
 * Future in-browser Whisper via @xenova/transformers.
 *
 * Planned approach (not implemented yet):
 * 1. dynamic import('@xenova/transformers') on first mic click
 * 2. MediaRecorder captures audio while listening
 * 3. whisper-tiny multilingual model transcribes the blob
 * 4. Enable with VITE_STT_WHISPER=1 or as fallback when Web Speech fails
 */
export function createWhisperProvider(): SpeechToTextProvider {
  return {
    id: "whisper",
    isSupported: () => isWhisperEnabled() && typeof window !== "undefined",
    getDefaultLanguage: () => "en-PK",

    async start() {
      throw new Error(
        "Whisper STT is not implemented yet. Set VITE_STT_WHISPER=1 only after adding @xenova/transformers.",
      );
    },

    stop() {
      // no-op until implemented
    },

    abort() {
      // no-op until implemented
    },
  };
}
