import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { ClearCleverLogo } from "../auth/clearclever-logo";
import { useAuth } from "../auth-context";
import { ApiError } from "@/lib/api";
import {
  submitSupportContact,
  type SupportInquiryReason,
  type SupportInquiryRole,
} from "@/lib/support-api";
import { SupportChatCta } from "./support-chat-cta";
import { useAssistantWidget } from "../assistant/assistant-widget-context";

export function SupportHubPage({ portalRole }: { portalRole: "user" | "insurer" }) {
  const { user, userName, userEmail } = useAuth();
  const defaultRoleLabel: SupportInquiryRole =
    portalRole === "insurer" ? "insurance_provider" : "policy_seeker";

  const { openAssistant } = useAssistantWidget();

  const [fullName, setFullName] = useState(userName ?? "");
  const [email, setEmail] = useState(userEmail ?? user?.email ?? "");
  const [roleLabel, setRoleLabel] = useState<SupportInquiryRole>(defaultRoleLabel);
  const [reason, setReason] = useState<SupportInquiryReason>("technical");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (fullName.trim().length < 2) {
      toast.error("Enter your name");
      return;
    }
    if (!email.includes("@")) {
      toast.error("Enter a valid email");
      return;
    }
    if (message.trim().length < 10) {
      toast.error("Message must be at least 10 characters");
      return;
    }
    setSubmitting(true);
    try {
      await submitSupportContact({
        fullName: fullName.trim(),
        email: email.trim(),
        roleLabel,
        reason,
        message: message.trim(),
      });
      toast.success("Your message was sent. Our team will respond soon.");
      setMessage("");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not send your message");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 -m-6 p-6">
      <div className="shrink-0 mb-4">
        <h1 className="text-3xl font-bold mb-1">Support</h1>
        <p className="text-muted-foreground">
          Chat with ClearClever support or send a detailed inquiry
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        <section className="lg:w-[40%] flex flex-col min-h-0 border border-border rounded-2xl overflow-hidden bg-card">
          <SupportChatCta onClick={() => openAssistant()} />
        </section>

        <section className="lg:w-[60%] flex flex-col min-h-0 border border-border rounded-2xl overflow-hidden bg-card">
          <div className="flex-1 overflow-y-auto p-6 lg:p-8">
            <ClearCleverLogo linkToHome={false} className="mb-6" />
            <h2 className="text-2xl font-bold mb-1 font-[Poppins]">Contact us</h2>
            <p className="text-muted-foreground mb-6">
              Prefer email? Tell us how we can help and we will get back to you.
            </p>

            <form onSubmit={onSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1.5">Your name</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">I am a</label>
                <select
                  value={roleLabel}
                  onChange={(e) => setRoleLabel(e.target.value as SupportInquiryRole)}
                  className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="policy_seeker">Policy seeker</option>
                  <option value="insurance_provider">Insurance provider</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Reason</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as SupportInquiryReason)}
                  className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="billing">Billing or payment</option>
                  <option value="technical">Technical issue</option>
                  <option value="policy">Policy or coverage question</option>
                  <option value="account">Account access</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  placeholder="Describe your question or issue..."
                  className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
                Send message
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
