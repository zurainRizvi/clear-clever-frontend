import { useEffect, useState } from "react";
import { Building2, HelpCircle, ImageIcon, Loader2, Mail, Phone } from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { updateInsurerProfile } from "@/lib/insurer-api";
import { useProvider } from "./provider-context";
import { useAuth, useLogout } from "../auth-context";
import { InsurerAvatar } from "./insurer-avatar";

export function ProviderSettingsPage() {
  const { profile, loading, setProfile } = useProvider();
  const { userEmail } = useAuth();
  const handleLogout = useLogout();
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [description, setDescription] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setContactEmail(profile.contactEmail);
    setContactPhone(profile.contactPhone);
    setDescription(profile.description ?? "");
    setProfilePhoto(profile.profilePhotoDataUrl ?? null);
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
        const data = await updateInsurerProfile({ profilePhotoDataUrl: nextPhoto });
        setProfile(data.profile);
        toast.success("Company profile photo updated");
      } catch (err) {
        setProfilePhoto(profile?.profilePhotoDataUrl ?? null);
        toast.error(err instanceof ApiError ? err.message : "Could not save profile photo");
      }
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = async () => {
    setProfilePhoto(null);
    try {
      const data = await updateInsurerProfile({ profilePhotoDataUrl: null });
      setProfile(data.profile);
      toast.success("Company profile photo removed");
    } catch (err) {
      setProfilePhoto(profile?.profilePhotoDataUrl ?? null);
      toast.error(err instanceof ApiError ? err.message : "Could not remove profile photo");
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
    <div className="w-full space-y-6 xl:grid xl:grid-cols-2 xl:gap-6 xl:items-start xl:[&>section]:h-fit">
      <div className="xl:col-span-2">
        <h1 className="text-3xl font-bold mb-1">Settings</h1>
        <p className="text-muted-foreground">Manage your insurer company profile</p>
      </div>

      <section className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          Company information
        </h2>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <InsurerAvatar
            insurer={{
              companyName: profile?.companyName,
              profilePhotoDataUrl: profilePhoto,
            }}
            size="lg"
          />
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

      <section className="bg-card border border-border rounded-xl p-6 flex flex-wrap gap-3 xl:col-span-2">
        <Link
          to="/provider-dashboard/messages"
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
