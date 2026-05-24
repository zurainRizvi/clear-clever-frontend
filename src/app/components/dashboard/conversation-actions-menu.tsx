import { useState } from "react";
import { Loader2, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import {
  deleteConversation,
  updateConversationDisplayTitle,
  type ConversationSummary,
} from "@/lib/messaging-api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { titleForConversation } from "@/lib/messaging-display";

interface ConversationActionsMenuProps {
  conversation: ConversationSummary;
  currentUserId?: string;
  onUpdated?: () => void | Promise<void>;
  onDeleted?: () => void | Promise<void>;
  className?: string;
}

export function ConversationActionsMenu({
  conversation,
  currentUserId,
  onUpdated,
  onDeleted,
  className,
}: ConversationActionsMenuProps) {
  const [busy, setBusy] = useState(false);

  const renameConversation = async () => {
    const currentTitle = titleForConversation(conversation, currentUserId);
    const nextTitle = window.prompt("Rename conversation", currentTitle);
    if (nextTitle === null) return;
    const trimmed = nextTitle.trim();
    if (!trimmed) {
      toast.error("Name cannot be empty");
      return;
    }
    if (trimmed === currentTitle) return;

    setBusy(true);
    try {
      await updateConversationDisplayTitle(conversation.id, trimmed);
      await onUpdated?.();
      toast.success("Conversation renamed");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not rename conversation");
    } finally {
      setBusy(false);
    }
  };

  const removeConversation = async () => {
    const confirmed = window.confirm(
      "Delete this conversation and all of its messages? This cannot be undone."
    );
    if (!confirmed) return;

    setBusy(true);
    try {
      await deleteConversation(conversation.id);
      await onDeleted?.();
      toast.success("Conversation deleted");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not delete conversation");
    } finally {
      setBusy(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={busy}
          onClick={(event) => event.stopPropagation()}
          className={
            className ??
            "p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground disabled:opacity-50"
          }
          aria-label="Conversation options"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <MoreVertical className="w-4 h-4" />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
        <DropdownMenuItem onClick={() => void renameConversation()}>
          <Pencil className="w-4 h-4" />
          Rename conversation
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onClick={() => void removeConversation()}
        >
          <Trash2 className="w-4 h-4" />
          Delete conversation
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
