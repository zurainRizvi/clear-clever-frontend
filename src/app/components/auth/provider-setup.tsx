import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Building2, Shield, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { BackToHomeLink } from "./back-to-home";
import { DarkModeToggle } from "../dark-mode-toggle";
import { useAuth } from "../auth-context";
import { routeForInsurer } from "@/lib/auth-api";
import { ApiError } from "@/lib/api";
import { createInsurerProfile } from "@/lib/insurer-api";
import { slugifyName } from "@/lib/provider-utils";

export function ProviderSetup() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [companyName, setCompanyName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [contactPhone, setContactPhone] = useState(user?.phone ?? "");
  const [description, setDescription] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const target = routeForInsurer(user);
    if (target !== "/provider-setup") {
      navigate(target, { replace: true });
    }
  }, [navigate, user]);

  useEffect(() => {
    if (!slugTouched) {
      setSlug(slugifyName(companyName));
    }
  }, [companyName, slugTouched]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!companyName.trim() || !slug.trim() || !contactPhone.trim()) {
      toast.error("Company name, portal slug, and contact phone are required.");
      return;
    }

    setSubmitting(true);
    try {
      await createInsurerProfile({
        companyName: companyName.trim(),
        slug: slug.trim(),
        contactPhone: contactPhone.trim(),
        description: description.trim() || undefined,
        websiteUrl: websiteUrl.trim() || undefined,
      });
      await refreshUser();
      toast.success("Provider profile submitted for review");
      navigate("/provider-pending", { replace: true });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not create provider profile");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user || routeForInsurer(user) !== "/provider-setup") {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background relative">
      <div className="absolute top-6 left-6">
        <BackToHomeLink />
      </div>
      <div className="absolute top-6 right-6">
        <DarkModeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl font-[Poppins]">ClearClever</span>
          </Link>
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Set up your provider portal</h1>
          <p className="text-muted-foreground">
            Tell us about your company. We&apos;ll add sample policies for home, auto, life, and pet
            that you can edit after approval.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm"
        >
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Company name</span>
            <input
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5"
              placeholder="Acme Insurance Pakistan"
              required
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Portal slug</span>
            <input
              value={slug}
              onChange={(event) => {
                setSlugTouched(true);
                setSlug(event.target.value);
              }}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 font-mono text-sm"
              placeholder="acme-insurance"
              required
            />
            <span className="text-xs text-muted-foreground">
              Used in your public provider URL. Lowercase letters, numbers, and hyphens only.
            </span>
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Contact phone</span>
            <input
              value={contactPhone}
              onChange={(event) => setContactPhone(event.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5"
              placeholder="+923001234567"
              required
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Company description</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 min-h-[96px]"
              placeholder="Brief overview of your insurance products and service areas."
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Website (optional)</span>
            <input
              value={websiteUrl}
              onChange={(event) => setWebsiteUrl(event.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5"
              placeholder="https://www.example.com"
            />
          </label>

          <div className="rounded-xl bg-accent/40 border border-border px-4 py-3 text-sm text-muted-foreground">
            After you submit, a Super Admin will review your application. Once approved, you can
            sign in and customize the four starter policies before submitting them for listing.
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                Submit for review
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
