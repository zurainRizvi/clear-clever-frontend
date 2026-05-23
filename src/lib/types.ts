export type UserRole = "user" | "insurer" | "admin" | "superadmin";

export type UserStatus = "pendingVerification" | "active" | "inactive";

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
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
  type: "single" | "number" | "text";
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

export interface ScoredRecommendation {
  policy: PublicPolicy;
  score: number;
  matchReasons: string[];
}
