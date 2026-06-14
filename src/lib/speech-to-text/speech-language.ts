export const SPEECH_LANGUAGE_OPTIONS = [
  { value: "en-PK", label: "English (Pakistan)" },
  { value: "ur-PK", label: "Urdu" },
  { value: "en-US", label: "English (US)" },
] as const;

export type SpeechLanguage = (typeof SPEECH_LANGUAGE_OPTIONS)[number]["value"];

const STORAGE_KEY = "clearclever:stt-language";

export function getStoredSpeechLanguage(): SpeechLanguage {
  if (typeof window === "undefined") return "en-PK";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "en-PK" || stored === "ur-PK" || stored === "en-US") {
    return stored;
  }
  return resolvePreferredSpeechLanguage();
}

export function setStoredSpeechLanguage(language: SpeechLanguage) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, language);
}

/** Pick a sensible default from browser locale before user chooses. */
export function resolvePreferredSpeechLanguage(): SpeechLanguage {
  if (typeof navigator === "undefined") return "en-PK";

  const languages = navigator.languages ?? [navigator.language];
  if (languages.some((lang) => lang.toLowerCase().startsWith("ur"))) {
    return "ur-PK";
  }
  if (languages.some((lang) => lang.toLowerCase().startsWith("en-pk"))) {
    return "en-PK";
  }
  if (languages.some((lang) => lang.toLowerCase().startsWith("en"))) {
    return "en-PK";
  }
  return "en-PK";
}

export function getSpeechLanguageLabel(language: SpeechLanguage): string {
  return SPEECH_LANGUAGE_OPTIONS.find((opt) => opt.value === language)?.label ?? language;
}
