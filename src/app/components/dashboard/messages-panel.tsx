import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router";
import { Building2, MessageSquare, Paperclip, Send, Shield, User } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../auth-context";
import { useProviderOptional } from "./provider-context";
import { useMessagesOptional } from "./messages-context";
import { ChatShell } from "./chat-shell";
import { ApiError } from "@/lib/api";
import {
  createConversation,
  fetchConversationMessages,
  fetchConversations,
  markConversationRead,
  sendConversationMessage,
  type ConversationMessage,
  type ConversationSummary,
  type ConversationType,
} from "@/lib/messaging-api";
import { isConversationUnread } from "@/lib/messaging-unread";
import { titleForConversation } from "@/lib/messaging-display";
import { ConversationActionsMenu } from "./conversation-actions-menu";
import { SupportChatCta } from "./support-chat-cta";
import { AnimatedPillTabs } from "../ui/animated-pill-tabs";

const SUPPORT_WELCOME_MESSAGE = "Hi ClearClever support, I need help with a query.";

export type SeekerMessagesTab = SeekerTab;
export type ProviderMessagesTab = ProviderTab;

const MESSAGE_POLL_MS = 20_000;

export type MessagesTabMode = "provider" | "seeker" | "none";
type ProviderTab = "seekers" | "support";
type SeekerTab = "insurers" | "support";

