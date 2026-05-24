import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "../auth-context";
import { fetchConversations, type ConversationSummary } from "@/lib/messaging-api";
import { countUnreadConversations } from "@/lib/messaging-unread";

const POLL_MS = 20_000;

interface MessagesContextType {
  conversations: ConversationSummary[];
  unreadCount: number;
  isLoading: boolean;
  refreshConversations: (options?: { silent?: boolean }) => Promise<void>;
}

const MessagesContext = createContext<MessagesContextType | undefined>(undefined);

export function MessagesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const refreshConversations = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;
      if (!silent) setIsLoading(true);
      try {
        const data = await fetchConversations();
        setConversations(data.conversations);
        setUnreadCount(countUnreadConversations(data.conversations, user?.id));
      } catch {
        if (!silent) {
          setConversations([]);
          setUnreadCount(0);
        }
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [user?.id]
  );

  useEffect(() => {
    void refreshConversations();
    const interval = window.setInterval(() => void refreshConversations({ silent: true }), POLL_MS);
    return () => window.clearInterval(interval);
  }, [refreshConversations]);

  const value = useMemo(
    () => ({
      conversations,
      unreadCount,
      isLoading,
      refreshConversations,
    }),
    [conversations, unreadCount, isLoading, refreshConversations]
  );

  return <MessagesContext.Provider value={value}>{children}</MessagesContext.Provider>;
}

export function useMessages() {
  const context = useContext(MessagesContext);
  if (!context) {
    throw new Error("useMessages must be used within MessagesProvider");
  }
  return context;
}

export function useMessagesOptional() {
  return useContext(MessagesContext);
}
