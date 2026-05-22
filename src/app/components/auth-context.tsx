import { createContext, useContext, useState, ReactNode } from "react";
import { useNavigate } from "react-router";

interface AuthContextType {
  isAuthenticated: boolean;
  userRole: string | null;
  userName: string | null;
  userEmail: string | null;
  login: (role: string, name: string, email: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const login = (role: string, name: string, email: string) => {
    setIsAuthenticated(true);
    setUserRole(role);
    setUserName(name);
    setUserEmail(email);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    setUserName(null);
    setUserEmail(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userRole, userName, userEmail, login, logout }}>
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
