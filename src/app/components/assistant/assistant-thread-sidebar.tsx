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
    <aside className="flex w-[148px] shrink-0 flex-col border-r border-slate-200 bg-slate-100/80 dark:border-slate-700 dark:bg-slate-900/80">
      <div className="border-b border-slate-200 p-2 dark:border-slate-700">
        <button
          type="button"
          onClick={onNewThread}
          className="flex w-full items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors"
        >
          <MessageSquarePlus className="h-4 w-4 shrink-0" />
          New chat
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1">
        {threads.length === 0 ? (
          <p className="px-2 py-3 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
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
                      ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100"
                      : "text-slate-600 hover:bg-white/70 dark:text-slate-300 dark:hover:bg-slate-800/70"
                  }`}
                  title={thread.title}
                >
                  <span className="line-clamp-2">{thread.title}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteThread(thread.id)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 opacity-0 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-opacity"
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
