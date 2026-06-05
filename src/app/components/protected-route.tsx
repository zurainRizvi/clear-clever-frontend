import { Navigate, useLocation } from "react-router";
import { routeForInsurer, routeForRole } from "@/lib/auth-api";
import type { ReactNode } from "react";
import type { UserRole } from "@/lib/types";
import { useAuth } from "./auth-context";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm">Loading your session…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/signin"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <Navigate
        to={
          user.role === "insurer"
            ? routeForInsurer(user)
            : routeForRole(user.role, user)
        }
        replace
      />
    );
  }

  return <>{children}</>;
}
