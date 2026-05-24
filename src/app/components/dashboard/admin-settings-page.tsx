import { useEffect, useState } from "react";
import { Loader2, Mail, Moon, Shield, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import { useAuth, useLogout } from "../auth-context";
import { DarkModeToggle } from "../dark-mode-toggle";
import { updateMeProfile } from "@/lib/auth-api";
import { titleCase } from "@/lib/admin-utils";

const NOTIFICATIONS_KEY = "clearclever.adminNotificationPrefs";

interface NotificationPrefs {
  emailUpdates: boolean;
  claimAlerts: boolean;
  policyReminders: boolean;
}

const DEFAULT_NOTIFICATIONS: NotificationPrefs = {
  emailUpdates: true,
  claimAlerts: true,
  policyReminders: true,
};

interface AdminSettingsPageProps {
  variant: "employee" | "superadmin";
}

export function AdminSettingsPage({ variant }: AdminSettingsPageProps) {
  const { user, userName, userEmail, refreshUser } = useAuth();
  const handleLogout = useLogout();
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationPrefs>(DEFAULT_NOTIFICATIONS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setProfilePhoto(user?.profile?.profilePhotoDataUrl ?? null);
    try {
      const stored = localStorage.getItem(NOTIFICATIONS_KEY);
      setNotifications({
        ...DEFAULT_NOTIFICATIONS,
        ...JSON.parse(stored ?? "{}"),
        ...user?.profile?.notificationPreferences,
      });
    } catch {
      setNotifications({
        ...DEFAULT_NOTIFICATIONS,
        ...user?.profile?.notificationPreferences,
      });
    }
  }, [user?.id, user?.profile?.profilePhotoDataUrl, user?.profile?.notificationPreferences]);

  const saveNotifications = async (next: NotificationPrefs) => {
    setSaving(true);
    setNotifications(next);
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(next));
    try {
      await updateMeProfile({ notificationPreferences: next });
      await refreshUser();
      toast.success("Notification preferences saved");
    } catch {
      toast.error("Could not save notification preferences");
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Profile photo must be under 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const nextPhoto = String(reader.result);
      setProfilePhoto(nextPhoto);
      try {
        await updateMeProfile({ profilePhotoDataUrl: nextPhoto });
        await refreshUser();
        toast.success("Profile photo updated");
      } catch {
        toast.error("Could not save profile photo");
      }
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = async () => {
    setProfilePhoto(null);
    try {
      await updateMeProfile({ profilePhotoDataUrl: null });
      await refreshUser();
      toast.success("Profile photo removed");
    } catch {
      toast.error("Could not remove profile photo");
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Settings</h1>
        <p className="text-muted-foreground">
          {variant === "superadmin"
            ? "Manage your super admin account preferences"
            : "Manage your admin account preferences"}
        </p>
      </div>

      <section className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          Profile
        </h2>
        <div className="flex items-center gap-4">
          <label className="relative w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center cursor-pointer overflow-hidden">
            {profilePhoto ? (
              <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-7 h-7 text-primary" />
            )}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => handlePhotoUpload(e.target.files?.[0])}
            />
          </label>
          <div className="flex-1">
            <div className="font-semibold">{userName}</div>
            <div className="text-sm text-muted-foreground">{userEmail}</div>
            <div className="text-xs text-muted-foreground mt-1">Role: {titleCase(user.role)}</div>
          </div>
          {profilePhoto ? (
            <button
              type="button"
              onClick={() => void removePhoto()}
              className="px-3 py-2 text-sm border border-destructive/30 text-destructive rounded-xl hover:bg-destructive/10 inline-flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Remove photo
            </button>
          ) : null}
        </div>
      </section>

      <section className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Moon className="w-5 h-5 text-primary" />
          Appearance
        </h2>
        <div className="flex items-center justify-between p-4 bg-accent/30 rounded-xl">
          <div>
            <div className="font-medium text-sm">Theme</div>
            <div className="text-xs text-muted-foreground">Switch between light and dark mode</div>
          </div>
          <DarkModeToggle />
        </div>
      </section>

      <section className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Mail className="w-5 h-5 text-primary" />
          Notifications
        </h2>
        {(
          [
            ["emailUpdates", "Email updates", "Platform announcements and approval summaries"],
            ["claimAlerts", "Claim alerts", "Notifications when claims need attention"],
            ["policyReminders", "Policy reminders", "Pending approval reminders"],
          ] as const
        ).map(([key, label, description]) => (
          <label
            key={key}
            className="flex items-center justify-between p-4 bg-accent/30 rounded-xl cursor-pointer"
          >
            <div>
              <div className="font-medium">{label}</div>
              <div className="text-sm text-muted-foreground">{description}</div>
            </div>
            <input
              type="checkbox"
              checked={notifications[key]}
              disabled={saving}
              onChange={(e) => void saveNotifications({ ...notifications, [key]: e.target.checked })}
              className="w-5 h-5 rounded border-border text-primary focus:ring-2 focus:ring-primary/50"
            />
          </label>
        ))}
      </section>

      <section className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Account
        </h2>
        <p className="text-sm text-muted-foreground">
          Signed in as {userEmail}. Use sign out to end your admin session on this device.
        </p>
        <button
          type="button"
          onClick={handleLogout}
          className="px-4 py-2 border border-destructive/30 text-destructive rounded-xl hover:bg-destructive/10"
        >
          Sign out
        </button>
      </section>
    </div>
  );
}
