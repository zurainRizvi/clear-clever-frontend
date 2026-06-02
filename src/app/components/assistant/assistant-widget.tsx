import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCheck,
  History,
  Loader2,
  MessageCircle,
  Paperclip,
  Send,
  Shield,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../auth-context";
import { ApiError } from "@/lib/api";
import {
  explainRecommendation,
  getAssistantStatus,
  sendAssistantChat,
  type AssistantAttachmentPayload,
} from "@/lib/assistant-api";
import { useAssistantWidget } from "./assistant-widget-context";
import { AssistantMessageMarkdown } from "./assistant-message-markdown";
import { getAssistantSuggestions } from "./assistant-suggestions";
import { getAssistantSessionKey, getAssistantWelcomeMessage } from "./assistant-welcome";
import { normalizeAssistantMarkdown } from "@/lib/assistant-markdown";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
  attachmentNames?: string[];
};

type PendingFile = {
  id: string;
  file: File;
  previewUrl?: string;
};

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
];
const MAX_FILE_BYTES = 4 * 1024 * 1024;
const MAX_FILES = 3;

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

async function fileToAttachment(file: File): Promise<AssistantAttachmentPayload> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Only images (JPEG, PNG, WebP, GIF) and PDF are supported.");
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("Each file must be under 4MB.");
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });

  const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1]! : dataUrl;

  return {
    mimeType: file.type,
    fileName: file.name,
    dataBase64: base64,
  };
}

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
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [sending, setSending] = useState(false);
  const [explaining, setExplaining] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sessionKey = useMemo(
    () =>
      getAssistantSessionKey({
        isAuthenticated,
        userId: user?.id,
        role: user?.role ?? null,
      }),
    [isAuthenticated, user?.id, user?.role]
  );
  const prevSessionKeyRef = useRef(sessionKey);

  const welcomeMessage = useMemo(
    () =>
      getAssistantWelcomeMessage({
        isAuthenticated,
        role: user?.role ?? null,
        fullName: user?.fullName,
      }),
    [isAuthenticated, user?.role, user?.fullName]
  );

  useEffect(() => {
    if (prevSessionKeyRef.current === sessionKey) return;
    prevSessionKeyRef.current = sessionKey;
    setMessages([]);
    setPendingFiles([]);
    setInput("");
  }, [sessionKey]);

  const suggestions = useMemo(
    () =>
      getAssistantSuggestions({
        role: user?.role ?? null,
        isAuthenticated,
        category,
      }),
    [user?.role, isAuthenticated, category]
  );

  const showSuggestions = messages.length === 0 && !sending && !explaining;

  useEffect(() => {
    getAssistantStatus()
      .then((status) => setConfigured(status.configured))
      .catch(() => setConfigured(false));
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, sending, pendingFiles]);

  const sendMessage = useCallback(
    async (text: string, files: PendingFile[] = pendingFiles) => {
      const trimmed = text.trim();
      if ((!trimmed && files.length === 0) || sending) return;

      const attachmentPayloads: AssistantAttachmentPayload[] = [];
      try {
        for (const pf of files) {
          attachmentPayloads.push(await fileToAttachment(pf.file));
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Invalid attachment");
        return;
      }

      const displayText =
        trimmed ||
        (files.length > 0 ? `Shared ${files.length} file(s) for review.` : "");

      const historyForApi = messages.slice(-10).map((m) => ({
        role: m.role === "user" ? ("user" as const) : ("model" as const),
        content: m.content,
      }));

      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        content: displayText,
        createdAt: new Date(),
        attachmentNames: files.map((f) => f.file.name),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setPendingFiles([]);
      setSending(true);

      try {
        const result = await sendAssistantChat({
          message: displayText,
          history: historyForApi.length > 0 ? historyForApi : undefined,
          category: category ?? undefined,
          attachments: attachmentPayloads.length > 0 ? attachmentPayloads : undefined,
          sessionKey,
          auth: isAuthenticated,
        });
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            content: normalizeAssistantMarkdown(result.reply),
            createdAt: new Date(),
          },
        ]);
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Assistant could not reply");
      } finally {
        setSending(false);
      }
    },
    [sending, messages, category, isAuthenticated, pendingFiles, sessionKey]
  );

  useEffect(() => {
    if (!isOpen || !presetReply) return;
    const next: ChatMessage[] = [];
    if (presetUserMessage) {
      next.push({
        id: `u-preset-${Date.now()}`,
        role: "user",
        content: presetUserMessage,
        createdAt: new Date(),
      });
    }
    next.push({
      id: `a-preset-${Date.now()}`,
      role: "assistant",
      content: normalizeAssistantMarkdown(presetReply),
      createdAt: new Date(),
    });
    setMessages(next);
    clearPreset();
  }, [isOpen, presetReply, presetUserMessage, clearPreset]);

  useEffect(() => {
    if (!isOpen) return;
    if (messages.length > 0 || presetReply) return;
    prevSessionKeyRef.current = sessionKey;
  }, [isOpen, messages.length, presetReply, sessionKey]);

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
          createdAt: new Date(),
        },
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: normalizeAssistantMarkdown(result.reply),
          createdAt: new Date(),
        },
      ]);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not explain recommendation");
    } finally {
      setExplaining(false);
    }
  };

  const onPickFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const incoming = Array.from(fileList);
    setPendingFiles((prev) => {
      const merged = [...prev];
      for (const file of incoming) {
        if (merged.length >= MAX_FILES) {
          toast.error(`Maximum ${MAX_FILES} files per message`);
          break;
        }
        merged.push({
          id: `${file.name}-${Date.now()}`,
          file,
          previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
        });
      }
      return merged;
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const clearChat = () => {
    setMessages([]);
    setPendingFiles([]);
    toast.message("Chat cleared");
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
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full px-5 py-3 text-white font-semibold text-sm shadow-[0_16px_40px_rgba(37,99,235,0.35)] hover:opacity-95 transition-opacity"
          style={{
            background: "linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)",
          }}
          aria-label="Open AI assistant"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="hidden sm:inline">AI Assistant</span>
        </button>
      )}

      {isOpen && (
        <div
          className="fixed bottom-4 right-4 z-50 flex w-[min(100vw-1.5rem,440px)] flex-col overflow-hidden border border-slate-900/[0.06] bg-white shadow-[0_30px_80px_rgba(15,23,42,0.10)] sm:bottom-6 sm:right-6"
          style={{ borderRadius: "24px", maxHeight: "min(90vh, 720px)", height: "min(90vh, 720px)" }}
          role="dialog"
          aria-label="ClearClever AI Assistant"
        >
          {/* Header */}
          <header
            className="flex shrink-0 items-center justify-between px-5 py-4 text-white"
            style={{
              background: "linear-gradient(135deg, #0A2EA8 0%, #2563EB 100%)",
            }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                style={{ background: "rgba(255,255,255,0.12)" }}
              >
                <Shield className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 font-bold text-lg tracking-tight truncate">
                  ClearClever Assistant
                  <Sparkles className="h-4 w-4 shrink-0 opacity-90" />
                </p>
                <p className="text-sm font-medium text-white/75">
                  {configured === null ? "Connecting…" : "Powered by Gemini"}
                </p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={clearChat}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-white hover:bg-white/10 transition-colors"
                aria-label="Clear chat history"
                title="Clear chat"
              >
                <History className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={closeAssistant}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-white hover:bg-white/10 transition-colors"
                aria-label="Close assistant"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </header>

          {!isAuthenticated ? (
            <p className="shrink-0 text-xs text-slate-600 bg-slate-50 px-5 py-2 border-b border-slate-100">
              Guest mode — general platform guidance. Sign in for personalized answers.
            </p>
          ) : (
            <p className="shrink-0 text-xs text-slate-600 bg-blue-50/80 px-5 py-2 border-b border-slate-100">
              Signed in as{" "}
              <span className="font-semibold capitalize">
                {user?.role === "user" ? "policy seeker" : user?.role?.replace("_", " ")}
              </span>
              — answers use your account data only.
            </p>
          )}

          {isAuthenticated && user?.role === "user" && category && (
            <div className="shrink-0 px-5 py-2 border-b border-slate-100 bg-white">
              <button
                type="button"
                disabled={explaining || sending}
                onClick={() => void handleExplainTop()}
                className="text-xs font-semibold text-blue-600 hover:underline disabled:opacity-50"
              >
                {explaining ? "Explaining top match…" : "Explain my top recommendation"}
              </button>
            </div>
          )}

          {/* Body */}
          <div
            ref={scrollRef}
            className="flex-1 min-h-0 overflow-y-auto px-4 py-5 flex flex-col gap-5"
            style={{ background: "#F8FAFC" }}
          >
            {messages.length === 0 && (
              <div className="flex gap-3 max-w-[92%]">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div
                  className="rounded-3xl bg-white px-4 py-3 shadow-[0_10px_40px_rgba(15,23,42,0.06)]"
                >
                  <p className="text-[15px] leading-relaxed text-slate-900">{welcomeMessage}</p>
                </div>
              </div>
            )}

            {messages.map((msg) =>
              msg.role === "assistant" ? (
                <div key={msg.id} className="flex gap-3 max-w-[92%]">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div className="rounded-3xl bg-white px-4 py-3 shadow-[0_10px_40px_rgba(15,23,42,0.06)] min-w-0">
                    <AssistantMessageMarkdown content={msg.content} />
                  </div>
                </div>
              ) : (
                <div key={msg.id} className="flex flex-col items-end gap-1">
                  <div
                    className="max-w-[85%] rounded-full px-5 py-3 text-[15px] font-medium text-white shadow-[0_16px_40px_rgba(37,99,235,0.25)]"
                    style={{
                      background: "linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)",
                    }}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    {msg.attachmentNames && msg.attachmentNames.length > 0 && (
                      <p className="mt-1 text-xs text-white/80">
                        📎 {msg.attachmentNames.join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 pr-1">
                    <span>{formatTime(msg.createdAt)}</span>
                    <CheckCheck className="h-3.5 w-3.5 text-blue-500" />
                  </div>
                </div>
              )
            )}

            {(sending || explaining) && (
              <div className="flex gap-3 items-center text-slate-500 text-sm">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                Thinking…
              </div>
            )}

            {showSuggestions && (
              <div className="flex flex-wrap gap-2 pl-12 pt-1">
                {suggestions.map((chip) => {
                  const Icon = chip.icon;
                  return (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => void sendMessage(chip.prompt)}
                      className="inline-flex items-center gap-2 rounded-full border border-blue-600/12 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm hover:border-blue-600/25 hover:bg-blue-50/50 transition-colors"
                    >
                      <Icon className="h-4 w-4 text-blue-600" />
                      {chip.text}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="shrink-0 border-t border-slate-900/[0.06] bg-white px-4 pt-3 pb-3">
            {pendingFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {pendingFiles.map((pf) => (
                  <span
                    key={pf.id}
                    className="inline-flex items-center gap-2 rounded-xl border border-blue-600/12 bg-slate-50 px-2 py-1 text-xs text-slate-700"
                  >
                    {pf.previewUrl ? (
                      <img src={pf.previewUrl} alt="" className="h-8 w-8 rounded object-cover" />
                    ) : (
                      <Paperclip className="h-4 w-4 text-blue-600" />
                    )}
                    <span className="max-w-[120px] truncate">{pf.file.name}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setPendingFiles((prev) => prev.filter((f) => f.id !== pf.id))
                      }
                      className="text-slate-400 hover:text-slate-700"
                      aria-label="Remove file"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <form
              className="flex flex-col gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void sendMessage(input);
              }}
            >
              <div
                className="flex items-center gap-2 rounded-full border-2 border-blue-600/12 bg-slate-50 px-3 py-2 shadow-[0_8px_30px_rgba(15,23,42,0.04)]"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask ClearClever anything..."
                  disabled={sending || configured === null}
                  className="flex-1 min-w-0 bg-transparent border-0 text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
                  maxLength={2000}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ALLOWED_TYPES.join(",")}
                  multiple
                  className="hidden"
                  onChange={(e) => onPickFiles(e.target.files)}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sending || pendingFiles.length >= MAX_FILES}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-600/12 bg-white text-blue-600 shadow-sm hover:bg-blue-50 disabled:opacity-50"
                  aria-label="Attach files"
                  title="Attach images or PDF (max 3, 4MB each)"
                >
                  <Paperclip className="h-5 w-5" />
                </button>
                <button
                  type="submit"
                  disabled={
                    sending ||
                    configured === null ||
                    (!input.trim() && pendingFiles.length === 0)
                  }
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-[0_16px_30px_rgba(37,99,235,0.30)] disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)",
                  }}
                  aria-label="Send message"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
              <p className="flex items-center gap-1.5 text-xs text-slate-500">
                <Shield className="h-3.5 w-3.5 shrink-0" />
                AI guidance only — not legal or financial advice. Confirm details with your insurer.
              </p>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
