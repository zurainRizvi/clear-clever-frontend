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
  approvePolicy as approvePolicyApi,
  fetchAdminAnalytics,
  fetchAdminUsers,
  fetchPendingPolicies,
  rejectPolicy as rejectPolicyApi,
  type AdminAnalytics,
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
  analytics: AdminAnalytics | null;
  providerSummaries: ProviderSummary[];
  insurerRows: InsurerRow[];
  recentActivity: ActivityItem[];
  loading: boolean;
  refresh: () => Promise<void>;
  approvePolicy: (id: string) => Promise<void>;
  rejectPolicy: (id: string, reason?: string) => Promise<void>;
  setUsers: (users: AuthUser[]) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [pendingPolicies, setPendingPolicies] = useState<PendingPolicySummary[]>([]);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [pendingData, userData, analyticsData] = await Promise.all([
        fetchPendingPolicies(),
        fetchAdminUsers(),
        fetchAdminAnalytics(),
      ]);
      setPendingPolicies(pendingData.policies);
      setUsers(userData.users);
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
  const insurerRows = useMemo(
    () => buildInsurerRows(users, pendingPolicies),
    [users, pendingPolicies]
  );
  const recentActivity = useMemo(
    () => buildRecentActivity(users, pendingPolicies),
    [users, pendingPolicies]
  );

  const value = useMemo(
    () => ({
      pendingPolicies,
      users,
      analytics,
      providerSummaries,
      insurerRows,
      recentActivity,
      loading,
      refresh,
      approvePolicy,
      rejectPolicy,
      setUsers,
    }),
    [
      pendingPolicies,
      users,
      analytics,
      providerSummaries,
      insurerRows,
      recentActivity,
      loading,
      refresh,
      approvePolicy,
      rejectPolicy,
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
