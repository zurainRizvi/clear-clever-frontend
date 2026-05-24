import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Building2, Loader2, MessageSquare, Send, User } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../auth-context";
import { useMessagesOptional } from "./messages-context";
import { ApiError } from "@/lib/api";
import {
  fetchConversationMessages,
  markConversationRead,
  sendConversationMessage,
  type ConversationMessage,
  type ConversationSummary,
} from "@/lib/messaging-api";
import { isConversationUnread } from "@/lib/messaging-unread";

type AdminMessageTab = "seekers" | "insurers";

function tabForConversation(conversation: ConversationSummary): AdminMessageTab | null {
  if (conversation.type === "user_support" || conversation.type === "user_insurer") {
    return "seekers";
  }
  if (conversation.type === "insurer_support") {
    return "insurers";
  }
  const other = conversation.participants.find((p) => p.role === "user" || p.role === "insurer");
  if (other?.role === "insurer") return "insurers";
  if (other?.role === "user") return "seekers";
  return null;
}

function titleForConversation(conversation: ConversationSummary, currentUserId?: string) {
  if (conversation.insurer?.companyName && conversation.type === "user_insurer") {
    return conversation.insurer.companyName;
  }
  const other = conversation.participants.find(
    (participant) => participant.id !== currentUserId && participant.role !== "admin" && participant.role !== "superadmin"
  );
  if (other) return other.fullName;
  return conversation.subject ?? "Conversation";
}

function subtitleForConversation(conversation: ConversationSummary, currentUserId?: string) {
  if (conversation.type === "user_insurer") {
    const seeker = conversation.participants.find((p) => p.role === "user");
    return seeker ? `Policy seeker · ${seeker.email}` : "Policy seeker conversation";
  }
  if (conversation.type === "user_support") {
    const seeker = conversation.participants.find((p) => p.role === "user");
    return seeker ? seeker.email : "Policy seeker support";
  }
  if (conversation.type === "insurer_support") {
    const insurer = conversation.participants.find((p) => p.role === "insurer");
    return insurer ? insurer.email : "Insurer support";
  }
  const other = conversation.participants.find((p) => p.id !== currentUserId);
  return other?.email ?? conversation.type.replace(/_/g, " ");
}

