/**
 * Normalizes model output so Markdown renders with visible paragraph breaks.
 */
export function normalizeAssistantMarkdown(text: string): string {
  let normalized = text.replace(/\r\n/g, "\n").trim();

  // Ensure blank line before bullet / numbered lists.
  normalized = normalized.replace(/\n([-*•] |\d+\. )/g, "\n\n$1");

  // Split long unbroken blocks (no double newline) into paragraphs at sentence boundaries.
  normalized = normalized
    .split(/\n\n+/)
    .map((block) => {
      if (block.startsWith("#") || block.startsWith("-") || block.startsWith("*")) {
        return block;
      }
      if (block.length < 280 || block.includes("\n")) {
        return block;
      }
      return block.replace(/(?<=[.!?])\s+(?=[A-Z*])/g, "\n\n");
    })
    .join("\n\n");

  return normalized;
}
