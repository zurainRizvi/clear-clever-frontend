import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Bell, HelpCircle, ImageIcon, Mail, Phone, Shield, User } from "lucide-react";
import { toast } from "sonner";
import { useAuth, useLogout } from "../auth-context";
import { DarkModeToggle } from "../dark-mode-toggle";

const PROFILE_PHOTO_KEY = "clearclever.profilePhoto";
const NOTIFICATIONS_KEY = "clearclever.notificationPrefs";

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

export function SeekerSettingsPage() {
  const { user, userName, userEmail } = useAuth();
  const handleLogout = useLogout();
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationPrefs>(DEFAULT_NOTIFICATIONS);

  useEffect(() => {
    setProfilePhoto(localStorage.getItem(PROFILE_PHOTO_KEY));
    try {
      const stored = localStorage.getItem(NOTIFICATIONS_KEY);
      if (stored) setNotifications({ ...DEFAULT_NOTIFICATIONS, ...JSON.parse(stored) });
    } catch {
      /* ignore invalid stored prefs */
    }
  }, []);

  const saveNotifications = (next: NotificationPrefs) => {
    setNotifications(next);
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(next));
    toast.success("Notification preferences saved");
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
    reader.onload = () => {
      const nextPhoto = String(reader.result);
      localStorage.setItem(PROFILE_PHOTO_KEY, nextPhoto);
      setProfilePhoto(nextPhoto);
      toast.success("Profile photo updated");
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    localStorage.removeItem(PROFILE_PHOTO_KEY);
    setProfilePhoto(null);
    toast.success("Profile photo removed");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Settings</h1>
        <p className="text-muted-foreground">Manage your profile, preferences, and account options.</p>
      </div>

      <section className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          Profile
        </h2>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
            {profilePhoto ? (
              <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-8 h-8 text-primary" />
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
                onClick={removePhoto}
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
            <span>{userName ?? "—"}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="w-4 h-4 shrink-0" />
            <span>{userEmail ?? "—"}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="w-4 h-4 shrink-0" />
            <span>{user?.phone ?? "—"}</span>
          </div>
        </div>
      </section>

      <section className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          Notifications
        </h2>
        {(
          [
            ["emailUpdates", "Email updates", "Product news and policy tips"],
            ["claimAlerts", "Claim alerts", "Status changes on your claims"],
            ["policyReminders", "Policy reminders", "Renewal and coverage reminders"],
          ] as const
        ).map(([key, title, description]) => (
          <label key={key} className="flex items-start justify-between gap-4 cursor-pointer">
            <div>
              <div className="font-medium text-sm">{title}</div>
              <div className="text-xs text-muted-foreground">{description}</div>
            </div>
            <input
              type="checkbox"
              checked={notifications[key]}
              onChange={(e) =>
                saveNotifications({ ...notifications, [key]: e.target.checked })
              }
              className="mt-1 h-4 w-4 accent-primary"
            />
          </label>
        ))}
      </section>

      <section className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Appearance & security
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-sm">Theme</div>
            <div className="text-xs text-muted-foreground">Switch between light and dark mode</div>
          </div>
          <DarkModeToggle />
        </div>
        <p className="text-xs text-muted-foreground">
          Password changes are handled through email verification. Contact support if you need help
          accessing your account.
        </p>
      </section>

      <section className="bg-card border border-border rounded-xl p-6 flex flex-wrap gap-3">
        <Link
          to="/dashboard/support"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-border rounded-lg hover:bg-accent"
        >
          <HelpCircle className="w-4 h-4" />
          Open support chat
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="px-4 py-2 text-sm text-destructive border border-destructive/30 rounded-lg hover:bg-destructive/10"
        >
          Sign out
        </button>
      </section>
    </div>
  );
}
