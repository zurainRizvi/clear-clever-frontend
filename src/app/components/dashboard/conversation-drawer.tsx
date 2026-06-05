import { useEffect, useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../auth-context";
import { ApiError } from "@/lib/api";
import {
  createConversation,
  fetchConversationMessages,
  sendConversationMessage,
  type ConversationMessage,
  type ConversationSummary,
  type ConversationType,
} from "@/lib/messaging-api";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";

export type ConversationDrawerRequest = {
  type: ConversationType;
  insurerProfileId?: string;
  subject?: string;
  initialMessage?: string;
};

interface ConversationDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  request: ConversationDrawerRequest | null;
}

export function ConversationDrawer({
  open,
  onOpenChange,
  title,
  description,
  request,
}: ConversationDrawerProps) {
  const { user } = useAuth();
  const [conversation, setConversation] = useState<ConversationSummary | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const requestKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open) {
      requestKeyRef.current = null;
      setConversation(null);
      setMessages([]);
      setDraft("");
      return;
    }

    if (!request || !user) return;
    const requestKey = JSON.stringify(request);
    if (requestKeyRef.current === requestKey) return;
    requestKeyRef.current = requestKey;

    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const result = await createConversation(request);
        if (cancelled) return;
        setConversation(result.conversation);
        const loaded = await fetchConversationMessages(result.conversation.id);
        if (cancelled) return;
        setMessages(loaded.messages);
      } catch (err) {
        if (cancelled) return;
        toast.error(err instanceof ApiError ? err.message : "Could not open conversation");
        onOpenChange(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, request, user, onOpenChange]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, sending]);

  const handleSend = async () => {
    const trimmed = draft.trim();
    if (!trimmed || !conversation || sending) return;

    setSending(true);
    try {
      const result = await sendConversationMessage(conversation.id, trimmed);
      setMessages((prev) => [...prev, result.message]);
      setConversation(result.conversation);
      setDraft("");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0 gap-0">
        <SheetHeader className="border-b border-border px-5 py-4 text-left">
          <SheetTitle>{title}</SheetTitle>
          {description ? <SheetDescription>{description}</SheetDescription> : null}
        </SheetHeader>

        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3 bg-muted/20">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Opening conversation…
            </div>
          ) : messages.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-12">
              Send a message to start the conversation.
            </p>
          ) : (
            messages.map((message) => {
              const mine = message.senderUserId === user?.id;
              return (
                <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                      mine
                        ? "bg-primary text-primary-foreground"
                        : "bg-card border border-border"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.body}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="border-t border-border p-4">
          <form
            className="flex items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSend();
            }}
          >
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Type your message…"
              disabled={loading || sending || !conversation}
              maxLength={2000}
              className="flex-1 min-w-0 px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <button
              type="submit"
              disabled={loading || sending || !conversation || !draft.trim()}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
              aria-label="Send message"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
