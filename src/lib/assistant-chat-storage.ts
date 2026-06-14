export type StoredChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  attachmentNames?: string[];
};

export type AssistantChatThread = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: StoredChatMessage[];
};

export type AssistantChatStore = {
  activeThreadId: string | null;
  threads: AssistantChatThread[];
};

const MAX_THREADS = 30;
const STORAGE_VERSION = 1;

function storageKey(userId: string, role: string): string {
  return `clearclever:assistant:v${STORAGE_VERSION}:${userId}:${role}`;
}

function defaultStore(): AssistantChatStore {
  return { activeThreadId: null, threads: [] };
}

export function loadAssistantChatStore(userId: string, role: string): AssistantChatStore {
  if (typeof window === "undefined") return defaultStore();
  try {
    const raw = window.localStorage.getItem(storageKey(userId, role));
    if (!raw) return defaultStore();
    const parsed = JSON.parse(raw) as AssistantChatStore;
    if (!parsed || !Array.isArray(parsed.threads)) return defaultStore();
    return {
      activeThreadId: parsed.activeThreadId ?? null,
      threads: parsed.threads.filter((t) => t && typeof t.id === "string"),
    };
  } catch {
    return defaultStore();
  }
}

export function saveAssistantChatStore(
  userId: string,
  role: string,
  store: AssistantChatStore
): void {
  if (typeof window === "undefined") return;
  const trimmed: AssistantChatStore = {
    activeThreadId: store.activeThreadId,
    threads: store.threads
      .slice()
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, MAX_THREADS),
  };
  window.localStorage.setItem(storageKey(userId, role), JSON.stringify(trimmed));
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let pendingSave: { userId: string; role: string; store: AssistantChatStore } | null = null;

/** Debounce localStorage writes to avoid jank during rapid chat turns. */
export function scheduleSaveAssistantChatStore(
  userId: string,
  role: string,
  store: AssistantChatStore,
  delayMs = 300
): void {
  pendingSave = { userId, role, store };
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    if (pendingSave) {
      saveAssistantChatStore(pendingSave.userId, pendingSave.role, pendingSave.store);
      pendingSave = null;
    }
    saveTimer = null;
  }, delayMs);
}

export function flushAssistantChatStore(): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = null;
  if (pendingSave) {
    saveAssistantChatStore(pendingSave.userId, pendingSave.role, pendingSave.store);
    pendingSave = null;
  }
}

export function createAssistantThread(title = "New chat"): AssistantChatThread {
  const now = new Date().toISOString();
  return {
    id: `thread-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
}

function stripBoilerplate(text: string): string {
  return text
    .replace(/^explain why\s+/i, "")
    .replace(/^hi\s+clearclever\s*,?\s*/i, "")
    .trim();
}

export function deriveThreadTitle(messages: StoredChatMessage[]): string {
  const firstUser = messages.find((m) => m.role === "user");
  if (!firstUser?.content.trim()) return "New chat";
  const text = stripBoilerplate(firstUser.content.trim().replace(/\s+/g, " "));
  const words = text.split(" ").filter(Boolean);
  const title = words.slice(0, 6).join(" ");
  if (!title) return "New chat";
  return title.length > 36 ? `${title.slice(0, 36)}…` : title;
}

export function resolveThreadTitle(
  currentTitle: string,
  messages: StoredChatMessage[]
): string {
  if (currentTitle !== "New chat") return currentTitle;
  return deriveThreadTitle(messages);
}

export function toStoredMessages(
  messages: Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    createdAt: Date;
    attachmentNames?: string[];
  }>
): StoredChatMessage[] {
  return messages.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
    attachmentNames: m.attachmentNames,
  }));
}

export function fromStoredMessages(messages: StoredChatMessage[]) {
  return messages.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    createdAt: new Date(m.createdAt),
    attachmentNames: m.attachmentNames,
  }));
}
