import type { PublicPolicy } from "./types";

const STORAGE_KEY = "clearclever:purchase-draft";

export interface PurchaseDraft {
  policy: PublicPolicy;
  answers: Record<string, unknown>;
  category: string;
}

export function savePurchaseDraft(draft: PurchaseDraft): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    /* ignore quota errors */
  }
}

export function loadPurchaseDraft(): PurchaseDraft | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PurchaseDraft;
  } catch {
    return null;
  }
}

export function clearPurchaseDraft(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}
