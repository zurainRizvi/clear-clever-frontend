import { MessageSquarePlus, Trash2 } from "lucide-react";
import type { AssistantChatThread } from "@/lib/assistant-chat-storage";

export function AssistantThreadSidebar({
  threads,
  activeThreadId,
  onSelectThread,
  onNewThread,
  onDeleteThread,
}: {
  threads: AssistantChatThread[];
  activeThreadId: string | null;
  onSelectThread: (threadId: string) => void;
  onNewThread: () => void;
  onDeleteThread: (threadId: string) => void;
}) {
  return (
    <aside className="flex w-[148px] shrink-0 flex-col border-r border-border bg-muted/30">
      <div className="border-b border-border p-2">
        <button
          type="button"
          onClick={onNewThread}
          className="flex w-full items-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <MessageSquarePlus className="h-4 w-4 shrink-0" />
          New chat
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1">
        {threads.length === 0 ? (
          <p className="px-2 py-3 text-[11px] leading-relaxed text-muted-foreground">
            Chats are saved on this device while you are signed in.
          </p>
        ) : (
          threads.map((thread) => {
            const active = thread.id === activeThreadId;
            return (
              <div key={thread.id} className="group relative">
                <button
                  type="button"
                  onClick={() => onSelectThread(thread.id)}
                  className={`w-full rounded-xl px-3 py-2.5 text-left text-xs leading-snug transition-colors ${
                    active
                      ? "bg-card text-foreground shadow-sm border border-border"
                      : "text-muted-foreground hover:bg-card/80 hover:text-foreground"
                  }`}
                  title={thread.title}
                >
                  <span className="line-clamp-2">{thread.title}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteThread(thread.id)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted-foreground opacity-0 hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 transition-opacity"
                  aria-label={`Delete ${thread.title}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
