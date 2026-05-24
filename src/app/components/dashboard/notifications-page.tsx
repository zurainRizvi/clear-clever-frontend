import { Bell, Check, Loader2, Trash2 } from "lucide-react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useNotifications } from "./notifications-context";

export function NotificationsPage() {
  const navigate = useNavigate();
  const {
    notifications: items,
    unreadCount,
    isLoading: loading,
    markRead,
    markAllRead,
    clearAll,
  } = useNotifications();

  const handleOpen = async (item: (typeof items)[number]) => {
    try {
      if (!item.read) await markRead(item.id);
      if (item.target) {
        navigate(`${item.target.path}?focus=${encodeURIComponent(item.target.focusId)}`);
      }
    } catch (err) {
      toast.error("Could not open notification");
    }
  };

  const handleReadAll = async () => {
    await markAllRead();
    toast.success("All notifications marked as read");
  };

  const handleClearAll = async () => {
    await clearAll();
    toast.success("Notifications cleared");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-2xl font-bold mb-2">No notifications</h2>
        <p className="text-muted-foreground">
          Payment confirmations, insurer updates, and call reminders will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount} unread {unreadCount === 1 ? "notification" : "notifications"}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void handleReadAll()}
            disabled={unreadCount === 0}
            className="px-3 py-2 text-sm border border-border rounded-lg hover:bg-accent disabled:opacity-50"
          >
            Read all
          </button>
          <button
            type="button"
            onClick={() => void handleClearAll()}
            className="px-3 py-2 text-sm border border-border rounded-lg hover:bg-destructive/10 hover:text-destructive inline-flex items-center gap-1"
          >
            <Trash2 className="w-4 h-4" />
            Clear all
          </button>
        </div>
      </div>
      <div className="space-y-3">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            onClick={() => void handleOpen(item)}
            className={`border rounded-xl p-4 cursor-pointer transition-all hover:border-primary/40 ${item.read ? "border-border bg-card" : "border-primary/30 bg-primary/5"}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{item.body}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(item.createdAt).toLocaleString()}
                </p>
              </div>
              {!item.read && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    void markRead(item.id);
                  }}
                  className="shrink-0 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <Check className="w-3.5 h-3.5" />
                  Mark read
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
