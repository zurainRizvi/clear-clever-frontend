import { useEffect } from "react";
import { Download, X, ZoomIn } from "lucide-react";
import type { ClaimStoredAttachment } from "@/lib/purchase-api";

export function resolveAttachmentUrl(attachment: ClaimStoredAttachment): string {
  const raw = attachment as ClaimStoredAttachment & { dataUrl?: string };
  if (raw.dataUrl?.startsWith("data:")) return raw.dataUrl;
  if (attachment.dataBase64) {
    const base64 = attachment.dataBase64.includes(",")
      ? attachment.dataBase64.split(",")[1]!
      : attachment.dataBase64;
    return `data:${attachment.mimeType};base64,${base64}`;
  }
  return "";
}

export function isImageAttachment(attachment: ClaimStoredAttachment): boolean {
  return attachment.mimeType.startsWith("image/");
}

export function ClaimAttachmentViewer({
  attachment,
  open,
  onClose,
}: {
  attachment: ClaimStoredAttachment | null;
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !attachment) return null;

  const url = resolveAttachmentUrl(attachment);
  const isImage = isImageAttachment(attachment);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black/90">
      <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/10 text-white">
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{attachment.fileName}</p>
          <p className="text-xs text-white/60">
            Uploaded {new Date(attachment.uploadedAt).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={url}
            download={attachment.fileName}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Download
          </a>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20"
            aria-label="Close viewer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>
      <div className="flex-1 overflow-auto flex items-center justify-center p-4 sm:p-8">
        {isImage && url ? (
          <img
            src={url}
            alt={attachment.fileName}
            className="max-w-full max-h-[calc(100vh-120px)] object-contain rounded-lg shadow-2xl"
          />
        ) : (
          <div className="text-center text-white max-w-md">
            <p className="text-lg font-semibold mb-2">PDF document</p>
            <p className="text-sm text-white/70 mb-4">
              Open or download this file to view the full document.
            </p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium"
            >
              Open in new tab
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export function ClaimAttachmentThumbnail({
  attachment,
  onClick,
  compact = false,
}: {
  attachment: ClaimStoredAttachment;
  onClick: () => void;
  compact?: boolean;
}) {
  const url = resolveAttachmentUrl(attachment);
  const isImage = isImageAttachment(attachment);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-xl border border-border bg-muted/20 overflow-hidden hover:border-primary/50 hover:shadow-md transition-all text-left w-full"
    >
      <div className={`relative bg-muted/40 flex items-center justify-center ${compact ? "aspect-[4/3]" : "aspect-[5/4]"}`}>
        {isImage && url ? (
          <img
            src={url}
            alt={attachment.fileName}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground p-4">
            <Download className="w-8 h-8" />
            <span className="text-xs font-medium">PDF document</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
        </div>
      </div>
      <div className="px-2.5 py-2 flex items-center justify-between gap-2 min-w-0">
        <span className="text-xs truncate text-foreground/90">{attachment.fileName}</span>
        <a
          href={url}
          download={attachment.fileName}
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
          aria-label={`Download ${attachment.fileName}`}
        >
          <Download className="w-3.5 h-3.5" />
        </a>
      </div>
    </button>
  );
}
