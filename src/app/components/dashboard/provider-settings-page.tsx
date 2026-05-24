import { useEffect, useState } from "react";
import { Building2, Loader2, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { updateInsurerProfile } from "@/lib/insurer-api";
import { useProvider } from "./provider-context";
import { useAuth, useLogout } from "../auth-context";

export function ProviderSettingsPage() {
  const { profile, loading, setProfile } = useProvider();
  const { userEmail } = useAuth();
  const handleLogout = useLogout();
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setContactEmail(profile.contactEmail);
    setContactPhone(profile.contactPhone);
    setDescription(profile.description ?? "");
  }, [profile]);

  const save = async () => {
    setSaving(true);
    try {
      const data = await updateInsurerProfile({
        contactEmail,
        contactPhone,
        description,
      });
      setProfile(data.profile);
      toast.success("Company profile updated");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading && !profile) {
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
        <p className="text-muted-foreground">Manage your insurer company profile</p>
      </div>

      <section className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          Company information
        </h2>
        <div>
          <label className="block text-sm mb-2">Company name</label>
          <input
            type="text"
            value={profile?.companyName ?? ""}
            readOnly
            className="w-full px-4 py-3 bg-muted/40 border border-border rounded-xl text-muted-foreground"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Company name is managed by ClearClever admin.
          </p>
        </div>
        <div>
          <label className="block text-sm mb-2">Login email</label>
          <input
            type="email"
            value={userEmail ?? ""}
            readOnly
            className="w-full px-4 py-3 bg-muted/40 border border-border rounded-xl text-muted-foreground"
          />
        </div>
        <div>
          <label className="block text-sm mb-2 flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Public contact email
          </label>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className="w-full px-4 py-3 bg-input-background border border-border rounded-xl"
          />
        </div>
        <div>
          <label className="block text-sm mb-2 flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Contact phone
          </label>
          <input
            type="tel"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            className="w-full px-4 py-3 bg-input-background border border-border rounded-xl"
          />
        </div>
        <div>
          <label className="block text-sm mb-2">Company description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 bg-input-background border border-border rounded-xl resize-none"
          />
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-xl disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </section>

      <section className="bg-card border border-border rounded-xl p-6">
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
