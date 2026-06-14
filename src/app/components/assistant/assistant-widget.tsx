import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCheck,
  History,
  MessageCircle,
  Paperclip,
  Send,
  Shield,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../auth-context";
import { ApiError } from "@/lib/api";
import {
  createAssistantThread,
  fromStoredMessages,
  resolveThreadTitle,
  loadAssistantChatStore,
  saveAssistantChatStore,
  toStoredMessages,
  type AssistantChatThread,
} from "@/lib/assistant-chat-storage";
import {
  explainRecommendation,
  getAssistantStatus,
  sendAssistantChat,
  type AssistantAttachmentPayload,
  type AssistantStatus,
} from "@/lib/assistant-api";
import { useAssistantWidget } from "./assistant-widget-context";
import { AssistantMessageMarkdown } from "./assistant-message-markdown";
import { AssistantMessageShell } from "./assistant-message-shell";
import { AssistantThreadSidebar } from "./assistant-thread-sidebar";
import { getAssistantSuggestions } from "./assistant-suggestions";
import { getAssistantSessionKey, getAssistantWelcomeMessage } from "./assistant-welcome";
import { compactHistoryForApi } from "@/lib/assistant-history-trim";
import { normalizeAssistantMarkdown } from "@/lib/assistant-markdown";
import {
  clampLauncherOffset,
  loadLauncherOffset,
  saveLauncherOffset,
} from "@/lib/assistant-launcher-position";
import { SpeechInputProvider, SpeechListeningBanner, SpeechMicButton, SpeechVoiceLanguageLink } from "../ui/speech-input-button";

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
const DRAG_CLICK_THRESHOLD_PX = 6;

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

  type AssistantAvailability = "loading" | "configured" | "unconfigured" | "status_error" | "quota_exhausted";
  const [availability, setAvailability] = useState<AssistantAvailability>("loading");
  const [quotaInfo, setQuotaInfo] = useState<AssistantStatus["quota"]>();

  const refreshAssistantStatus = useCallback(() => {
    setAvailability("loading");
    getAssistantStatus()
      .then((status) => {
        setQuotaInfo(status.quota);
        if (!status.configured) {
          setAvailability("unconfigured");
          return;
        }
        if (status.quota?.dailyExhausted) {
          setAvailability("quota_exhausted");
          return;
        }
        setAvailability("configured");
      })
      .catch(() => setAvailability("status_error"));
  }, []);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [threads, setThreads] = useState<AssistantChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [sending, setSending] = useState(false);
  const [explaining, setExplaining] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatInFlightRef = useRef(false);
  const lastUserMessageIdRef = useRef<string | null>(null);
  const shouldScrollToBottomRef = useRef(false);
  const [launcherOffset, setLauncherOffset] = useState(loadLauncherOffset);
  const panelRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const dragCleanupRef = useRef<(() => void) | null>(null);

  const clampLauncher = useCallback((offset: { x: number; y: number }) => {
    return clampLauncherOffset(offset, launcherRef.current);
  }, []);

  useEffect(() => {
    if (isOpen) return;
    setLauncherOffset((current) => clampLauncher(current));
  }, [isOpen, clampLauncher]);

  useEffect(() => {
    const handleResize = () => {
      if (isOpen) return;
      setLauncherOffset((current) => clampLauncher(current));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen, clampLauncher]);

  const persistKey = useMemo(() => {
    if (!isAuthenticated || !user?.id || !user.role) return null;
    return { userId: user.id, role: user.role };
  }, [isAuthenticated, user?.id, user?.role]);

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

  const persistStore = useCallback(
    (nextThreads: AssistantChatThread[], nextActiveId: string | null) => {
      if (!persistKey) return;
      saveAssistantChatStore(persistKey.userId, persistKey.role, {
        activeThreadId: nextActiveId,
        threads: nextThreads,
      });
    },
    [persistKey]
  );

  const applyThreadMessages = useCallback(
    (threadId: string | null, nextMessages: ChatMessage[]) => {
      if (!persistKey || !threadId) return;
      const stored = toStoredMessages(nextMessages);
      setThreads((prev) => {
        const next = prev.map((thread) =>
          thread.id === threadId
            ? {
                ...thread,
                messages: stored,
                title: resolveThreadTitle(thread.title, stored),
                updatedAt: new Date().toISOString(),
              }
            : thread
        );
        persistStore(next, threadId);
        return next;
      });
    },
    [persistKey, persistStore]
  );

  const ensureActiveThread = useCallback((): string | null => {
    if (!persistKey) return null;
    if (activeThreadId && threads.some((thread) => thread.id === activeThreadId)) {
      return activeThreadId;
    }
    const thread = createAssistantThread();
    const nextThreads = [thread, ...threads];
    setThreads(nextThreads);
    setActiveThreadId(thread.id);
    persistStore(nextThreads, thread.id);
    return thread.id;
  }, [persistKey, activeThreadId, threads, persistStore]);

  useEffect(() => {
    if (!persistKey) {
      setThreads([]);
      setActiveThreadId(null);
      return;
    }
    const store = loadAssistantChatStore(persistKey.userId, persistKey.role);
    const resolvedActiveId = store.activeThreadId ?? store.threads[0]?.id ?? null;
    const activeThread = store.threads.find((thread) => thread.id === resolvedActiveId);
    setThreads(store.threads);
    setActiveThreadId(resolvedActiveId);
    setMessages(activeThread ? fromStoredMessages(activeThread.messages) : []);
  }, [persistKey?.userId, persistKey?.role]);

  useEffect(() => {
    if (prevSessionKeyRef.current === sessionKey) return;
    prevSessionKeyRef.current = sessionKey;
    setMessages([]);
    setPendingFiles([]);
    setInput("");
    if (!persistKey) {
      setThreads([]);
      setActiveThreadId(null);
    }
  }, [sessionKey, persistKey]);

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
    refreshAssistantStatus();
  }, [refreshAssistantStatus]);

  useEffect(() => {
    return () => {
      dragCleanupRef.current?.();
      dragCleanupRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!scrollRef.current || !isOpen) return;

    if (shouldScrollToBottomRef.current) {
      shouldScrollToBottomRef.current = false;
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      return;
    }

    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === "assistant" && lastUserMessageIdRef.current) {
      const userEl = scrollRef.current.querySelector(
        `[data-message-id="${lastUserMessageIdRef.current}"]`
      );
      userEl?.scrollIntoView({ block: "start" });
    }
  }, [messages, isOpen, sending]);

  const sendMessage = useCallback(
    async (text: string, files: PendingFile[] = pendingFiles) => {
      const trimmed = text.trim();
      if ((!trimmed && files.length === 0) || sending || chatInFlightRef.current) return;

      chatInFlightRef.current = true;
      const threadId = ensureActiveThread();

      const attachmentPayloads: AssistantAttachmentPayload[] = [];
      try {
        for (const pf of files) {
          attachmentPayloads.push(await fileToAttachment(pf.file));
        }
      } catch (err) {
        chatInFlightRef.current = false;
        toast.error(err instanceof Error ? err.message : "Invalid attachment");
        return;
      }

      const displayText =
        trimmed ||
        (files.length > 0 ? `Shared ${files.length} file(s) for review.` : "");

      const historyForApi = compactHistoryForApi(messages);

      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        content: displayText,
        createdAt: new Date(),
        attachmentNames: files.map((f) => f.file.name),
      };
      lastUserMessageIdRef.current = userMsg.id;
      shouldScrollToBottomRef.current = true;
      const withUser = [...messages, userMsg];
      setMessages(withUser);
      if (threadId) applyThreadMessages(threadId, withUser);
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
        const withAssistant = [
          ...withUser,
          {
            id: `a-${Date.now()}`,
            role: "assistant" as const,
            content: normalizeAssistantMarkdown(result.reply),
            createdAt: new Date(),
          },
        ];
        setMessages(withAssistant);
        if (threadId) applyThreadMessages(threadId, withAssistant);
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.errors[0] ?? err.message
            : "Assistant could not reply — try again in a moment";
        if (/daily ai quota|free tier/i.test(message)) {
          setAvailability("quota_exhausted");
        }
        toast.error(message);
      } finally {
        chatInFlightRef.current = false;
        setSending(false);
      }
    },
    [
      sending,
      messages,
      category,
      isAuthenticated,
      pendingFiles,
      sessionKey,
      ensureActiveThread,
      applyThreadMessages,
    ]
  );

  useEffect(() => {
    if (!isOpen || !presetReply) return;
    const threadId = ensureActiveThread();
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
    if (threadId) applyThreadMessages(threadId, next);
    clearPreset();
  }, [
    isOpen,
    presetReply,
    presetUserMessage,
    clearPreset,
    ensureActiveThread,
    applyThreadMessages,
  ]);

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
    if (chatInFlightRef.current || sending || explaining) return;
    chatInFlightRef.current = true;
    const threadId = ensureActiveThread();
    setExplaining(true);
    try {
      const result = await explainRecommendation({ category });
      const next = [
        ...messages,
        {
          id: `u-${Date.now()}`,
          role: "user" as const,
          content: `Explain why ${result.policyName} is recommended for me.`,
          createdAt: new Date(),
        },
        {
          id: `a-${Date.now()}`,
          role: "assistant" as const,
          content: normalizeAssistantMarkdown(result.reply),
          createdAt: new Date(),
        },
      ];
      setMessages(next);
      if (threadId) applyThreadMessages(threadId, next);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not explain recommendation");
    } finally {
      chatInFlightRef.current = false;
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

  const resetGuestChatState = useCallback(() => {
    setMessages([]);
    setPendingFiles([]);
    setInput("");
  }, []);

  const clearCurrentChat = useCallback(() => {
    setMessages([]);
    setPendingFiles([]);
    setInput("");
    if (persistKey && activeThreadId) {
      applyThreadMessages(activeThreadId, []);
    }
  }, [persistKey, activeThreadId, applyThreadMessages]);

  const startNewChat = useCallback(() => {
    if (persistKey) {
      const active = threads.find((thread) => thread.id === activeThreadId);
      if (active && active.messages.length === 0) {
        setMessages([]);
        setPendingFiles([]);
        setInput("");
        return;
      }

      const existingEmpty = threads.find((thread) => thread.messages.length === 0);
      if (existingEmpty) {
        setActiveThreadId(existingEmpty.id);
        setMessages([]);
        setPendingFiles([]);
        setInput("");
        persistStore(threads, existingEmpty.id);
        return;
      }

      const thread = createAssistantThread();
      const nextThreads = [thread, ...threads];
      setThreads(nextThreads);
      setActiveThreadId(thread.id);
      setMessages([]);
      setPendingFiles([]);
      setInput("");
      persistStore(nextThreads, thread.id);
      return;
    }
    resetGuestChatState();
  }, [persistKey, threads, activeThreadId, persistStore, resetGuestChatState]);

  const selectThread = useCallback(
    (threadId: string) => {
      const thread = threads.find((item) => item.id === threadId);
      if (!thread) return;
      setActiveThreadId(threadId);
      setMessages(fromStoredMessages(thread.messages));
      setPendingFiles([]);
      setInput("");
      persistStore(threads, threadId);
    },
    [threads, persistStore]
  );

  const deleteThread = useCallback(
    (threadId: string) => {
      const nextThreads = threads.filter((thread) => thread.id !== threadId);
      let nextActiveId = activeThreadId;
      if (activeThreadId === threadId) {
        nextActiveId = nextThreads[0]?.id ?? null;
        setMessages(nextActiveId ? fromStoredMessages(nextThreads[0]!.messages) : []);
        setPendingFiles([]);
        setInput("");
      }
      setThreads(nextThreads);
      setActiveThreadId(nextActiveId);
      persistStore(nextThreads, nextActiveId);
    },
    [threads, activeThreadId, persistStore]
  );

  const handleClose = useCallback(() => {
    if (!persistKey) {
      resetGuestChatState();
    } else if (activeThreadId) {
      applyThreadMessages(activeThreadId, messages);
    }
    closeAssistant();
  }, [
    persistKey,
    resetGuestChatState,
    activeThreadId,
    messages,
    applyThreadMessages,
    closeAssistant,
  ]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, handleClose]);

  const panelWidthClass = persistKey
    ? "w-[min(100vw-1.5rem,680px)]"
    : "w-[min(100vw-1.5rem,440px)]";

  const startLauncherDrag = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (event.button !== 0) return;

      event.preventDefault();
      dragCleanupRef.current?.();

      const startX = event.clientX;
      const startY = event.clientY;
      const originX = launcherOffset.x;
      const originY = launcherOffset.y;
      let moved = false;

      const onPointerMove = (moveEvent: PointerEvent) => {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;
        if (!moved && Math.hypot(dx, dy) < DRAG_CLICK_THRESHOLD_PX) return;
        moved = true;
        setLauncherOffset((current) =>
          clampLauncher({
            x: originX + dx,
            y: originY + dy,
          }),
        );
      };

      const endDrag = () => {
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", endDrag);
        window.removeEventListener("pointercancel", endDrag);
        dragCleanupRef.current = null;
        setLauncherOffset((current) => {
          const clamped = clampLauncher(current);
          saveLauncherOffset(clamped);
          return clamped;
        });
        if (!moved) toggleAssistant();
      };

      dragCleanupRef.current = endDrag;
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", endDrag);
      window.addEventListener("pointercancel", endDrag);
    },
    [launcherOffset.x, launcherOffset.y, clampLauncher, toggleAssistant],
  );

  if (availability === "unconfigured") {
    return null;
  }

  return (
    <>
      {!isOpen && (
        <button
          ref={launcherRef}
          type="button"
          onPointerDown={startLauncherDrag}
          className="fixed bottom-6 right-6 z-50 flex cursor-grab active:cursor-grabbing touch-none select-none items-center gap-2 rounded-full bg-primary px-5 py-3 text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/25 hover:opacity-95 transition-opacity"
          style={{
            transform: `translate(${launcherOffset.x}px, ${launcherOffset.y}px)`,
            transformOrigin: "bottom right",
          }}
          aria-label="Open AI assistant"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="hidden sm:inline">AI Assistant</span>
        </button>
      )}

      {isOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default bg-background/30 backdrop-blur-[2px] dark:bg-black/20"
            aria-label="Close assistant"
            onClick={handleClose}
          />
          <div
            ref={panelRef}
            className={`fixed bottom-4 right-4 z-50 flex ${panelWidthClass} flex-col overflow-hidden border border-border/80 bg-card shadow-2xl sm:bottom-6 sm:right-6`}
            style={{
              borderRadius: "24px",
              maxHeight: "min(90vh, 720px)",
              height: "min(90vh, 720px)",
            }}
            role="dialog"
            aria-modal="true"
            aria-label="ClearClever AI Assistant"
          >
            <div className="flex min-h-0 flex-1">
              {persistKey && (
                <AssistantThreadSidebar
                  threads={threads}
                  activeThreadId={activeThreadId}
                  onSelectThread={selectThread}
                  onNewThread={startNewChat}
                  onDeleteThread={deleteThread}
                />
              )}

              <div className="flex min-w-0 flex-1 flex-col">
                <header className="flex shrink-0 items-center justify-between border-b border-border/80 bg-gradient-to-r from-card via-card to-primary/5 px-5 py-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
                      <MessageCircle className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-lg tracking-tight truncate text-foreground">
                        ClearClever Assistant
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {availability === "loading"
                          ? "Connecting…"
                          : availability === "quota_exhausted"
                            ? "Daily AI quota reached"
                            : availability === "status_error"
                              ? "Temporarily unavailable"
                              : "Insurance guidance"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        clearCurrentChat();
                      }}
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                      aria-label="Clear current chat"
                      title="Clear current chat"
                    >
                      <History className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleClose}
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                      aria-label="Close assistant"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </header>

                {availability === "quota_exhausted" && (
                  <div className="shrink-0 text-xs bg-amber-500/10 text-amber-900 dark:text-amber-200 px-5 py-2.5 border-b border-amber-500/20 leading-relaxed">
                    Daily AI quota reached (Google free tier ~{quotaInfo?.dailyLimit ?? 20} requests/day).
                    Claims and chat will work again after midnight UTC, or enable billing in{" "}
                    <a
                      href="https://aistudio.google.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold underline"
                    >
                      Google AI Studio
                    </a>
                    .
                  </div>
                )}

                {availability === "status_error" && (
                  <div className="shrink-0 flex items-center justify-between gap-3 text-xs bg-amber-500/10 text-amber-900 dark:text-amber-200 px-5 py-2 border-b border-amber-500/20">
                    <span>Assistant temporarily unavailable — check your connection or try again.</span>
                    <button
                      type="button"
                      onClick={refreshAssistantStatus}
                      className="font-semibold underline shrink-0"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {!isAuthenticated ? (
                  <p className="shrink-0 text-xs text-muted-foreground bg-muted/40 px-5 py-2 border-b border-border">
                    Guest mode — general platform guidance. Sign in for personalized answers and saved chats.
                  </p>
                ) : (
                  <p className="shrink-0 text-xs text-muted-foreground bg-muted/40 px-5 py-2 border-b border-border">
                    Signed in as{" "}
                    <span className="font-semibold capitalize text-foreground">
                      {user?.role === "user" ? "policy seeker" : user?.role?.replace("_", " ")}
                    </span>
                    — chats are saved on this device.
                  </p>
                )}

                {isAuthenticated && user?.role === "user" && category && (
                  <div className="shrink-0 px-5 py-2 border-b border-border bg-card">
                    <button
                      type="button"
                      disabled={explaining || sending}
                      onClick={() => void handleExplainTop()}
                      className="text-xs font-semibold text-primary hover:underline disabled:opacity-50"
                    >
                      {explaining ? "Explaining top match…" : "Explain my top recommendation"}
                    </button>
                  </div>
                )}

                <div
                  ref={scrollRef}
                  className="flex-1 min-h-0 overflow-y-auto px-4 py-5 flex flex-col gap-5 bg-muted/20"
                >
                  {messages.length === 0 && (
                    <AssistantMessageShell>
                      <AssistantMessageMarkdown content={welcomeMessage} />
                    </AssistantMessageShell>
                  )}

                  {messages.map((msg) =>
                    msg.role === "assistant" ? (
                      <AssistantMessageShell key={msg.id}>
                        <AssistantMessageMarkdown content={msg.content} />
                      </AssistantMessageShell>
                    ) : (
                      <div
                        key={msg.id}
                        data-message-id={msg.id}
                        className="flex flex-col items-end gap-1"
                      >
                        <div className="max-w-[85%] rounded-2xl bg-primary px-4 py-3 text-[15px] font-medium text-primary-foreground">
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                          {msg.attachmentNames && msg.attachmentNames.length > 0 && (
                            <p className="mt-1 text-xs text-white/80">
                              📎 {msg.attachmentNames.join(", ")}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground pr-1">
                          <span>{formatTime(msg.createdAt)}</span>
                          <CheckCheck className="h-3.5 w-3.5 text-primary" />
                        </div>
                      </div>
                    )
                  )}

                  {(sending || explaining) && (
                    <div className="flex gap-3 items-center rounded-2xl border border-border/60 bg-card/80 px-4 py-3 text-sm text-muted-foreground shadow-sm">
                      <span className="flex gap-1" aria-hidden>
                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
                      </span>
                      ClearClever is composing a response…
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
                            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground shadow-sm hover:bg-accent transition-colors"
                          >
                            <Icon className="h-4 w-4 text-primary" />
                            {chip.text}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="shrink-0 border-t border-border bg-card px-4 pt-3 pb-3">
                  {pendingFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {pendingFiles.map((pf) => (
                        <span
                          key={pf.id}
                          className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted px-2 py-1 text-xs text-foreground"
                        >
                          {pf.previewUrl ? (
                            <img src={pf.previewUrl} alt="" className="h-8 w-8 rounded object-cover" />
                          ) : (
                            <Paperclip className="h-4 w-4 text-primary" />
                          )}
                          <span className="max-w-[120px] truncate">{pf.file.name}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setPendingFiles((prev) => prev.filter((f) => f.id !== pf.id))
                            }
                            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
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
                  <SpeechInputProvider
                    disabled={
                      sending ||
                      availability === "unconfigured" ||
                      availability === "quota_exhausted"
                    }
                    onTranscript={(text) =>
                      setInput((prev) => {
                        const merged = prev.trim() ? `${prev.trim()} ${text}` : text;
                        return merged.slice(0, 2000);
                      })
                    }
                  >
                    <SpeechListeningBanner />
                    <div className="flex items-end gap-2 rounded-2xl border border-border bg-muted/30 px-3 py-2">
                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask ClearClever anything..."
                        disabled={sending || availability === "unconfigured" || availability === "quota_exhausted"}
                        rows={1}
                        className="flex-1 min-w-0 resize-none bg-transparent border-0 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0 py-2"
                        maxLength={2000}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" && !event.shiftKey) {
                            event.preventDefault();
                            void sendMessage(input);
                          }
                        }}
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
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-primary hover:bg-accent disabled:opacity-50"
                        aria-label="Attach files"
                        title="Attach images or PDF (max 3, 4MB each)"
                      >
                        <Paperclip className="h-5 w-5" />
                      </button>
                      <SpeechMicButton />
                      <button
                        type="submit"
                        disabled={
                          sending ||
                          availability === "unconfigured" ||
                          availability === "quota_exhausted" ||
                          (!input.trim() && pendingFiles.length === 0)
                        }
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
                        aria-label="Send message"
                      >
                        <Send className="h-5 w-5" />
                      </button>
                    </div>
                    <SpeechVoiceLanguageLink />
                  </SpeechInputProvider>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Shield className="h-3.5 w-3.5 shrink-0" />
                      AI guidance only — not legal or financial advice. Confirm details with your insurer.
                    </p>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
