import type { AssistantHistoryTurn } from "./assistant-api";

/** Match backend assistantHistoryTrim limits. */
export const HISTORY_MAX_TURNS = 6;
export const HISTORY_MAX_CHARS_PER_TURN = 1200;

export function trimHistoryContent(
  content: string,
  maxChars = HISTORY_MAX_CHARS_PER_TURN
): string {
  const trimmed = content.trim();
  if (trimmed.length <= maxChars) return trimmed;
  return `${trimmed.slice(0, maxChars - 1)}…`;
}

export function compactHistoryForApi(
  messages: Array<{ role: "user" | "assistant"; content: string }>
): AssistantHistoryTurn[] {
  return messages
    .slice(-HISTORY_MAX_TURNS)
    .map((message) => ({
      role: message.role === "user" ? ("user" as const) : ("model" as const),
      content: trimHistoryContent(message.content),
    }))
    .filter((turn) => turn.content.length > 0);
}
