import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router";
import { MessageSquare, Paperclip, Send, Shield, User } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../auth-context";
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

function titleForConversation(conversation: ConversationSummary, currentUserId?: string) {
  if (conversation.insurer?.companyName) return conversation.insurer.companyName;
  const other = conversation.participants.find((participant) => participant.id !== currentUserId);
  if (other) return other.fullName;
  if (conversation.type === "user_support") return "ClearClever Support";
  if (conversation.type === "insurer_support") return "Provider Support";
  if (conversation.type === "internal_admin") return "Internal Staff Chat";
  return conversation.subject ?? "Conversation";
}

function typeLabel(type: ConversationType) {
  return type.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function MessagesPanel({
  defaultConversation,
  autoStartSupport = false,
}: {
  defaultConversation?: {
    type: ConversationType;
    insurerProfileId?: string;
    purchaseId?: string;
    subject?: string;
    initialMessage?: string;
  };
  autoStartSupport?: boolean;
}) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [creatingSupport, setCreatingSupport] = useState(false);
  const [sending, setSending] = useState(false);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) ?? null,
    [activeConversationId, conversations]
  );

  const loadConversations = async () => {
    setLoadingConversations(true);
    try {
      const data = await fetchConversations();
      setConversations(data.conversations);
      setActiveConversationId((current) => current ?? data.conversations[0]?.id ?? null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not load messages");
    } finally {
      setLoadingConversations(false);
    }
  };

  useEffect(() => {
    void loadConversations();
  }, []);

  useEffect(() => {
    if (!defaultConversation) return;

    let cancelled = false;
    async function ensureDefaultConversation() {
      try {
        const data = await createConversation(defaultConversation);
        if (cancelled) return;
        setConversations((prev) =>
          prev.some((conversation) => conversation.id === data.conversation.id)
            ? prev
            : [data.conversation, ...prev]
        );
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

  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    let cancelled = false;
    async function loadMessages() {
      setLoadingMessages(true);
      try {
        const data = await fetchConversationMessages(activeConversationId);
        if (cancelled) return;
        setMessages(data.messages);
        await markConversationRead(activeConversationId).catch(() => undefined);
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof ApiError ? err.message : "Could not load conversation");
        }
      } finally {
        if (!cancelled) setLoadingMessages(false);
      }
    }

    void loadMessages();
    const interval = window.setInterval(() => void loadMessages(), 15000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [activeConversationId]);

  useEffect(() => {
    if (!autoStartSupport || loadingConversations) return;
    if (conversations.some((conversation) => conversation.type.includes("support"))) return;
    void startSupportConversation();
  }, [autoStartSupport, loadingConversations, conversations]);

  const startSupportConversation = async () => {
    if (!user) return;
    const type: ConversationType = user.role === "insurer" ? "insurer_support" : "user_support";
    setCreatingSupport(true);
    try {
      const data = await createConversation({
        type,
        subject: "ClearClever support",
        initialMessage: "Hi ClearClever support, I need help with a query.",
      });
      setConversations((prev) =>
        prev.some((conversation) => conversation.id === data.conversation.id)
          ? prev
          : [data.conversation, ...prev]
      );
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
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === data.conversation.id ? data.conversation : conversation
        )
      );
      setDraft("");
      setPendingFiles([]);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-[320px_1fr] gap-6">
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Messages</h2>
            <p className="text-sm text-muted-foreground">Insurers, support, and staff chats</p>
          </div>
          <button
            type="button"
            onClick={startSupportConversation}
            disabled={creatingSupport}
            className="px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg disabled:opacity-50"
          >
            Support
          </button>
        </div>

        <div className="divide-y divide-border max-h-[620px] overflow-y-auto">
          {loadingConversations ? (
            <div className="p-6 text-center text-muted-foreground">Loading conversations...</div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              No conversations yet. Start a support chat or contact an insurer from a purchase.
            </div>
          ) : (
            conversations.map((conversation) => {
              const active = conversation.id === activeConversationId;
              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => setActiveConversationId(conversation.id)}
                  className={`w-full text-left p-4 hover:bg-accent transition-colors ${
                    active ? "bg-primary/5" : ""
                  }`}
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
                      <div className="font-medium truncate">
                        {titleForConversation(conversation, user?.id)}
                      </div>
                      <div className="text-xs text-muted-foreground mb-1">
                        {typeLabel(conversation.type)}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.lastMessagePreview ?? conversation.subject ?? "No messages yet"}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl min-h-[620px] flex flex-col overflow-hidden">
        {activeConversation ? (
          <>
            <div className="p-5 border-b border-border">
              <h2 className="text-xl font-semibold">
                {titleForConversation(activeConversation, user?.id)}
              </h2>
              <p className="text-sm text-muted-foreground">
                {activeConversation.subject ?? typeLabel(activeConversation.type)}
              </p>
            </div>

            <div className="flex-1 p-5 space-y-3 overflow-y-auto bg-muted/20">
              {loadingMessages ? (
                <div className="text-center text-muted-foreground py-10">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-10">
                  No messages yet. Send the first message below.
                </div>
              ) : (
                messages.map((message) => {
                  const mine = message.senderUserId === user?.id;
                  return (
                    <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                          mine
                            ? "bg-primary text-primary-foreground"
                            : "bg-card border border-border"
                        }`}
                      >
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
                        <div className={`text-[11px] mt-2 ${mine ? "opacity-80" : "text-muted-foreground"}`}>
                          {new Date(message.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 border-t border-border space-y-3">
              {pendingFiles.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {pendingFiles.map((file) => (
                    <span key={`${file.name}-${file.size}`} className="px-2 py-1 text-xs rounded bg-muted border border-border">
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
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
            <MessageSquare className="w-16 h-16 mb-4 opacity-60" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Select a conversation</h2>
            <p>Choose a thread or start a support chat to begin messaging.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

export function MessagesPage() {
  const location = useLocation();
  const state = location.state as
    | {
        defaultConversation?: {
          type: ConversationType;
          insurerProfileId?: string;
          purchaseId?: string;
          subject?: string;
          initialMessage?: string;
        };
      }
    | null;

  return <MessagesPanel defaultConversation={state?.defaultConversation} />;
}
