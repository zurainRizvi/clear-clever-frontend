import { useEffect, useState } from "react";
import { Bell, Check, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import {
  fetchNotifications,
  markNotificationRead,
  type AppNotification,
} from "@/lib/purchase-api";

export function NotificationsPage() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications()
      .then((data) => setItems(data.notifications))
      .catch((err) =>
        toast.error(err instanceof ApiError ? err.message : "Could not load notifications")
      )
      .finally(() => setLoading(false));
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not update notification");
    }
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
      <h1 className="text-3xl font-bold mb-6">Notifications</h1>
      <div className="space-y-3">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            className={`border rounded-xl p-4 ${item.read ? "border-border bg-card" : "border-primary/30 bg-primary/5"}`}
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
                  onClick={() => void handleMarkRead(item.id)}
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
