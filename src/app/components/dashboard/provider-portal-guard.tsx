import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { routeForInsurer } from "@/lib/auth-api";
import { useAuth } from "../auth-context";

export function ProviderDashboardGuard({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm">Loading your session…</p>
      </div>
    );
  }

  if (!user || user.role !== "insurer") {
    return <Navigate to="/signin" replace />;
  }

  const target = routeForInsurer(user);
  if (target !== "/provider-dashboard") {
    return <Navigate to={target} replace />;
  }

  return <>{children}</>;
}
