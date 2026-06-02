import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type AssistantWidgetContextValue = {
  isOpen: boolean;
  category: string | null;
  presetReply: string | null;
  presetUserMessage: string | null;
  setAssistantCategory: (category: string | null) => void;
  openAssistant: (options?: {
    category?: string;
    presetReply?: string;
    presetUserMessage?: string;
  }) => void;
  closeAssistant: () => void;
  toggleAssistant: () => void;
  clearPreset: () => void;
};

const AssistantWidgetContext = createContext<AssistantWidgetContextValue | null>(null);

export function AssistantWidgetProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState<string | null>(null);
  const [presetReply, setPresetReply] = useState<string | null>(null);
  const [presetUserMessage, setPresetUserMessage] = useState<string | null>(null);

  const setAssistantCategory = useCallback((next: string | null) => {
    setCategory(next);
  }, []);

  const openAssistant = useCallback(
    (options?: { category?: string; presetReply?: string; presetUserMessage?: string }) => {
      if (options?.category) {
        setCategory(options.category);
      }
      if (options?.presetReply) {
        setPresetReply(options.presetReply);
      }
      if (options?.presetUserMessage) {
        setPresetUserMessage(options.presetUserMessage);
      }
      setIsOpen(true);
    },
    []
  );

  const closeAssistant = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleAssistant = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const clearPreset = useCallback(() => {
    setPresetReply(null);
    setPresetUserMessage(null);
  }, []);

  const value = useMemo(
    () => ({
      isOpen,
      category,
      presetReply,
      presetUserMessage,
      setAssistantCategory,
      openAssistant,
      closeAssistant,
      toggleAssistant,
      clearPreset,
    }),
    [
      isOpen,
      category,
      presetReply,
      presetUserMessage,
      setAssistantCategory,
      openAssistant,
      closeAssistant,
      toggleAssistant,
      clearPreset,
    ]
  );

  return (
    <AssistantWidgetContext.Provider value={value}>{children}</AssistantWidgetContext.Provider>
  );
}

export function useAssistantWidget(): AssistantWidgetContextValue {
  const ctx = useContext(AssistantWidgetContext);
  if (!ctx) {
    throw new Error("useAssistantWidget must be used within AssistantWidgetProvider");
  }
  return ctx;
}
