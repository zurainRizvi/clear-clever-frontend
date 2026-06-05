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
  markInsurerLeadSeen,
  type InsurerClaimSummary,
  type InsurerCustomerGroup,
  type InsurerLeadSummary,
  type InsurerPolicySummary,
  type InsurerProfile,
} from "@/lib/insurer-api";
import { buildPolicyRows, type PolicyRow } from "@/lib/provider-utils";
import { useAuth } from "../auth-context";

function withLeadsMarkedSeen(
  customers: InsurerCustomerGroup[],
  leads: InsurerLeadSummary[],
  leadIds: string[]
): { customers: InsurerCustomerGroup[]; leads: InsurerLeadSummary[] } {
  if (leadIds.length === 0) {
    return { customers, leads };
  }

  const idSet = new Set(leadIds);
  const seenAt = new Date().toISOString();

  const nextLeads = leads.map((lead) =>
    idSet.has(lead.id) ? { ...lead, isNew: false, seenAt } : lead
  );

  const nextCustomers = customers.map((customer) => {
    const nextCustomerLeads = customer.leads.map((lead) =>
      idSet.has(lead.id) ? { ...lead, isNew: false, seenAt } : lead
    );
    return {
      ...customer,
      leads: nextCustomerLeads,
      isNew: nextCustomerLeads.some((lead) => lead.isNew),
    };
  });

  return { customers: nextCustomers, leads: nextLeads };
}

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
  refresh: (options?: { silent?: boolean }) => Promise<void>;
  markLeadsSeen: (leadIds: string[]) => Promise<void>;
  setProfile: (profile: InsurerProfile) => void;
  setPolicies: (policies: InsurerPolicySummary[]) => void;
}

const ProviderContext = createContext<ProviderContextType | undefined>(undefined);

export function ProviderProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const canLoadDashboard =
    user?.role === "insurer" &&
    user.status === "active" &&
    user.insurerOnboarding?.hasProfile === true;
  const [profile, setProfile] = useState<InsurerProfile | null>(null);
  const [policies, setPolicies] = useState<InsurerPolicySummary[]>([]);
  const [leads, setLeads] = useState<InsurerLeadSummary[]>([]);
  const [customers, setCustomers] = useState<InsurerCustomerGroup[]>([]);
  const [claims, setClaims] = useState<InsurerClaimSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoading(true);
    }
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
      if (!options?.silent) {
        toast.error(err instanceof ApiError ? err.message : "Could not load provider dashboard");
      }
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  }, []);

  const markLeadsSeen = useCallback(async (leadIds: string[]) => {
    const uniqueIds = [...new Set(leadIds.filter(Boolean))];
    if (uniqueIds.length === 0) return;

    setCustomers((prevCustomers) =>
      withLeadsMarkedSeen(prevCustomers, [], uniqueIds).customers
    );
    setLeads((prevLeads) => withLeadsMarkedSeen([], prevLeads, uniqueIds).leads);

    await Promise.all(uniqueIds.map((id) => markInsurerLeadSeen(id).catch(() => undefined)));
    await refresh({ silent: true });
  }, [refresh]);

  useEffect(() => {
    if (!canLoadDashboard) {
      setLoading(false);
      return;
    }
    void refresh();
  }, [canLoadDashboard, refresh]);

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
      markLeadsSeen,
      setProfile,
      setPolicies,
    }),
    [profile, policies, leads, customers, claims, pendingClaimsCount, unseenNewLeadsCount, policyRows, loading, refresh, markLeadsSeen]
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
