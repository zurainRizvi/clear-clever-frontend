import { Link, Outlet, useLocation } from "react-router";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  Shield,
  TrendingUp,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { DarkModeToggle } from "../dark-mode-toggle";
import { motion } from "motion/react";
import { PortalScrollNav } from "../ui/portal-scroll-nav";
import { PortalSidebarBackdrop } from "../ui/portal-sidebar-backdrop";
import { usePortalSidebar } from "../ui/use-portal-sidebar";
import { useAuth, useLogout } from "../auth-context";
import { useAdmin } from "./admin-context";
import { PortalProfileAvatar } from "./portal-profile-avatar";

export type AdminPortalVariant = "employee" | "superadmin";

interface MenuItem {
  path: string;
  icon: LucideIcon;
  label: string;
  badge?: number;
}

const EMPLOYEE_MENU: MenuItem[] = [
  { path: "/employee-dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/employee-dashboard/approvals", icon: CheckCircle2, label: "Approvals" },
  { path: "/employee-dashboard/users", icon: Users, label: "User Management" },
  { path: "/employee-dashboard/providers", icon: Shield, label: "Providers" },
  { path: "/employee-dashboard/messages", icon: MessageSquare, label: "Messages" },
  { path: "/employee-dashboard/reports", icon: TrendingUp, label: "Reports" },
  { path: "/employee-dashboard/activity", icon: Activity, label: "Activity Logs" },
  { path: "/employee-dashboard/settings", icon: Settings, label: "Settings" },
];

const SUPERADMIN_MENU: MenuItem[] = [
  { path: "/admin-dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/admin-dashboard/users", icon: Users, label: "User Management" },
  { path: "/admin-dashboard/approvals", icon: Shield, label: "Provider Approvals" },
  { path: "/admin-dashboard/policies", icon: CheckCircle2, label: "Policy Review" },
  { path: "/admin-dashboard/fraud", icon: AlertTriangle, label: "Fraud Detection" },
  { path: "/admin-dashboard/analytics", icon: TrendingUp, label: "Platform Analytics" },
  { path: "/admin-dashboard/audit", icon: FileText, label: "Audit Logs" },
  { path: "/admin-dashboard/health", icon: Activity, label: "System Health" },
  { path: "/admin-dashboard/settings", icon: Settings, label: "Settings" },
];

interface AdminPortalLayoutProps {
  variant: AdminPortalVariant;
}