export function AdminMessagesPage() {
  const { user } = useAuth();
  const messagesContext = useMessagesOptional();
  const [tab, setTab] = useState<AdminMessageTab>("seekers");
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const allConversations = messagesContext?.conversations ?? [];
  const loadingConversations = messagesContext?.isLoading ?? true;

  const filteredConversations = useMemo(
    () => allConversations.filter((conversation) => tabForConversation(conversation) === tab),
    [allConversations, tab]
  );

  const activeConversation = useMemo(
    () => filteredConversations.find((c) => c.id === activeConversationId) ?? null,
    [activeConversationId, filteredConversations]
  );

  useEffect(() => {
    if (filteredConversations.length === 0) {
      setActiveConversationId(null);
      return;
    }
    if (!activeConversationId || !filteredConversations.some((c) => c.id === activeConversationId)) {
      setActiveConversationId(filteredConversations[0]?.id ?? null);
    }
  }, [filteredConversations, activeConversationId, tab]);

  const loadMessages = useCallback(async (conversationId: string) => {
    setLoadingMessages(true);
    setMessageError(null);
    try {
      const data = await fetchConversationMessages(conversationId);
      setMessages(data.messages);
      await markConversationRead(conversationId).catch(() => undefined);
      await messagesContext?.refreshConversations({ silent: true });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not load conversation";
      setMessageError(message);
      setMessages([]);
      toast.error(message);
    } finally {
      setLoadingMessages(false);
    }
  }, [messagesContext]);

  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      setMessageError(null);
      return;
    }
    void loadMessages(activeConversationId);
  }, [activeConversationId, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeConversationId]);

  const sendMessage = async () => {
    if (!activeConversationId || !draft.trim()) return;
    setSending(true);
    try {
      const data = await sendConversationMessage(activeConversationId, draft.trim());
      setMessages((prev) => [...prev, data.message]);
      setDraft("");
      await messagesContext?.refreshConversations({ silent: true });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not send message");
    } finally {
      setSending(false);
    }
  };

  const senderName = (senderUserId: string) => {
    const participant = activeConversation?.participants.find((p) => p.id === senderUserId);
    return participant?.fullName ?? (senderUserId === user?.id ? "You" : "User");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Messages</h1>
        <p className="text-muted-foreground">Platform conversations with policy seekers and insurers</p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab("seekers")}
          className={`px-4 py-2 rounded-xl text-sm font-medium inline-flex items-center gap-2 ${
            tab === "seekers" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}
        >
          <User className="w-4 h-4" />
          Policy seekers
        </button>
        <button
          type="button"
          onClick={() => setTab("insurers")}
          className={`px-4 py-2 rounded-xl text-sm font-medium inline-flex items-center gap-2 ${
            tab === "insurers" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}
        >
          <Building2 className="w-4 h-4" />
          Insurers
        </button>
      </div>

      <div className="grid lg:grid-cols-[320px_1fr] gap-4 min-h-[640px]">
        <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border font-medium">
            {tab === "seekers" ? "Policy seekers" : "Insurers"}
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {loadingConversations ? (
              <div className="p-6 text-center text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                Loading conversations…
              </div>
            ) : filteredConversations.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">
                No {tab === "seekers" ? "policy seeker" : "insurer"} conversations yet.
              </p>
            ) : (
              filteredConversations.map((conversation) => {
                const active = conversation.id === activeConversationId;
                const unread = isConversationUnread(conversation, user?.id);
                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => setActiveConversationId(conversation.id)}
                    className={`w-full text-left p-4 hover:bg-accent/60 transition-colors ${
                      active ? "bg-primary/5 border-l-2 border-l-primary" : ""
                    }`}
                  >
                    <div className="font-medium truncate flex items-center gap-2">
                      <span className="truncate">{titleForConversation(conversation, user?.id)}</span>
                      {unread ? <span className="w-2 h-2 rounded-full bg-primary shrink-0" /> : null}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {subtitleForConversation(conversation, user?.id)}
                    </p>
                    <p className="text-sm text-muted-foreground truncate mt-1">
                      {conversation.lastMessagePreview ?? "No messages yet"}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl flex flex-col min-h-[640px] overflow-hidden">
          {activeConversation ? (
            <>
              <div className="p-4 border-b border-border">
                <h2 className="text-lg font-semibold">
                  {titleForConversation(activeConversation, user?.id)}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {subtitleForConversation(activeConversation, user?.id)}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
                {loadingMessages ? (
                  <div className="flex justify-center py-16">
                    <Loader2 className="w-7 h-7 animate-spin text-primary" />
                  </div>
                ) : messageError ? (
                  <div className="text-center py-16 text-destructive text-sm">{messageError}</div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground text-sm">
                    No messages in this thread yet. Send the first reply below.
                  </div>
                ) : (
                  messages.map((message) => {
                    const mine = message.senderUserId === user?.id;
                    return (
                      <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] ${mine ? "items-end" : "items-start"} flex flex-col gap-1`}>
                          <span className="text-[11px] text-muted-foreground px-1">
                            {mine ? "You" : senderName(message.senderUserId)}
                          </span>
                          <div
                            className={`rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                              mine
                                ? "bg-primary text-primary-foreground"
                                : "bg-background border border-border"
                            }`}
                          >
                            {message.body}
                          </div>
                          <span className="text-[10px] text-muted-foreground px-1">
                            {new Date(message.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t border-border flex gap-2">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void sendMessage();
                    }
                  }}
                  placeholder="Write a reply…"
                  className="flex-1 min-h-11 max-h-28 px-4 py-3 bg-input-background border border-border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button
                  type="button"
                  onClick={() => void sendMessage()}
                  disabled={sending || !draft.trim()}
                  className="px-4 py-3 bg-primary text-primary-foreground rounded-xl disabled:opacity-50 self-end"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
              <MessageSquare className="w-14 h-14 mb-3 opacity-50" />
              <p>Select a conversation to view messages</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
