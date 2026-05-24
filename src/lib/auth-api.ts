import { apiRequest } from "./api";
import type { AuthUser, CategoryItem, PublicPolicy, ScoredRecommendation } from "./types";
import type { PolicyQuestion } from "./types";

export function routeForRole(role: AuthUser["role"]): string {
  switch (role) {
    case "insurer":
      return "/provider-dashboard";
    case "admin":
      return "/employee-dashboard";
    case "superadmin":
      return "/admin-dashboard";
    default:
      return "/dashboard";
  }
}

export async function signup(body: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}): Promise<{ email: string; emailSent?: boolean | null; debugCode?: string }> {
  return apiRequest("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function login(body: { email: string; password: string }): Promise<{
  token: string;
  user: AuthUser;
}> {
  return apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function sendOtp(body: { email: string; purpose: "signup" | "reset" }): Promise<{
  email: string;
  emailSent?: boolean;
  debugCode?: string;
}> {
  return apiRequest("/api/auth/otp/send", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function verifyOtp(body: {
  email: string;
  purpose: "signup" | "reset";
  code: string;
}): Promise<{ token: string; user: AuthUser }> {
  return apiRequest("/api/auth/otp/verify", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getMe(): Promise<{ user: AuthUser }> {
  return apiRequest("/api/auth/me", { auth: true });
}

export async function updateMeProfile(body: {
  profilePhotoDataUrl?: string | null;
  notificationPreferences?: Partial<NonNullable<AuthUser["profile"]>["notificationPreferences"]>;
}): Promise<{ user: AuthUser }> {
  return apiRequest("/api/auth/me", {
    method: "PATCH",
    auth: true,
    body: JSON.stringify(body),
  });
}

export async function setRole(role: "user" | "insurer"): Promise<{ user: AuthUser }> {
  return apiRequest("/api/auth/role", {
    method: "PATCH",
    auth: true,
    body: JSON.stringify({ role }),
  });
}

export async function fetchCategories(): Promise<{ categories: CategoryItem[] }> {
  return apiRequest("/api/categories");
}

export async function fetchCategoryQuestions(category: string): Promise<{
  category: string;
  name: string;
  available: boolean;
  questions: PolicyQuestion[];
}> {
  return apiRequest(`/api/questions/${category}`);
}

export async function fetchRecommendations(body: {
  category: string;
  answers: Record<string, unknown>;
}): Promise<{
  category: string;
  available: boolean;
  recommendations: ScoredRecommendation[];
}> {
  return apiRequest("/api/recommend", {
    method: "POST",
    auth: true,
    body: JSON.stringify(body),
  });
}

export async function fetchFavorites(): Promise<{
  count: number;
  favorites: { favoriteId: string; savedAt: string; policy: PublicPolicy }[];
}> {
  return apiRequest("/api/favorites", { auth: true });
}

export async function addFavorite(policyId: string): Promise<{ favoriteId: string; policy: PublicPolicy }> {
  return apiRequest("/api/favorites", {
    method: "POST",
    auth: true,
    body: JSON.stringify({ policyId }),
  });
}

export async function removeFavorite(policyId: string): Promise<void> {
  await apiRequest(`/api/favorites/${policyId}`, {
    method: "DELETE",
    auth: true,
  });
}
