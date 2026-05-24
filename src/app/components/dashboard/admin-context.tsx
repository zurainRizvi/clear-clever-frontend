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
  approveInsurer as approveInsurerApi,
  approvePolicy as approvePolicyApi,
  deleteInsurerPermanently as deleteInsurerApi,
  fetchAdminAnalytics,
  fetchAdminInsurers,
  fetchAdminUsers,
  fetchPendingPolicies,
  rejectInsurer as rejectInsurerApi,
  rejectPolicy as rejectPolicyApi,
  revokeInsurer as revokeInsurerApi,
  type AdminAnalytics,
  type AdminInsurerRecord,
  type PendingPolicySummary,
} from "@/lib/admin-api";
import {
  buildInsurerRows,
  buildProviderSummaries,
  buildRecentActivity,
  type ActivityItem,
  type InsurerRow,
  type ProviderSummary,
} from "@/lib/admin-utils";
import type { AuthUser } from "@/lib/types";

interface AdminContextType {
  pendingPolicies: PendingPolicySummary[];
  users: AuthUser[];
  insurers: AdminInsurerRecord[];
  analytics: AdminAnalytics | null;
  providerSummaries: ProviderSummary[];
  insurerRows: InsurerRow[];
  recentActivity: ActivityItem[];
  loading: boolean;
  refresh: () => Promise<void>;
  approvePolicy: (id: string) => Promise<void>;
  rejectPolicy: (id: string, reason?: string) => Promise<void>;
  approveInsurer: (id: string) => Promise<void>;
  rejectInsurer: (id: string, reason?: string) => Promise<void>;
  revokeInsurer: (id: string) => Promise<void>;
  deleteInsurer: (id: string) => Promise<void>;
  setUsers: (users: AuthUser[]) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [pendingPolicies, setPendingPolicies] = useState<PendingPolicySummary[]>([]);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [insurers, setInsurers] = useState<AdminInsurerRecord[]>([]);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [pendingData, userData, insurerData, analyticsData] = await Promise.all([
        fetchPendingPolicies(),
        fetchAdminUsers(),
        fetchAdminInsurers(),
        fetchAdminAnalytics(),
      ]);
      setPendingPolicies(pendingData.policies);
      setUsers(userData.users);
      setInsurers(insurerData.insurers);
      setAnalytics(analyticsData);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not load admin dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const approvePolicy = useCallback(
    async (id: string) => {
      try {
        await approvePolicyApi(id);
        setPendingPolicies((prev) => prev.filter((policy) => policy.id !== id));
        toast.success("Policy approved");
        await refresh();
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Could not approve policy");
      }
    },
    [refresh]
  );

  const rejectPolicy = useCallback(
    async (id: string, reason?: string) => {
      try {
        await rejectPolicyApi(id, reason);
        setPendingPolicies((prev) => prev.filter((policy) => policy.id !== id));
        toast.success("Policy rejected");
        await refresh();
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Could not reject policy");
      }
    },
    [refresh]
  );

  const providerSummaries = useMemo(
    () => buildProviderSummaries(pendingPolicies),
    [pendingPolicies]
  );
  const approveInsurer = useCallback(
    async (id: string) => {
      try {
        await approveInsurerApi(id);
        toast.success("Provider approved");
        await refresh();
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Could not approve provider");
      }
    },
    [refresh]
  );

  const rejectInsurer = useCallback(
    async (id: string, reason?: string) => {
      try {
        await rejectInsurerApi(id, reason);
        toast.success("Provider application rejected");
        await refresh();
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Could not reject provider");
      }
    },
    [refresh]
  );

  const revokeInsurer = useCallback(
    async (id: string) => {
      try {
        await revokeInsurerApi(id);
        toast.success("Provider removed from platform");
        await refresh();
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Could not remove provider");
      }
    },
    [refresh]
  );

  const deleteInsurer = useCallback(
    async (id: string) => {
      try {
        await deleteInsurerApi(id);
        toast.success("Provider permanently deleted");
        await refresh();
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Could not delete provider");
      }
    },
    [refresh]
  );

  const insurerRows = useMemo(() => buildInsurerRows(insurers), [insurers]);
  const recentActivity = useMemo(
    () => buildRecentActivity(users, pendingPolicies),
    [users, pendingPolicies]
  );

  const value = useMemo(
    () => ({
      pendingPolicies,
      users,
      insurers,
      analytics,
      providerSummaries,
      insurerRows,
      recentActivity,
      loading,
      refresh,
      approvePolicy,
      rejectPolicy,
      approveInsurer,
      rejectInsurer,
      revokeInsurer,
      deleteInsurer,
      setUsers,
    }),
    [
      pendingPolicies,
      users,
      insurers,
      analytics,
      providerSummaries,
      insurerRows,
      recentActivity,
      loading,
      refresh,
      approvePolicy,
      rejectPolicy,
      approveInsurer,
      rejectInsurer,
      revokeInsurer,
      deleteInsurer,
    ]
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within AdminProvider");
  }
  return context;
}