function typeLabel(type: ConversationType) {
  return type.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function conversationMatchesTab(
  conversation: ConversationSummary,
  tabMode: MessagesTabMode,
  activeTab: ProviderTab | SeekerTab
): boolean {
  if (tabMode === "none") return true;
  if (tabMode === "provider") {
    return activeTab === "seekers"
      ? conversation.type === "user_insurer"
      : conversation.type === "insurer_support";
  }
  return activeTab === "insurers"
    ? conversation.type === "user_insurer"
    : conversation.type === "user_support";
}

export function MessagesPanel({
  defaultConversation,
  focusConversationId,
  tabMode = "none",
  initialTab,
  openSupportOnMount = false,
}: {
  defaultConversation?: {
    type: ConversationType;
    insurerProfileId?: string;
    purchaseId?: string;
    subject?: string;
    initialMessage?: string;
  };
  focusConversationId?: string | null;
  tabMode?: MessagesTabMode;
  initialTab?: SeekerTab | ProviderTab;
  /** Open existing support chat or create one (welcome message only on first create). */
  openSupportOnMount?: boolean;
}) {
  const { user } = useAuth();
  const providerContext = useProviderOptional();
  const insurerProfileId = providerContext?.profile?.id;
  const messagesContext = useMessagesOptional();
  const refreshFromContext = messagesContext?.refreshConversations;
  const [localConversations, setLocalConversations] = useState<ConversationSummary[]>([]);
  const [localLoadingConversations, setLocalLoadingConversations] = useState(!messagesContext);
  const allConversations = messagesContext?.conversations ?? localConversations;
  const loadingConversations = messagesContext?.isLoading ?? localLoadingConversations;

  const [providerTab, setProviderTab] = useState<ProviderTab>(
    initialTab === "support" && tabMode === "provider" ? "support" : "seekers"
  );
  const [seekerTab, setSeekerTab] = useState<SeekerTab>(
    initialTab === "support" && tabMode === "seeker" ? "support" : "insurers"
  );
  const activeTab = tabMode === "provider" ? providerTab : tabMode === "seeker" ? seekerTab : null;
  const supportType: ConversationType =
    user?.role === "insurer" ? "insurer_support" : "user_support";
  const existingSupportConversation = useMemo(
    () => allConversations.find((conversation) => conversation.type === supportType) ?? null,
    [allConversations, supportType]
  );
  const openedSupportFromNavRef = useRef(false);

  const conversations = useMemo(() => {
    let scoped = allConversations;
    if (tabMode === "provider" && insurerProfileId) {
      scoped = scoped.filter(
        (conversation) =>
          conversation.type !== "user_insurer" ||
          conversation.insurer?.id === insurerProfileId
      );
    }
    if (!activeTab || tabMode === "none") return scoped;
    return scoped.filter((c) => conversationMatchesTab(c, tabMode, activeTab));
  }, [allConversations, tabMode, activeTab, insurerProfileId]);

  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [creatingSupport, setCreatingSupport] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) ?? null,
    [activeConversationId, conversations]
  );

  const refreshConversations = useCallback(
    async (options?: { silent?: boolean }) => {
      if (refreshFromContext) {
        await refreshFromContext(options);
        return;
      }
      const silent = options?.silent ?? false;
      if (!silent) setLocalLoadingConversations(true);
      try {
        const data = await fetchConversations();
        setLocalConversations(data.conversations);
      } catch (err) {
        if (!silent) {
          toast.error(err instanceof ApiError ? err.message : "Could not load messages");
        }
      } finally {
        if (!silent) setLocalLoadingConversations(false);
      }
    },
    [refreshFromContext]
  );

  useEffect(() => {
    if (!messagesContext) {
      void refreshConversations();
      const interval = window.setInterval(
        () => void refreshConversations({ silent: true }),
        MESSAGE_POLL_MS
      );
      return () => window.clearInterval(interval);
    }
    return undefined;
  }, [messagesContext, refreshConversations]);

  const handleConversationDeleted = async (conversationId: string) => {
    if (activeConversationId === conversationId) {
      setActiveConversationId(null);
      setMessages([]);
    }
    await refreshConversations({ silent: true });
  };

  useEffect(() => {
    if (focusConversationId) {
      setActiveConversationId(focusConversationId);
      return;
    }
    if (conversations.length === 0) {
      setActiveConversationId(null);
      return;
    }
    setActiveConversationId((current) =>
      current && conversations.some((c) => c.id === current) ? current : (conversations[0]?.id ?? null)
    );
  }, [conversations, focusConversationId, activeTab]);

  useEffect(() => {
    if (!defaultConversation) return;

    let cancelled = false;
    async function ensureDefaultConversation() {
      try {
        const data = await createConversation(defaultConversation);
        if (cancelled) return;
        await refreshConversations({ silent: true });
        setActiveConversationId(data.conversation.id);
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Could not start conversation");
      }
    }

    void ensureDefaultConversation();
    return () => {
      cancelled = true;
    };
  }, [
    defaultConversation?.type,
    defaultConversation?.insurerProfileId,
    defaultConversation?.purchaseId,
    defaultConversation?.subject,
    defaultConversation?.initialMessage,
  ]);

  const loadMessages = useCallback(
    async (conversationId: string, options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;
      if (!silent) setLoadingMessages(true);
      try {
        const data = await fetchConversationMessages(conversationId);
        setMessages((prev) => {
          if (silent && prev.length > 0 && data.messages.length >= prev.length) {
            const lastPrev = prev[prev.length - 1]?.id;
            const lastNext = data.messages[data.messages.length - 1]?.id;
            if (lastPrev === lastNext && data.messages.length === prev.length) {
              return prev;
            }
          }
          return data.messages;
        });
        await markConversationRead(conversationId).catch(() => undefined);
        await refreshConversations({ silent: true });
      } catch (err) {
        if (!silent) {
          toast.error(err instanceof ApiError ? err.message : "Could not load conversation");
        }
      } finally {
        if (!silent) setLoadingMessages(false);
      }
    },
    [refreshConversations]
  );

  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    void loadMessages(activeConversationId);
    const interval = window.setInterval(
      () => void loadMessages(activeConversationId, { silent: true }),
      MESSAGE_POLL_MS
    );
    return () => window.clearInterval(interval);
  }, [activeConversationId, loadMessages]);

  useEffect(() => {
    if (!loadingMessages && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [messages, loadingMessages, activeConversationId]);

  useEffect(() => {
    if (!openSupportOnMount || loadingConversations || openedSupportFromNavRef.current) return;
    openedSupportFromNavRef.current = true;
    void openSupportChat();
  }, [openSupportOnMount, loadingConversations]);

  const openSupportChat = async () => {
    if (!user) return;
    if (tabMode === "provider") setProviderTab("support");
    if (tabMode === "seeker") setSeekerTab("support");

    if (existingSupportConversation) {
      setActiveConversationId(existingSupportConversation.id);
      return;
    }

    setCreatingSupport(true);
    try {
      const data = await createConversation({
        type: supportType,
        subject: "ClearClever support",
        initialMessage: SUPPORT_WELCOME_MESSAGE,
      });
      await refreshConversations({ silent: true });
      setActiveConversationId(data.conversation.id);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not start support chat");
    } finally {
      setCreatingSupport(false);
    }
  };

  const sendMessage = async () => {
    if (!activeConversationId || (!draft.trim() && pendingFiles.length === 0)) return;
    setSending(true);
    try {
      const attachments = await Promise.all(
        pendingFiles.map(
          async (file) =>
            ({
              fileName: file.name,
              mimeType: file.type || "application/octet-stream",
              dataUrl: await readFileAsDataUrl(file),
            }) as const
        )
      );
      const data = await sendConversationMessage(activeConversationId, draft.trim(), attachments);
      setMessages((prev) => [...prev, data.message]);
      await refreshConversations({ silent: true });
      setDraft("");
      setPendingFiles([]);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not send message");
    } finally {
      setSending(false);
    }
  };

  const onSupportTab =
    tabMode === "none" ||
    (tabMode === "provider" && providerTab === "support") ||
    (tabMode === "seeker" && seekerTab === "support");

  const panel = (
    <ChatShell>
      {tabMode === "provider" ? (
        <AnimatedPillTabs
          className="mb-4 shrink-0"
          tabs={[
            { id: "seekers", label: "Policy seekers" },
            { id: "support", label: "Support" },
          ]}
          activeId={providerTab}
          onChange={(id) => setProviderTab(id as typeof providerTab)}
          layoutId="provider-messages-tab"
        />
      ) : null}
      {tabMode === "seeker" ? (
        <AnimatedPillTabs
          className="mb-4 shrink-0"
          tabs={[
            { id: "insurers", label: "Insurers" },
            { id: "support", label: "Support" },
          ]}
          activeId={seekerTab}
          onChange={(id) => setSeekerTab(id as typeof seekerTab)}
          layoutId="seeker-messages-tab"
        />
      ) : null}

      <div className="grid lg:grid-cols-[320px_1fr] gap-4 flex-1 min-h-0">
        <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col min-h-0">
          <div className="p-5 border-b border-border flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-xl font-semibold">Messages</h2>
              <p className="text-sm text-muted-foreground">
                {tabMode === "provider"
                  ? providerTab === "seekers"
                    ? "Chats with policy seekers"
                    : "ClearClever support"
                  : tabMode === "seeker"
                    ? seekerTab === "insurers"
                      ? "Chats with insurers"
                      : "ClearClever support"
                    : "Insurers, support, and staff chats"}
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-border min-h-0">
            {loadingConversations ? (
              <div className="p-6 text-center text-muted-foreground">Loading conversations...</div>
            ) : onSupportTab && !existingSupportConversation ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Press <span className="font-semibold text-foreground">Chat with us</span> on the right to
                start a secure conversation with the ClearClever team.
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                No conversations in this tab yet.
              </div>
            ) : (
              conversations.map((conversation) => {
                const active = conversation.id === activeConversationId;
                const unread = isConversationUnread(conversation, user?.id);
                return (
                  <div
                    key={conversation.id}
                    className={`flex items-stretch hover:bg-accent transition-colors ${
                      active ? "bg-primary/5" : ""
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveConversationId(conversation.id)}
                      className="flex-1 min-w-0 text-left p-4"
                    >
                      <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          {conversation.type.includes("support") ? (
                            <Shield className="w-5 h-5" />
                          ) : (
                            <User className="w-5 h-5" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate flex items-center gap-2">
                            <span className="truncate">
                              {titleForConversation(conversation, user?.id, user?.role)}
                            </span>
                            {unread ? (
                              <span className="shrink-0 w-2 h-2 rounded-full bg-primary" />
                            ) : null}
                          </div>
                          <div className="text-xs text-muted-foreground mb-1">
                            {typeLabel(conversation.type)}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {conversation.lastMessagePreview ??
                              conversation.subject ??
                              "No messages yet"}
                          </p>
                        </div>
                      </div>
                    </button>
                    <div className="flex items-start pt-4 pr-2">
                      <ConversationActionsMenu
                        conversation={conversation}
                        currentUserId={user?.id}
                        viewerRole={user?.role}
                        onUpdated={() => refreshConversations({ silent: true })}
                        onDeleted={() => handleConversationDeleted(conversation.id)}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl flex flex-col min-h-0 overflow-hidden">
          {activeConversation ? (
            <>
              <div className="p-5 border-b border-border flex items-start justify-between gap-3 shrink-0">
                <div className="min-w-0">
                  <h2 className="text-xl font-semibold truncate">
                    {titleForConversation(activeConversation, user?.id, user?.role)}
                  </h2>
                  <p className="text-sm text-muted-foreground truncate">
                    {activeConversation.subject ?? typeLabel(activeConversation.type)}
                  </p>
                </div>
                <ConversationActionsMenu
                  conversation={activeConversation}
                  currentUserId={user?.id}
                  viewerRole={user?.role}
                  onUpdated={() => refreshConversations({ silent: true })}
                  onDeleted={() => handleConversationDeleted(activeConversation.id)}
                />
              </div>

              <div
                ref={messagesScrollRef}
                className="flex-1 min-h-0 p-5 space-y-3 overflow-y-auto bg-muted/20"
              >
                {loadingMessages ? (
                  <div className="text-center text-muted-foreground py-10">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-10">
                    No messages yet. Send the first message below.
                  </div>
                ) : (
                  messages.map((message) => {
                    const mine = message.senderUserId === user?.id;
                    const senderParticipant = activeConversation?.participants.find(
                      (participant) => participant.id === message.senderUserId
                    );
                    const senderName =
                      senderParticipant?.role === "insurer"
                        ? (activeConversation?.insurer?.companyName ?? senderParticipant.fullName ?? "Insurer")
                        : (senderParticipant?.fullName ??
                          senderParticipant?.email?.split("@")[0] ??
                          "User");
                    return (
                      <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                            mine
                              ? "bg-primary text-primary-foreground"
                              : "bg-card border border-border"
                          }`}
                        >
                          <p className={`text-xs mb-1 ${mine ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                            {mine ? "You" : senderName}
                          </p>
                          <p className="text-sm whitespace-pre-wrap">{message.body}</p>
                          {message.attachments?.length ? (
                            <div className="mt-3 space-y-2">
                              {message.attachments.map((attachment, idx) => (
                                <a
                                  key={`${attachment.fileName}-${idx}`}
                                  href={attachment.dataUrl}
                                  download={attachment.fileName}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={`block text-xs underline ${
                                    mine ? "text-primary-foreground/90" : "text-primary"
                                  }`}
                                >
                                  {attachment.fileName}
                                </a>
                              ))}
                            </div>
                          ) : null}
                          <div
                            className={`text-[11px] mt-2 ${mine ? "opacity-80" : "text-muted-foreground"}`}
                          >
                            {new Date(message.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t border-border space-y-3 shrink-0">
                {pendingFiles.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {pendingFiles.map((file) => (
                      <span
                        key={`${file.name}-${file.size}`}
                        className="px-2 py-1 text-xs rounded bg-muted border border-border"
                      >
                        {file.name}
                      </span>
                    ))}
                  </div>
                ) : null}
                <div className="flex gap-3">
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void sendMessage();
                      }
                    }}
                    placeholder="Type a message..."
                    className="flex-1 min-h-12 max-h-32 px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  />
                  <label className="px-3 py-3 border border-border rounded-xl cursor-pointer hover:bg-accent self-end">
                    <Paperclip className="w-5 h-5" />
                    <input
                      type="file"
                      className="sr-only"
                      multiple
                      accept=".pdf,image/*"
                      onChange={(event) => {
                        const files = Array.from(event.target.files ?? []).slice(0, 3);
                        setPendingFiles(files);
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => void sendMessage()}
                    disabled={sending || (!draft.trim() && pendingFiles.length === 0)}
                    className="px-5 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 self-end"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : onSupportTab && !existingSupportConversation ? (
            <SupportChatCta
              onClick={() => void openSupportChat()}
              disabled={creatingSupport}
              label={creatingSupport ? "Starting…" : "Chat with us"}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground min-h-0">
              <MessageSquare className="w-16 h-16 mb-4 opacity-60" />
              <h2 className="text-xl font-semibold text-foreground mb-2">Select a conversation</h2>
              <p>Choose a thread to begin messaging.</p>
            </div>
          )}
        </div>
      </div>
    </ChatShell>
  );

  return <div className="flex flex-col flex-1 min-h-0">{panel}</div>;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

type MessagesLocationState = {
  defaultConversation?: {
    type: ConversationType;
    insurerProfileId?: string;
    purchaseId?: string;
    subject?: string;
    initialMessage?: string;
  };
  focusConversationId?: string;
  tab?: SeekerTab | ProviderTab;
  openSupport?: boolean;
};

export function MessagesPage() {
  const location = useLocation();
  const state = location.state as MessagesLocationState | null;

  return (
    <div className="flex flex-col flex-1 min-h-0 -m-6 p-6">
      <MessagesPanel
        tabMode="seeker"
        defaultConversation={state?.defaultConversation}
        focusConversationId={state?.focusConversationId}
        initialTab={state?.tab === "support" ? "support" : undefined}
        openSupportOnMount={state?.openSupport === true}
      />
    </div>
  );
}

export function ProviderMessagesPage() {
  const location = useLocation();
  const state = location.state as MessagesLocationState | null;
  return (
    <div className="flex flex-col flex-1 min-h-0 -m-6 p-6">
      <MessagesPanel
        tabMode="provider"
        focusConversationId={state?.focusConversationId}
        initialTab={state?.tab === "support" ? "support" : undefined}
        openSupportOnMount={state?.openSupport === true}
      />
    </div>
  );
}
