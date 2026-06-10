import { FileText, ImageIcon } from "lucide-react";
import type { ClaimStoredAttachment } from "@/lib/purchase-api";

function attachmentDataUrl(attachment: ClaimStoredAttachment): string | undefined {
  if (!attachment.mimeType.startsWith("image/")) return undefined;
  return `data:${attachment.mimeType};base64,${attachment.dataBase64}`;
}

export function ClaimAttachmentsGallery({
  attachments,
  compact = false,
}: {
  attachments: ClaimStoredAttachment[];
  compact?: boolean;
}) {
  if (attachments.length === 0) return null;

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Uploaded evidence ({attachments.length})
      </p>
      <div className={`grid gap-3 ${compact ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"}`}>
        {attachments.map((attachment) => {
          const preview = attachmentDataUrl(attachment);
          return (
            <a
              key={`${attachment.fileName}-${attachment.uploadedAt}`}
              href={
                preview ??
                `data:${attachment.mimeType};base64,${attachment.dataBase64}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-xl border border-border bg-muted/20 overflow-hidden hover:border-primary/40 transition-colors"
            >
              <div className="aspect-[4/3] bg-muted/40 flex items-center justify-center">
                {preview ? (
                  <img
                    src={preview}
                    alt={attachment.fileName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FileText className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <div className="px-2.5 py-2 flex items-center gap-1.5 min-w-0">
                {attachment.mimeType.startsWith("image/") ? (
                  <ImageIcon className="w-3.5 h-3.5 shrink-0 text-primary" />
                ) : (
                  <FileText className="w-3.5 h-3.5 shrink-0 text-primary" />
                )}
                <span className="text-xs truncate text-foreground/90">{attachment.fileName}</span>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
