import { apiRequest } from "./api";

export type SupportInquiryReason = "billing" | "technical" | "policy" | "account" | "other";
export type SupportInquiryRole = "policy_seeker" | "insurance_provider";

export async function submitSupportContact(body: {
  fullName: string;
  email: string;
  roleLabel: SupportInquiryRole;
  reason: SupportInquiryReason;
  message: string;
}): Promise<{ inquiry: { id: string; createdAt: string } }> {
  return apiRequest("/api/support/contact", {
    method: "POST",
    auth: true,
    body: JSON.stringify(body),
  });
}