export function AdminPortalLayout({ variant }: AdminPortalLayoutProps) {
  const { isNarrow, sidebarOpen, closeSidebar, openSidebar, sidebarMotionWidth } =
    usePortalSidebar(280);
  const location = useLocation();
  const handleLogout = useLogout();
  const { userName, userEmail } = useAuth();
  const { pendingPolicies, insurers } = useAdmin();

  const basePath = variant === "employee" ? "/employee-dashboard" : "/admin-dashboard";
  const pendingProviders = insurers.filter(
    (row) => row.user.status === "pendingVerification"
  ).length;
  const menuItems = (variant === "employee" ? EMPLOYEE_MENU : SUPERADMIN_MENU).map((item) => {
    if (variant === "employee" && item.path.endsWith("/approvals")) {
      return { ...item, badge: pendingPolicies.length || undefined };
    }
    if (variant === "superadmin" && item.path.endsWith("/approvals")) {
      return { ...item, badge: pendingProviders || undefined };
    }
    if (variant === "superadmin" && item.path.endsWith("/policies")) {
      return { ...item, badge: pendingPolicies.length || undefined };
    }
    return item;
  });

  const isHome =
    location.pathname === basePath || location.pathname === `${basePath}/`;

  const isActive = (path: string) => {
    if (path === basePath) return isHome;
    return location.pathname.startsWith(path);
  };

  const portalLabel = variant === "employee" ? "Admin dashboard" : "Super Admin";
  const profileLabel = variant === "employee" ? "Platform admin" : "Super Admin";
  const headerTitle = variant === "superadmin" && isHome ? "Super Admin" : null;
  const displayName =
    variant === "superadmin" ? "Super Admin" : (userName ?? profileLabel);
  const isSettingsRoute = location.pathname.endsWith("/settings");
  const isChatRoute = location.pathname.includes("/messages");
  const contentWidthClass = isSettingsRoute
    ? "w-full max-w-none"
    : isChatRoute
      ? "flex flex-col flex-1 min-h-0"
      : "max-w-7xl mx-auto";

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      <PortalSidebarBackdrop open={isNarrow && sidebarOpen} onClose={closeSidebar} />
      <motion.aside
        initial={false}
        animate={{ width: sidebarMotionWidth }}
        transition={{ duration: 0.3 }}
        className={`bg-sidebar border-r border-sidebar-border flex flex-col overflow-hidden shrink-0 ${
          isNarrow ? "fixed inset-y-0 left-0 z-50 h-screen shadow-2xl" : "sticky top-0 h-screen"
        }`}
      >
        <div className="w-[280px] flex flex-col h-full">
          <div className="p-6 border-b border-sidebar-border flex items-center justify-between gap-2">
            <Link to={basePath} className="flex items-center gap-2 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
                <Shield className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg font-[Poppins] truncate">ClearClever</span>
            </Link>
            {sidebarOpen ? (
              <button
                type="button"
                onClick={closeSidebar}
                className="p-2 hover:bg-sidebar-accent rounded-xl shrink-0"
                aria-label="Close navigation"
              >
                <X className="w-5 h-5" />
              </button>
            ) : null}
          </div>
          <div className="px-6 pb-0">
            <div className="text-sm text-muted-foreground">{portalLabel}</div>
          </div>

          <nav className="flex-1 overflow-hidden py-6 px-3 space-y-1 min-h-0">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => isNarrow && closeSidebar()}
                  className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    active
                      ? "text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                  }`}
                >
                  {active ? (
                    <motion.span
                      layoutId={`${variant}-sidebar-active`}
                      className="absolute inset-0 rounded-xl bg-sidebar-accent"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  ) : null}
                  <motion.span whileHover={{ scale: 1.1 }} className="relative z-[1] shrink-0">
                  <Icon
                    className={`w-5 h-5 ${active ? "text-primary" : "text-muted-foreground"}`}
                  />
                  </motion.span>
                  <span className="relative z-[1] flex-1">{item.label}</span>
                  {item.badge ? (
                    <span className="relative z-[1] px-2 py-0.5 bg-warning text-warning-foreground text-xs rounded-full">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-sidebar-border mt-auto shrink-0">
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-sidebar-accent/40">
              <PortalProfileAvatar />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{displayName}</div>
                <div className="text-xs text-muted-foreground truncate">{userEmail ?? ""}</div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-destructive shrink-0"
                title="Sign out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </motion.aside>

      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="flex items-center justify-between gap-2 px-4 py-3 sm:px-6 sm:py-4 min-w-0">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              {!sidebarOpen ? (
                <button
                  type="button"
                  onClick={openSidebar}
                  className="p-2 hover:bg-accent rounded-xl shrink-0"
                  aria-label="Open navigation"
                >
                  <Menu className="w-5 h-5" />
                </button>
              ) : null}
              {headerTitle ? (
                <h1 className="text-base sm:text-lg font-semibold font-[Poppins] truncate">{headerTitle}</h1>
              ) : !isHome ? (
                <Link to={basePath} className="text-sm text-primary hover:underline truncate">
                  ← Back
                </Link>
              ) : null}
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {variant === "superadmin" && pendingProviders > 0 ? (
                <Link
                  to={`${basePath}/approvals`}
                  className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-warning/10 text-warning rounded-xl text-sm font-medium"
                >
                  <Shield className="w-4 h-4" />
                  {pendingProviders} provider{pendingProviders === 1 ? "" : "s"} awaiting approval
                </Link>
              ) : null}
              {pendingPolicies.length > 0 ? (
                <Link
                  to={`${basePath}${variant === "superadmin" ? "/policies" : "/approvals"}`}
                  className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-warning/10 text-warning rounded-xl text-sm font-medium"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {pendingPolicies.length} pending polic{pendingPolicies.length === 1 ? "y" : "ies"}
                </Link>
              ) : null}
              <DarkModeToggle />
              <Link
                to="/"
                className="px-4 py-2 text-sm border border-border rounded-xl hover:bg-accent hidden sm:inline-flex"
              >
                Exit dashboard
              </Link>
            </div>
          </div>
        </header>

        <PortalScrollNav
          items={menuItems}
          isActive={isActive}
          theme="admin"
          layoutId={`${variant}-top-nav-active`}
        />

        <main
          className={`flex-1 min-w-0 p-4 sm:p-6 ${
            isChatRoute ? "flex flex-col min-h-0 overflow-hidden" : "overflow-y-auto overflow-x-hidden"
          }`}
        >
          <div className={contentWidthClass}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
