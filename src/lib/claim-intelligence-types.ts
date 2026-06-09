export type ClaimIntelligenceAnalysisType =
  | "vehicle"
  | "identity"
  | "policy"
  | "medical"
  | "general";

export type DamageSeverity = "minor" | "moderate" | "severe";
export type RepairComplexity = "low" | "medium" | "high";
export type ConsistencyLevel = "high" | "medium" | "low";
export type InsurerRecommendation =
  | "standard_review"
  | "manual_review"
  | "escalate_review";

export interface ClaimIntelligenceReport {
  reportVersion: "1";
  analyzedAt: string;
  analysisTypes: ClaimIntelligenceAnalysisType[];
  attachmentSummary: { count: number; mimeTypes: string[] };
  vehicle?: {
    severity: DamageSeverity;
    severityConfidence: number;
    damagedParts: string[];
    repairComplexity: RepairComplexity;
    estimatedCostMinPkr: number;
    estimatedCostMaxPkr: number;
  };
  identity?: {
    documentType: string;
    extractedName?: string;
    extractedCnic?: string;
    expiryStatus?: "valid" | "expired" | "unknown";
    matchesName: boolean;
    matchesCnic: boolean;
    matchesUserProfile: boolean;
    profileMatchReason: string;
  };
  policyDoc?: {
    policyNumber?: string;
    insurer?: string;
    policyType?: string;
    expiryDate?: string;
    matchesLinkedPolicy: boolean;
    coverageAppearsValid: boolean;
    validationNotes: string[];
  };
  medical?: {
    diagnosis?: string;
    hospital?: string;
    treatmentType?: string;
    complexity: "low" | "medium" | "high";
  };
  consistency: { level: ConsistencyLevel; reason: string };
  suspiciousFlags: string[];
  claimReadiness: {
    score: number;
    documentsComplete: boolean;
    photosClear: boolean;
    informationConsistent: boolean;
    noMajorIssues: boolean;
  };
  executiveSummary: string;
  insurerRecommendation: InsurerRecommendation;
  modelVersion: string;
}

export interface ClaimAttachmentPayload {
  mimeType: string;
  fileName: string;
  dataBase64: string;
}
