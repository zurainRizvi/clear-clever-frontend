import { useEffect, useState } from "react";
import { HelpCircle, ImageIcon, Loader2, Mail, Moon, Phone, Shield, User } from "lucide-react";
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

  const displayName = variant === "superadmin" ? "Super Admin" : userName;

  return (
    <div className="w-full space-y-6 xl:grid xl:grid-cols-2 xl:gap-6 xl:items-start xl:[&>section]:h-fit">
      <div className="xl:col-span-2">
        <h1 className="text-3xl font-bold mb-1">Settings</h1>
        <p className="text-muted-foreground">
          {variant === "superadmin"
            ? "Super Admin account preferences, appearance, and session controls"
            : "Manage your admin account preferences"}
        </p>
      </div>

      <section className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          Profile
        </h2>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
            {profilePhoto ? (
              <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-7 h-7 text-primary" />
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg cursor-pointer hover:bg-primary/90">
              <ImageIcon className="w-4 h-4" />
              Upload photo
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => handlePhotoUpload(e.target.files?.[0])}
              />
            </label>
            {profilePhoto ? (
              <button
                type="button"
                onClick={() => void removePhoto()}
                className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-accent"
              >
                Remove photo
              </button>
            ) : null}
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="w-4 h-4 shrink-0" />
            <span>{displayName ?? "—"}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="w-4 h-4 shrink-0" />
            <span>{userEmail ?? "—"}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="w-4 h-4 shrink-0" />
            <span>{user?.phone ?? "—"}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Shield className="w-4 h-4 shrink-0" />
            <span>Role: {variant === "superadmin" ? "Super Admin" : titleCase(user.role)}</span>
          </div>
        </div>
      </section>

      <section className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Moon className="w-5 h-5 text-primary" />
          {variant === "superadmin" ? "Appearance & theme" : "Appearance"}
        </h2>
        <div className="flex items-center justify-between p-4 bg-accent/30 rounded-xl">
          <div>
            <div className="font-medium text-sm">Dark mode</div>
            <div className="text-xs text-muted-foreground">
              Switch between light and dark themes across the Super Admin portal
            </div>
          </div>
          <DarkModeToggle />
        </div>
        {variant === "superadmin" ? (
          <p className="text-xs text-muted-foreground">
            Theme preference is stored on this device and applies to all admin portal screens.
          </p>
        ) : null}
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

      {variant === "superadmin" ? (
        <section className="bg-card border border-border rounded-xl p-6 space-y-3 xl:col-span-2">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            Super Admin reminders
          </h2>
          <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
            <li>Provider deletion permanently removes all insurer data from the database.</li>
            <li>Employee admins cannot access provider removal or permanent delete actions.</li>
            <li>Use sign out when leaving a shared workstation.</li>
          </ul>
        </section>
      ) : null}

      <section className="bg-card border border-border rounded-xl p-6 flex flex-wrap items-center justify-between gap-4 xl:col-span-2">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-primary" />
            Account
          </h2>
          <p className="text-sm text-muted-foreground">
            Signed in as {userEmail}. Use sign out to end your session on this device.
          </p>
        </div>
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
