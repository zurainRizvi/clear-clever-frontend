import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../auth-context";
import { ApiError } from "@/lib/api";
import {
  explainRecommendation,
  getAssistantStatus,
  sendAssistantChat,
  type AssistantHistoryTurn,
} from "@/lib/assistant-api";
import { useAssistantWidget } from "./assistant-widget-context";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export function AssistantWidget() {
  const { user, isAuthenticated } = useAuth();
  const {
    isOpen,
    category,
    presetReply,
    presetUserMessage,
    closeAssistant,
    toggleAssistant,
    clearPreset,
  } = useAssistantWidget();

  const [configured, setConfigured] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [explaining, setExplaining] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getAssistantStatus()
      .then((status) => setConfigured(status.configured))
      .catch(() => setConfigured(false));
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const toHistory = useCallback((): AssistantHistoryTurn[] => {
    return messages.slice(-10).map((m) => ({
      role: m.role === "user" ? "user" : "model",
      content: m.content,
    }));
  }, [messages]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || sending) return;

      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        content: trimmed,
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setSending(true);

      try {
        const result = await sendAssistantChat({
          message: trimmed,
          history: toHistory(),
          category: category ?? undefined,
          auth: isAuthenticated,
        });
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            content: result.reply,
          },
        ]);
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Assistant could not reply");
      } finally {
        setSending(false);
      }
    },
    [sending, toHistory, category, isAuthenticated]
  );

  useEffect(() => {
    if (!isOpen || !presetReply) return;
    const next: ChatMessage[] = [];
    if (presetUserMessage) {
      next.push({
        id: `u-preset-${Date.now()}`,
        role: "user",
        content: presetUserMessage,
      });
    }
    next.push({
      id: `a-preset-${Date.now()}`,
      role: "assistant",
      content: presetReply,
    });
    setMessages(next);
    clearPreset();
  }, [isOpen, presetReply, presetUserMessage, clearPreset]);

  const handleExplainTop = async () => {
    if (!category || !isAuthenticated || user?.role !== "user") {
      toast.message("Sign in as a policy seeker to get personalized explanations");
      return;
    }
    setExplaining(true);
    try {
      const result = await explainRecommendation({ category });
      setMessages((prev) => [
        ...prev,
        {
          id: `u-${Date.now()}`,
          role: "user",
          content: `Explain why ${result.policyName} is recommended for me.`,
        },
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: result.reply,
        },
      ]);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not explain recommendation");
    } finally {
      setExplaining(false);
    }
  };

  if (configured === false) {
    return null;
  }

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          onClick={toggleAssistant}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
          aria-label="Open AI assistant"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="font-semibold text-sm hidden sm:inline">AI Assistant</span>
        </button>
      )}

      {isOpen && (
        <div
          className="fixed bottom-6 right-6 z-50 flex w-[min(100vw-2rem,400px)] flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
          role="dialog"
          aria-label="ClearClever AI Assistant"
        >
          <header className="flex items-center justify-between gap-2 border-b border-border bg-primary px-4 py-3 text-primary-foreground">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <div>
                <p className="font-semibold text-sm">ClearClever Assistant</p>
                <p className="text-xs opacity-90">
                  {configured === null ? "Checking…" : "Powered by Gemini"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={closeAssistant}
              className="rounded-lg p-1.5 hover:bg-primary-foreground/10"
              aria-label="Close assistant"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          {!isAuthenticated && (
            <p className="text-xs bg-muted/50 text-muted-foreground px-4 py-2 border-b border-border">
              Sign in for personalized recommendations based on your questionnaire and policies.
            </p>
          )}

          {isAuthenticated && user?.role === "user" && category && (
            <div className="px-4 py-2 border-b border-border">
              <button
                type="button"
                disabled={explaining || sending}
                onClick={() => void handleExplainTop()}
                className="w-full text-xs font-medium text-primary hover:underline disabled:opacity-50 text-left"
              >
                {explaining ? "Explaining top match…" : "Explain my top recommendation"}
              </button>
            </div>
          )}

          <div ref={scrollRef} className="flex-1 min-h-[240px] max-h-[360px] overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Ask about insurance categories, how recommendations work, or your policies and
                claims.
              </p>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`text-sm rounded-xl px-3 py-2 max-w-[90%] ${
                  msg.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "mr-auto bg-muted text-foreground"
                }`}
              >
                {msg.content}
              </div>
            ))}
            {(sending || explaining) && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Thinking…
              </div>
            )}
          </div>

          <form
            className="border-t border-border p-3 space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              void sendMessage(input);
            }}
          >
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask ClearClever…"
                disabled={sending || configured === null}
                className="flex-1 rounded-xl border border-border bg-input-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                maxLength={2000}
              />
              <button
                type="submit"
                disabled={sending || !input.trim() || configured === null}
                className="rounded-xl bg-primary p-2.5 text-primary-foreground disabled:opacity-50"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground leading-snug">
              AI guidance only — not legal or financial advice. Confirm details with your insurer.
            </p>
          </form>
        </div>
      )}
    </>
  );
}
