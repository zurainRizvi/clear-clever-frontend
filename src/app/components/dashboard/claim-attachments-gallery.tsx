import { useState } from "react";
import { FileText, ImageIcon } from "lucide-react";
import type { ClaimStoredAttachment } from "@/lib/purchase-api";
import {
  ClaimAttachmentThumbnail,
  ClaimAttachmentViewer,
} from "./claim-attachment-viewer";

export function ClaimAttachmentsGallery({
  attachments,
  compact = false,
}: {
  attachments: ClaimStoredAttachment[];
  compact?: boolean;
}) {
  const [viewerAttachment, setViewerAttachment] = useState<ClaimStoredAttachment | null>(null);

  if (attachments.length === 0) return null;

  return (
    <>
      <div className={compact ? "space-y-2" : "space-y-3"}>
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-primary" />
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Uploaded evidence ({attachments.length})
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Click any file to view full screen or use the download icon to save a copy.
        </p>
        <div
          className={`grid gap-3 ${
            compact ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
          }`}
        >
          {attachments.map((attachment) => (
            <ClaimAttachmentThumbnail
              key={`${attachment.fileName}-${attachment.uploadedAt}`}
              attachment={attachment}
              compact={compact}
              onClick={() => setViewerAttachment(attachment)}
            />
          ))}
        </div>
        {attachments.some((a) => !a.mimeType.startsWith("image/")) ? (
          <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" />
            PDF files open in a new tab from the viewer.
          </p>
        ) : null}
      </div>
      <ClaimAttachmentViewer
        attachment={viewerAttachment}
        open={Boolean(viewerAttachment)}
        onClose={() => setViewerAttachment(null)}
      />
    </>
  );
}
