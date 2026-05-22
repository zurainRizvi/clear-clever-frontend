import { createContext, useContext, useState, ReactNode } from "react";

interface Policy {
  id: number;
  name: string;
  provider: string;
  logo: string;
  premium: string;
  coverage: string;
  rating: number;
  category: string;
}

interface SavedPoliciesContextType {
  savedPolicies: Policy[];
  savePolicy: (policy: Policy) => void;
  removeSavedPolicy: (policyId: number) => void;
  isPolicySaved: (policyId: number) => boolean;
}

const SavedPoliciesContext = createContext<SavedPoliciesContextType | undefined>(undefined);

export function SavedPoliciesProvider({ children }: { children: ReactNode }) {
  const [savedPolicies, setSavedPolicies] = useState<Policy[]>([]);

  const savePolicy = (policy: Policy) => {
    setSavedPolicies((prev) => {
      if (prev.find(p => p.id === policy.id)) {
        return prev;
      }
      return [...prev, policy];
    });
  };

  const removeSavedPolicy = (policyId: number) => {
    setSavedPolicies((prev) => prev.filter(p => p.id !== policyId));
  };

  const isPolicySaved = (policyId: number) => {
    return savedPolicies.some(p => p.id === policyId);
  };

  return (
    <SavedPoliciesContext.Provider value={{ savedPolicies, savePolicy, removeSavedPolicy, isPolicySaved }}>
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
