import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  addFavorite,
  fetchFavorites,
  removeFavorite,
} from "@/lib/auth-api";
import type { PublicPolicy } from "@/lib/types";
import { useAuth } from "./auth-context";

interface SavedPoliciesContextType {
  savedPolicies: PublicPolicy[];
  isLoading: boolean;
  refreshFavorites: () => Promise<void>;
  savePolicy: (policy: PublicPolicy) => Promise<void>;
  removeSavedPolicy: (policyId: string) => Promise<void>;
  isPolicySaved: (policyId: string) => boolean;
}

const SavedPoliciesContext = createContext<SavedPoliciesContextType | undefined>(
  undefined
);

export function SavedPoliciesProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [savedPolicies, setSavedPolicies] = useState<PublicPolicy[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshFavorites = useCallback(async () => {
    if (!isAuthenticated) {
      setSavedPolicies([]);
      return;
    }
    setIsLoading(true);
    try {
      const data = await fetchFavorites();
      setSavedPolicies(data.favorites.map((f) => f.policy));
    } catch {
      setSavedPolicies([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void refreshFavorites();
  }, [refreshFavorites]);

  const savePolicy = async (policy: PublicPolicy) => {
    await addFavorite(policy.id);
    setSavedPolicies((prev) =>
      prev.some((p) => p.id === policy.id) ? prev : [...prev, policy]
    );
  };

  const removeSavedPolicy = async (policyId: string) => {
    await removeFavorite(policyId);
    setSavedPolicies((prev) => prev.filter((p) => p.id !== policyId));
  };

  const isPolicySaved = (policyId: string) =>
    savedPolicies.some((p) => p.id === policyId);

  return (
    <SavedPoliciesContext.Provider
      value={{
        savedPolicies,
        isLoading,
        refreshFavorites,
        savePolicy,
        removeSavedPolicy,
        isPolicySaved,
      }}
    >
      {children}
    </SavedPoliciesContext.Provider>
  );
}

export function useSavedPolicies() {
  const context = useContext(SavedPoliciesContext);
  if (context === undefined) {
    throw new Error("useSavedPolicies must be used within a SavedPoliciesProvider");
  }
  return context;
}
