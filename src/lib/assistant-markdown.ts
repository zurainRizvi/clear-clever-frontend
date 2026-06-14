const VISUAL_FENCE_LANGS = new Set(["chart", "stats", "compare", "json"]);

function fenceLangForVisualType(type: string): string {
  if (type === "stats") return "stats";
  if (type === "compare") return "compare";
  return "chart";
}

/** Wrap bare visual JSON objects so react-markdown can render charts/stats/cards. */
export function wrapInlineVisualJson(text: string): string {
  if (/```(?:chart|stats|compare|json)\b/i.test(text)) {
    return text;
  }

  return text.replace(
    /(^|\n)(\{\s*"type"\s*:\s*"(bar|line|pie|stats|compare)"[\s\S]*?\})(?=\n|$)/g,
    (_match, prefix: string, json: string) => {
      try {
        const parsed = JSON.parse(json) as { type?: string };
        const lang = fenceLangForVisualType(parsed.type ?? "bar");
        return `${prefix}\`\`\`${lang}\n${json}\n\`\`\``;
      } catch {
        return `${prefix}${json}`;
      }
    },
  );
}

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
      if (
        block.startsWith("#") ||
        block.startsWith("-") ||
        block.startsWith("*") ||
        block.includes("```")
      ) {
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

/** Normalize Gemini markdown and ensure visual blocks stay parseable. */
export function prepareAssistantMarkdown(text: string): string {
  let prepared = wrapInlineVisualJson(text);

  // Map ```json fences that contain visual payloads to typed fences.
  prepared = prepared.replace(
    /```json\s*\n([\s\S]*?)```/gi,
    (_match, body: string) => {
      try {
        const parsed = JSON.parse(body.trim()) as {
          type?: string;
          labels?: unknown;
          values?: unknown;
          items?: unknown;
        };
        const isVisual =
          parsed.type === "stats" ||
          parsed.type === "compare" ||
          parsed.type === "bar" ||
          parsed.type === "line" ||
          parsed.type === "pie" ||
          Array.isArray(parsed.labels) ||
          Array.isArray(parsed.values) ||
          (Array.isArray(parsed.items) &&
            parsed.items.every(
              (item) =>
                item &&
                typeof item === "object" &&
                ("label" in item || "title" in item),
            ));
        if (!isVisual) return _match;
        const lang =
          parsed.type === "stats" || parsed.type === "compare"
            ? parsed.type
            : "chart";
        return `\`\`\`${lang}\n${body.trim()}\n\`\`\``;
      } catch {
        return _match;
      }
    },
  );

  // Normalize custom visual fence tags Gemini sometimes emits.
  for (const lang of VISUAL_FENCE_LANGS) {
    prepared = prepared.replace(
      new RegExp(`\`\`\`${lang}\\s*\\n`, "gi"),
      `\`\`\`${lang === "json" ? "chart" : lang}\n`,
    );
  }

  return normalizeAssistantMarkdown(prepared);
}
