import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { ClearCleverLogo } from "./auth/clearclever-logo";
import { ApiError } from "@/lib/api";
import {
  submitPublicSupportContact,
  type SupportInquiryReason,
  type SupportInquiryRole,
} from "@/lib/support-api";

export function PublicSupportFormPage({ title = "Contact Us" }: { title?: string }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [roleLabel, setRoleLabel] = useState<SupportInquiryRole>("policy_seeker");
  const [reason, setReason] = useState<SupportInquiryReason>("policy");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (fullName.trim().length < 2) return toast.error("Enter your name");
    if (!email.includes("@")) return toast.error("Enter a valid email");
    if (message.trim().length < 10) return toast.error("Message must be at least 10 characters");

    setSubmitting(true);
    try {
      await submitPublicSupportContact({
        fullName: fullName.trim(),
        email: email.trim(),
        roleLabel,
        reason,
        message: message.trim(),
      });
      toast.success("Message sent. Our support team will contact you soon.");
      setMessage("");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not send support request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground px-6 py-10">
      <div className="max-w-3xl mx-auto rounded-2xl border border-border bg-card p-6 md:p-8">
        <ClearCleverLogo className="mb-5" />
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-muted-foreground mt-2 mb-6">
          Reach our team for policy guidance, partnership, technical, and account questions.
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your name"
            className="w-full px-4 py-3 bg-input-background border border-border rounded-xl"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full px-4 py-3 bg-input-background border border-border rounded-xl"
          />
          <div className="grid sm:grid-cols-2 gap-3">
            <select
              value={roleLabel}
              onChange={(e) => setRoleLabel(e.target.value as SupportInquiryRole)}
              className="w-full px-4 py-3 bg-input-background border border-border rounded-xl"
            >
              <option value="policy_seeker">Policy seeker</option>
              <option value="insurance_provider">Insurance provider</option>
            </select>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as SupportInquiryReason)}
              className="w-full px-4 py-3 bg-input-background border border-border rounded-xl"
            >
              <option value="policy">Policy or coverage question</option>
              <option value="technical">Technical issue</option>
              <option value="billing">Billing or payment</option>
              <option value="account">Account access</option>
              <option value="other">Other</option>
            </select>
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            placeholder="Tell us how we can help..."
            className="w-full px-4 py-3 bg-input-background border border-border rounded-xl resize-none"
          />
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send message
          </button>
        </form>
      </div>
    </main>
  );
}
