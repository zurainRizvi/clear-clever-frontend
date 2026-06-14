import { createContext, useContext, type ReactNode } from "react";
import { useSpeechToText } from "./use-speech-to-text";

type SpeechInputContextValue = ReturnType<typeof useSpeechToText>;

const SpeechInputContext = createContext<SpeechInputContextValue | null>(null);

export function useSpeechInputContext() {
  const ctx = useContext(SpeechInputContext);
  if (!ctx) {
    throw new Error("Speech mic components must be used within SpeechInputProvider");
  }
  return ctx;
}

type SpeechInputProviderProps = {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  children: ReactNode;
};

export function SpeechInputProvider({ onTranscript, disabled, children }: SpeechInputProviderProps) {
  const speech = useSpeechToText({ onTranscript, disabled });
  return (
    <SpeechInputContext.Provider value={speech}>
      <div className="flex flex-col gap-2">{children}</div>
    </SpeechInputContext.Provider>
  );
}
