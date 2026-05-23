import type { AuthUser } from "./types";

const TOKEN_KEY = "cc_token";
const USER_KEY = "cc_user";
const PENDING_EMAIL_KEY = "cc_pending_email";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthSession(token: string, user: AuthUser): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function clearAuthSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function setPendingEmail(email: string): void {
  sessionStorage.setItem(PENDING_EMAIL_KEY, email);
}

export function getPendingEmail(): string | null {
  return sessionStorage.getItem(PENDING_EMAIL_KEY);
}

export function clearPendingEmail(): void {
  sessionStorage.removeItem(PENDING_EMAIL_KEY);
}
