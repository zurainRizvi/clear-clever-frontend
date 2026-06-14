import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Bell, CreditCard, HelpCircle, ImageIcon, Mail, MapPin, Phone, Shield, User } from "lucide-react";
import { toast } from "sonner";
import { useAuth, useLogout } from "../auth-context";
import { DarkModeToggle } from "../dark-mode-toggle";
import { updateMeProfile } from "@/lib/auth-api";
import { CnicKycPanel } from "./cnic-kyc-panel";
import { KycStatusBadge } from "./kyc-verification-ui";

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
  const { user, userName, userEmail, refreshUser } = useAuth();
  const handleLogout = useLogout();
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationPrefs>(DEFAULT_NOTIFICATIONS);

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
    setNotifications(next);
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(next));
    try {
      await updateMeProfile({ notificationPreferences: next });
      await refreshUser();
      toast.success("Notification preferences saved");
    } catch {
      toast.error("Could not save notification preferences");
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

  return (
    <div className="w-full space-y-6 xl:grid xl:grid-cols-2 xl:gap-6 xl:items-start xl:[&>section]:h-fit">
      <div className="xl:col-span-2">
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
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="w-4 h-4 shrink-0" />
            <span>{userName ?? "—"}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="w-4 h-4 shrink-0" />
            <span>{userEmail ?? "—"}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <CreditCard className="w-4 h-4 shrink-0" />
            <span className="font-mono">{user?.cnicMasked ?? "CNIC not added yet"}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="w-4 h-4 shrink-0" />
            <span>{user?.phone ?? "—"}</span>
          </div>
        </div>
      </section>

      <section className="bg-card border border-border rounded-xl p-6 space-y-4 xl:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Identity verification
          </h2>
          {user?.kycStatus ? (
            <KycStatusBadge status={user.kycStatus} cnicOnFile={Boolean(user?.hasCnic)} />
          ) : user?.hasCnic ? (
            <KycStatusBadge status="none" cnicOnFile />
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Save your CNIC here first. Then upload a clear photo — AI cross-checks your name, CNIC
          number, and expiry against what you entered. Verified KYC is required before you can
          purchase a policy.
        </p>
        <CnicKycPanel
          initialCnic={user?.cnicMasked ?? ""}
          cnicOnFile={Boolean(user?.hasCnic)}
          onCnicSaved={() => void refreshUser()}
          onKycUpdated={() => void refreshUser()}
        />
      </section>

      <section className="bg-card border border-border rounded-xl p-6 space-y-4 xl:col-span-2">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          Address
        </h2>
        <p className="text-sm text-muted-foreground">
          Used to pre-fill checkout. KYC may auto-fill these fields from your CNIC when verified.
        </p>
        <AddressForm
          key={`${user?.id ?? "guest"}-${user?.profile?.addressLine ?? ""}-${user?.profile?.city ?? ""}`}
          initial={{
            addressLine: user?.profile?.addressLine ?? "",
            city: user?.profile?.city ?? "",
            province: user?.profile?.province ?? "",
            postalCode: user?.profile?.postalCode ?? "",
          }}
          onSaved={() => void refreshUser()}
        />
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
                void saveNotifications({ ...notifications, [key]: e.target.checked })
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

      <section className="bg-card border border-border rounded-xl p-6 flex flex-wrap gap-3 xl:col-span-2">
        <Link
          to="/dashboard/messages"
          state={{ tab: "support", openSupport: true }}
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

function AddressForm({
  initial,
  onSaved,
}: {
  initial: { addressLine: string; city: string; province: string; postalCode: string };
  onSaved: () => void;
}) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(initial);
  }, [initial.addressLine, initial.city, initial.province, initial.postalCode]);

  const save = async () => {
    setSaving(true);
    try {
      await updateMeProfile(form);
      onSaved();
      toast.success("Address saved");
    } catch {
      toast.error("Could not save address");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <label className="sm:col-span-2 block space-y-1.5">
        <span className="text-sm font-medium">Street address</span>
        <input
          type="text"
          value={form.addressLine}
          onChange={(e) => setForm({ ...form, addressLine: e.target.value })}
          className="w-full px-3 py-2.5 bg-input-background border border-border rounded-xl"
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">City</span>
        <input
          type="text"
          value={form.city}
          onChange={(e) => setForm({ ...form, city: e.target.value })}
          className="w-full px-3 py-2.5 bg-input-background border border-border rounded-xl"
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Province</span>
        <input
          type="text"
          value={form.province}
          onChange={(e) => setForm({ ...form, province: e.target.value })}
          className="w-full px-3 py-2.5 bg-input-background border border-border rounded-xl"
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Postal code (optional)</span>
        <input
          type="text"
          value={form.postalCode}
          onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
          className="w-full px-3 py-2.5 bg-input-background border border-border rounded-xl"
        />
      </label>
      <div className="sm:col-span-2">
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save address"}
        </button>
      </div>
    </div>
  );
}
