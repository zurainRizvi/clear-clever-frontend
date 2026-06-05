import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import {
  fetchInsurerClaims,
  fetchInsurerLeads,
  fetchInsurerPolicies,
  fetchInsurerProfile,
  type InsurerClaimSummary,
  type InsurerCustomerGroup,
  type InsurerLeadSummary,
  type InsurerPolicySummary,
  type InsurerProfile,
} from "@/lib/insurer-api";
import { buildPolicyRows, type PolicyRow } from "@/lib/provider-utils";

interface ProviderContextType {
  profile: InsurerProfile | null;
  policies: InsurerPolicySummary[];
  leads: InsurerLeadSummary[];
  customers: InsurerCustomerGroup[];
  claims: InsurerClaimSummary[];
  pendingClaimsCount: number;
  unseenNewLeadsCount: number;
  policyRows: PolicyRow[];
  loading: boolean;
  refresh: () => Promise<void>;
  setProfile: (profile: InsurerProfile) => void;
  setPolicies: (policies: InsurerPolicySummary[]) => void;
}

const ProviderContext = createContext<ProviderContextType | undefined>(undefined);

export function ProviderProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<InsurerProfile | null>(null);
  const [policies, setPolicies] = useState<InsurerPolicySummary[]>([]);
  const [leads, setLeads] = useState<InsurerLeadSummary[]>([]);
  const [customers, setCustomers] = useState<InsurerCustomerGroup[]>([]);
  const [claims, setClaims] = useState<InsurerClaimSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [profileData, policyData, leadData, claimData] = await Promise.all([
        fetchInsurerProfile(),
        fetchInsurerPolicies(),
        fetchInsurerLeads(),
        fetchInsurerClaims(),
      ]);
      setProfile(profileData.profile);
      setPolicies(policyData.policies);
      setLeads(leadData.leads);
      setCustomers(leadData.customers ?? []);
      setClaims(claimData.claims);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not load provider dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const policyRows = useMemo(() => buildPolicyRows(policies, leads), [policies, leads]);
  const pendingClaimsCount = useMemo(
    () => claims.filter((claim) => claim.status === "submitted" || claim.status === "in_review").length,
    [claims]
  );
  const unseenNewLeadsCount = useMemo(
    () => customers.filter((customer) => customer.isNew).length,
    [customers]
  );

  const value = useMemo(
    () => ({
      profile,
      policies,
      leads,
      customers,
      claims,
      pendingClaimsCount,
      unseenNewLeadsCount,
      policyRows,
      loading,
      refresh,
      setProfile,
      setPolicies,
    }),
    [profile, policies, leads, customers, claims, pendingClaimsCount, unseenNewLeadsCount, policyRows, loading, refresh]
  );

  return <ProviderContext.Provider value={value}>{children}</ProviderContext.Provider>;
}

export function useProvider() {
  const context = useContext(ProviderContext);
  if (!context) {
    throw new Error("useProvider must be used within ProviderProvider");
  }
  return context;
}

export function useProviderOptional() {
  return useContext(ProviderContext);
}
