import { useState } from "react";
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
import { useAuth, useLogout } from "../auth-context";
import { useMessages } from "./messages-context";
import { useAdmin } from "./admin-context";

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
  { path: "/admin-dashboard/messages", icon: MessageSquare, label: "Messages" },
  { path: "/admin-dashboard/fraud", icon: AlertTriangle, label: "Fraud Detection" },
  { path: "/admin-dashboard/analytics", icon: TrendingUp, label: "Analytics" },
  { path: "/admin-dashboard/audit", icon: FileText, label: "Audit Logs" },
  { path: "/admin-dashboard/health", icon: Activity, label: "System Health" },
  { path: "/admin-dashboard/settings", icon: Settings, label: "Settings" },
];

interface AdminPortalLayoutProps {
  variant: AdminPortalVariant;
}

export function AdminPortalLayout({ variant }: AdminPortalLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const handleLogout = useLogout();
  const { userName, userEmail } = useAuth();
  const { pendingPolicies } = useAdmin();
  const { unreadCount: unreadMessagesCount } = useMessages();

  const basePath = variant === "employee" ? "/employee-dashboard" : "/admin-dashboard";
  const menuItems = (variant === "employee" ? EMPLOYEE_MENU : SUPERADMIN_MENU).map((item) => {
    if (item.path.endsWith("/approvals")) {
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

  const portalLabel = variant === "employee" ? "Admin dashboard" : "Super admin control center";
  const profileLabel = variant === "employee" ? "Platform admin" : "Super admin";

  return (
    <div className="min-h-screen flex bg-background">
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 0 }}
        transition={{ duration: 0.3 }}
        className="bg-sidebar border-r border-sidebar-border flex flex-col overflow-hidden shrink-0"
      >
        <div className="w-[280px] flex flex-col h-full min-h-screen">
          <div className="p-6 border-b border-sidebar-border">
            <Link to={basePath} className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg font-[Poppins]">ClearClever</span>
            </Link>
            <div className="mt-3 text-sm text-muted-foreground">{portalLabel}</div>
          </div>

          <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`}
                  />
                  <span className="flex-1">{item.label}</span>
                  {item.path.endsWith("/messages") && unreadMessagesCount > 0 ? (
                    <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                      {unreadMessagesCount}
                    </span>
                  ) : null}
                  {item.badge ? (
                    <span className="px-2 py-0.5 bg-warning text-warning-foreground text-xs rounded-full">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-sidebar-accent/40">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{userName ?? profileLabel}</div>
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

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-accent rounded-xl"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              {!isHome ? (
                <Link to={basePath} className="text-sm text-primary hover:underline">
                  ← Back to dashboard
                </Link>
              ) : null}
            </div>

            <div className="flex items-center gap-3">
              {pendingPolicies.length > 0 ? (
                <Link
                  to={`${basePath}/approvals`}
                  className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-warning/10 text-warning rounded-xl text-sm font-medium"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {pendingPolicies.length} pending approval{pendingPolicies.length === 1 ? "" : "s"}
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

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
