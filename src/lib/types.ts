export type UserRole = "user" | "insurer" | "admin" | "superadmin";

export type UserStatus = "pendingVerification" | "active" | "inactive";

export interface InsurerOnboardingHint {
  hasProfile: boolean;
  companyName?: string;
  slug?: string;
}

export type KycStatus = "none" | "partial" | "verified" | "failed";

export interface KycSummary {
  gender?: "male" | "female";
  province?: string;
  district?: string;
  isAdult?: boolean;
  cnicExpired?: boolean;
  identityVerified?: boolean;
}

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  cnicMasked?: string;
  hasCnic?: boolean;
  kycStatus?: KycStatus;
  kycScore?: number;
  kycSummary?: KycSummary;
  role: UserRole;
  status: UserStatus;
  insurerOnboarding?: InsurerOnboardingHint;
  profile?: {
    id: string;
    userId: string;
    profilePhotoDataUrl?: string;
    addressLine?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    notificationPreferences: {
      emailUpdates: boolean;
      claimAlerts: boolean;
      policyReminders: boolean;
    };
    createdAt: string;
    updatedAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export type CategorySlug = "home" | "auto" | "life" | "pet" | "others";

export interface CategoryItem {
  slug: CategorySlug;
  name: string;
  available: boolean;
}

export interface PolicyQuestion {
  id: string;
  text: string;
  type: "single" | "multi" | "number" | "text";
  options?: string[];
  required?: boolean;
}

export interface PublicInsurerSummary {
  id: string;
  slug: string;
  companyName: string;
}

export interface PublicPolicy {
  id: string;
  slug: string;
  name: string;
  category: Exclude<CategorySlug, "others">;
  description: string;
  premiumMonthlyPkr: number;
  premiumYearlyPkr: number;
  coverageSummary: string;
  features: string[];
  deductiblePkr: number;
  status: string;
  insurer: PublicInsurerSummary;
}

export type RankingMethod = "rules" | "hybrid";

export interface AnswerHighlight {
  questionText: string;
  userAnswer: string;
  policyAlignment: string;
}

export interface ScoredRecommendation {
  policy: PublicPolicy;
  score: number;
  matchReasons: string[];
  answerHighlights?: AnswerHighlight[];
  ruleScore?: number;
  mlConfidence?: number;
  mlRank?: number;
  rankingMethod?: RankingMethod;
  modelVersion?: string;
}
