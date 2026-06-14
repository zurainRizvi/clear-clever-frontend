import { memo } from "react";
import { CheckCheck } from "lucide-react";
import { AssistantMessageMarkdown } from "./assistant-message-markdown";
import { AssistantMessageShell } from "./assistant-message-shell";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
  attachmentNames?: string[];
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export const AssistantChatMessage = memo(function AssistantChatMessage({
  message,
}: {
  message: ChatMessage;
}) {
  if (message.role === "assistant") {
    return (
      <AssistantMessageShell>
        <AssistantMessageMarkdown content={message.content} />
      </AssistantMessageShell>
    );
  }

  return (
    <div data-message-id={message.id} className="flex flex-col items-end gap-1">
      <div className="max-w-[85%] rounded-2xl bg-primary px-4 py-3 text-[15px] font-medium text-primary-foreground">
        <p className="whitespace-pre-wrap">{message.content}</p>
        {message.attachmentNames && message.attachmentNames.length > 0 && (
          <p className="mt-1 text-xs text-white/80">📎 {message.attachmentNames.join(", ")}</p>
        )}
      </div>
      <div className="flex items-center gap-1 text-[11px] text-muted-foreground pr-1">
        <span>{formatTime(message.createdAt)}</span>
        <CheckCheck className="h-3.5 w-3.5 text-primary" />
      </div>
    </div>
  );
});
