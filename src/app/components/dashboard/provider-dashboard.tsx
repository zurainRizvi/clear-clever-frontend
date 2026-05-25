import { useCallback, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard,
  FileText,
  Users,
  ShieldCheck,
  TrendingUp,
  MessageSquare,
  HelpCircle,
  Settings,
  Menu,
  X,
  LogOut,
  Shield,
  type LucideIcon,
} from "lucide-react";
import { DarkModeToggle } from "../dark-mode-toggle";
import { motion } from "motion/react";
import { useAuth, useLogout } from "../auth-context";
import { MessagesProvider, useMessages } from "./messages-context";
import { ProviderProvider, useProvider } from "./provider-context";
import { ProviderPolicyFormDialog } from "./provider-policy-form";
import { fetchInsurerPolicy } from "@/lib/insurer-api";
import type { InsurerPolicyDetail } from "@/lib/insurer-api";
import { ApiError } from "@/lib/api";
import { toast } from "sonner";

const menuItems: { path: string; icon: LucideIcon; label: string }[] = [
  { path: "/provider-dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/provider-dashboard/policies", icon: FileText, label: "My Policies" },
  { path: "/provider-dashboard/leads", icon: Users, label: "Customer Leads" },
  { path: "/provider-dashboard/claims", icon: ShieldCheck, label: "Claims" },
  { path: "/provider-dashboard/analytics", icon: TrendingUp, label: "Analytics" },
  { path: "/provider-dashboard/messages", icon: MessageSquare, label: "Messages" },
  { path: "/provider-dashboard/support", icon: HelpCircle, label: "Support" },
  { path: "/provider-dashboard/settings", icon: Settings, label: "Settings" },
];

export function ProviderDashboard() {
  return (
    <ProviderProvider>
      <MessagesProvider>
        <ProviderDashboardInner />
      </MessagesProvider>
    </ProviderProvider>
  );
}

function ProviderDashboardInner() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<InsurerPolicyDetail | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const handleLogout = useLogout();
  const { profile, pendingClaimsCount, unseenNewLeadsCount, refresh } = useProvider();
  const { userEmail } = useAuth();
  const { unreadCount: unreadMessagesCount } = useMessages();

  const isHome =
    location.pathname === "/provider-dashboard" ||
    location.pathname === "/provider-dashboard/";

  const isActive = (path: string) => {
    if (path === "/provider-dashboard") {
      return isHome;
    }
    return location.pathname.startsWith(path);
  };

  const openCreatePolicy = () => {
    setEditingPolicy(null);
    setFormOpen(true);
  };

  const openEditPolicy = useCallback(async (policyId: string) => {
    try {
      const data = await fetchInsurerPolicy(policyId);
      setEditingPolicy(data.policy);
      setFormOpen(true);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not load policy");
    }
  }, []);

  const outletContext = {
    onAddPolicy: openCreatePolicy,
    onEditPolicy: (id: string) => void openEditPolicy(id),
  };

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
            <Link to="/provider-dashboard" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg font-[Poppins]">ClearClever</span>
            </Link>
            <div className="mt-3 text-sm text-muted-foreground">Provider dashboard</div>
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
                  <Icon className={`w-5 h-5 shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="flex-1">{item.label}</span>
                  {item.path === "/provider-dashboard/messages" && unreadMessagesCount > 0 ? (
                    <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                      {unreadMessagesCount}
                    </span>
                  ) : null}
                  {item.path === "/provider-dashboard/leads" && unseenNewLeadsCount > 0 ? (
                    <span className="w-2 h-2 rounded-full bg-destructive shrink-0" title={`${unseenNewLeadsCount} new leads`} />
                  ) : null}
                  {item.path === "/provider-dashboard/claims" && pendingClaimsCount > 0 ? (
                    <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                      {pendingClaimsCount}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-sidebar-accent/40">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{profile?.companyName ?? "Provider"}</div>
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
                <Link
                  to="/provider-dashboard"
                  className="text-sm text-primary hover:underline"
                >
                  ← Back to dashboard
                </Link>
              ) : null}
            </div>
            <div className="flex items-center gap-3">
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

        <main
          className={`flex-1 p-6 ${
            location.pathname.includes("/messages") || location.pathname.includes("/support")
              ? "flex flex-col min-h-0 overflow-hidden"
              : "overflow-y-auto"
          }`}
        >
          <div
            className={`${
              location.pathname.endsWith("/settings")
                ? "w-full max-w-none"
                : location.pathname.includes("/messages") || location.pathname.includes("/support")
                  ? "flex flex-col flex-1 min-h-0"
                  : "max-w-7xl mx-auto"
            }`}
          >
            <Outlet context={outletContext} />
          </div>
        </main>
      </div>

      <ProviderPolicyFormDialog
        open={formOpen}
        policy={editingPolicy}
        onClose={() => {
          setFormOpen(false);
          setEditingPolicy(null);
        }}
        onSaved={() => {
          void refresh();
          void navigate("/provider-dashboard/policies");
        }}
      />
    </div>
  );
}

export type ProviderOutletContext = {
  onAddPolicy: () => void;
  onEditPolicy: (policyId: string) => void;
};
