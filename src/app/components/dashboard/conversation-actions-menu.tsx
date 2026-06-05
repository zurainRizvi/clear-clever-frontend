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
import { ActionConfirmDialog } from "./action-confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import type { UserRole } from "@/lib/types";

interface ConversationActionsMenuProps {
  conversation: ConversationSummary;
  currentUserId?: string;
  viewerRole?: UserRole;
  onUpdated?: () => void | Promise<void>;
  onDeleted?: () => void | Promise<void>;
  className?: string;
}

export function ConversationActionsMenu({
  conversation,
  currentUserId,
  viewerRole,
  onUpdated,
  onDeleted,
  className,
}: ConversationActionsMenuProps) {
  const [busy, setBusy] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  const currentTitle = titleForConversation(conversation, currentUserId, viewerRole);

  const openRenameDialog = () => {
    setRenameValue(currentTitle);
    setRenameOpen(true);
  };

  const confirmRename = async () => {
    const trimmed = renameValue.trim();
    if (!trimmed) {
      toast.error("Name cannot be empty");
      return;
    }
    if (trimmed === currentTitle) {
      setRenameOpen(false);
      return;
    }

    setBusy(true);
    try {
      await updateConversationDisplayTitle(conversation.id, trimmed);
      await onUpdated?.();
      toast.success("Conversation renamed");
      setRenameOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not rename conversation");
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await deleteConversation(conversation.id);
      await onDeleted?.();
      toast.success("Conversation deleted");
      setDeleteOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not delete conversation");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
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
          <DropdownMenuItem onClick={openRenameDialog}>
            <Pencil className="w-4 h-4" />
            Rename conversation
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="w-4 h-4" />
            Delete conversation
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={renameOpen} onOpenChange={(open) => !open && !busy && setRenameOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename conversation</DialogTitle>
            <DialogDescription>
              This name is only visible to you and does not change how others see the thread.
            </DialogDescription>
          </DialogHeader>
          <input
            type="text"
            value={renameValue}
            onChange={(event) => setRenameValue(event.target.value)}
            maxLength={120}
            autoFocus
            className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="Conversation name"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void confirmRename();
              }
            }}
          />
          <DialogFooter className="gap-2 sm:gap-0">
            <button
              type="button"
              onClick={() => setRenameOpen(false)}
              disabled={busy}
              className="px-4 py-2 border border-border rounded-xl hover:bg-accent disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void confirmRename()}
              disabled={busy}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "Saving…" : "Save"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ActionConfirmDialog
        open={deleteOpen}
        title="Delete conversation?"
        description="Delete this conversation and all of its messages? This cannot be undone."
        confirmLabel="Delete"
        confirmTone="destructive"
        loading={busy}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteOpen(false)}
      />
    </>
  );
}
