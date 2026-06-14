import { apiRequest } from "./api";

export type KycStatus = "none" | "partial" | "verified" | "failed";

export interface KycVerificationReport {
  status: KycStatus;
  source: "manual" | "upload";
  cnicMasked?: string;
  kycScore?: number;
  identityMatchScore?: number;
  identityVerified?: boolean;
  nameMatch?: boolean;
  cnicMatch?: boolean;
  profileMatchesDocument?: boolean;
  documentReadable?: boolean;
  cnicExpired?: boolean;
  genderPredicted?: "male" | "female";
  province?: string;
  district?: string;
  regionSlug?: string;
  age?: number;
  isAdult?: boolean;
  extractedFullName?: string;
  extractedFatherName?: string;
  extractedDob?: string;
  extractedExpiryDate?: string;
  missingFields: string[];
  suspiciousDocument?: boolean;
  croppedDocument?: boolean;
  blurScore?: "Low" | "Medium" | "High";
  tamperingRisk?: "Low" | "Medium" | "High";
  verifiedAt?: string;
  policyLinked?: boolean;
  linkedPolicyCount?: number;
  linkedPolicyNames?: string[];
  policyLinkageNote?: string;
}

export interface KycAttachmentPayload {
  mimeType: string;
  fileName: string;
  dataBase64: string;
}

export async function fetchKycStatus(): Promise<{ kyc: KycVerificationReport }> {
  return apiRequest("/api/kyc/status", { auth: true });
}

export async function deriveKycFromCnic(
  cnic?: string
): Promise<{ kyc: KycVerificationReport }> {
  return apiRequest("/api/kyc/derive", {
    method: "POST",
    body: JSON.stringify(cnic ? { cnic } : {}),
    auth: true,
  });
}

export async function verifyKycDocument(
  attachment: KycAttachmentPayload
): Promise<{ kyc: KycVerificationReport }> {
  return apiRequest("/api/kyc/verify", {
    method: "POST",
    body: JSON.stringify({ attachment }),
    auth: true,
  });
}
