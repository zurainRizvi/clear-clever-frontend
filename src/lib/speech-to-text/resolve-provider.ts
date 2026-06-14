import { createWebSpeechProvider } from "./web-speech-provider";
import { createWhisperProvider } from "./whisper-provider";
import { isWebSpeechSupported, isWhisperEnabled, type SpeechToTextProvider } from "./types";

export function resolveSpeechToTextProvider(): SpeechToTextProvider | null {
  if (isWebSpeechSupported()) {
    return createWebSpeechProvider();
  }

  if (isWhisperEnabled()) {
    const whisper = createWhisperProvider();
    if (whisper.isSupported()) {
      return whisper;
    }
  }

  return null;
}
