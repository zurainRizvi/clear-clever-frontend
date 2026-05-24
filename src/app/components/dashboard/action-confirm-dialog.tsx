import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

interface ActionConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  confirmTone?: "default" | "destructive" | "success";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}

export function ActionConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  confirmTone = "default",
  loading = false,
  onConfirm,
  onCancel,
  children,
}: ActionConfirmDialogProps) {
  const confirmClass =
    confirmTone === "destructive"
      ? "bg-destructive text-destructive-foreground hover:opacity-90"
      : confirmTone === "success"
        ? "bg-success text-white hover:opacity-90"
        : "bg-primary text-primary-foreground hover:opacity-90";

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
        <DialogFooter className="gap-2 sm:gap-0">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 border border-border rounded-xl hover:bg-accent disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-xl disabled:opacity-50 ${confirmClass}`}
          >
            {loading ? "Please wait…" : confirmLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
