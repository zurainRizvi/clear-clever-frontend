import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router";
import { getMe } from "@/lib/auth-api";
import { routeForInsurer, routeForRole } from "@/lib/auth-api";
import {
  clearAuthSession,
  getStoredUser,
  getToken,
  setAuthSession,
} from "@/lib/auth-storage";
import type { AuthUser } from "@/lib/types";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  userRole: string | null;
  userName: string | null;
  userEmail: string | null;
  setSession: (token: string, user: AuthUser) => void;
  refreshUser: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const hydrate = useCallback(async () => {
    const token = getToken();
    const stored = getStoredUser();
    if (!token || !stored) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    setUser(stored);
    try {
      const { user: fresh } = await getMe();
      setUser(fresh);
      setAuthSession(token, fresh);
    } catch {
      clearAuthSession();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const setSession = useCallback((token: string, nextUser: AuthUser) => {
    setAuthSession(token, nextUser);
    setUser(nextUser);
  }, []);

  const refreshUser = useCallback(async () => {
    const { user: fresh } = await getMe();
    const token = getToken();
    if (token) setAuthSession(token, fresh);
    setUser(fresh);
  }, []);

  const logout = useCallback(() => {
    clearAuthSession();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user && !!getToken(),
        isLoading,
        user,
        userRole: user?.role ?? null,
        userName: user?.fullName ?? null,
        userEmail: user?.email ?? null,
        setSession,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function useLogout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return () => {
    logout();
    navigate("/");
  };
}

export function useAuthRedirect() {
  const navigate = useNavigate();
  const { setSession } = useAuth();

  return (token: string, nextUser: AuthUser, overridePath?: string) => {
    setSession(token, nextUser);
    navigate(
      overridePath ??
        (nextUser.role === "insurer"
          ? routeForInsurer(nextUser)
          : routeForRole(nextUser.role, nextUser))
    );
  };
}
