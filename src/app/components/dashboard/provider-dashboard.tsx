import { useCallback, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard,
  FileText,
  Users,
  ShieldCheck,
  LineChart,
  MessageSquare,
  LifeBuoy,
  Settings2,
  Menu,
  X,
  LogOut,
  Shield,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { motion } from "motion/react";
import { useAuth, useLogout } from "../auth-context";
import { MessagesProvider, useMessages } from "./messages-context";
import { ProviderProvider, useProvider } from "./provider-context";
import { ProviderPolicyFormDialog } from "./provider-policy-form";
import { fetchInsurerPolicy } from "@/lib/insurer-api";
import type { InsurerPolicyDetail } from "@/lib/insurer-api";
import { ApiError } from "@/lib/api";
import { toast } from "sonner";

interface MenuItemDef {
  path: string;
  icon: LucideIcon;
  label: string;
  badgeKey?: "claims" | "messages";
}

const menuItems: MenuItemDef[] = [
  { path: "/provider-dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/provider-dashboard/policies", icon: FileText, label: "My Policies" },
  { path: "/provider-dashboard/leads", icon: Users, label: "Leads & Customers" },
  { path: "/provider-dashboard/claims", icon: ShieldCheck, label: "Claims", badgeKey: "claims" },
  { path: "/provider-dashboard/analytics", icon: LineChart, label: "Analytics" },
  { path: "/provider-dashboard/messages", icon: MessageSquare, label: "Messages", badgeKey: "messages" },
  { path: "/provider-dashboard/support", icon: LifeBuoy, label: "Support" },
  { path: "/provider-dashboard/settings", icon: Settings2, label: "Settings" },
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
  const { profile, pendingClaimsCount, refresh } = useProvider();
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

  const badgeCount = (key?: MenuItemDef["badgeKey"]) => {
    if (!key) return 0;
    if (key === "claims") return pendingClaimsCount;
    if (key === "messages") return unreadMessagesCount;
    return 0;
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
    <div
      className="min-h-screen flex bg-background"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 260 : 0 }}
        transition={{ duration: 0.3 }}
        className="sticky top-0 h-screen bg-card border-r border-border flex flex-col overflow-hidden shrink-0"
      >
        <div className="w-[260px] flex flex-col h-full">
          <div className="p-5 border-b border-border">
            <Link to="/provider-dashboard" className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: "#2563EB" }}
              >
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-base text-foreground block leading-tight">
                  ClearClever
                </span>
                <span className="text-xs text-muted-foreground">Provider Portal</span>
              </div>
            </Link>
          </div>

          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5 min-h-0">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path, item.label);
              const count = badgeCount(item.badgeKey);
              return (
                <Link
                  key={`${item.path}-${item.label}`}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                    active
                      ? "font-medium"
                      : "text-muted-foreground hover:bg-accent"
                  }`}
                  style={
                    active
                      ? { backgroundColor: "#EFF6FF", color: "#2563EB" }
                      : undefined
                  }
                >
                  <Icon
                    className={`w-[18px] h-[18px] shrink-0 ${active ? "" : "text-muted-foreground"}`}
                    style={active ? { color: "#2563EB" } : undefined}
                  />
                  <span className="flex-1">{item.label}</span>
                  {count > 0 ? (
                    <span
                      className="min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full text-[11px] font-bold text-white"
                      style={{ backgroundColor: "#2563EB" }}
                    >
                      {count > 9 ? "9+" : count}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="p-3 border-t border-border mt-auto shrink-0">
            <div
              className="flex items-center gap-3 px-3 py-3 rounded-2xl border border-border cursor-pointer hover:bg-accent transition-colors bg-card"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: "#EFF6FF" }}
              >
                <Shield className="w-5 h-5" style={{ color: "#2563EB" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-foreground truncate">
                  {profile?.companyName ?? "Provider"}
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full mt-0.5">
                  Verified
                </span>
              </div>
              <div className="flex flex-col items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-muted-foreground hover:text-destructive p-1"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground truncate px-3 mt-1">{userEmail ?? ""}</p>
          </div>
        </div>
      </motion.aside>

      <div className="flex-1 flex flex-col min-w-0">
        {!isHome ? (
          <header
            className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur-md"
            style={{ borderColor: "#E5E7EB" }}
          >
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 hover:bg-slate-100 rounded-xl text-slate-600"
                >
                  {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
                <Link
                  to="/provider-dashboard"
                  className="text-sm font-medium hover:underline"
                  style={{ color: "#2563EB" }}
                >
                  ← Dashboard
                </Link>
              </div>
            </div>
          </header>
        ) : (
          <div className="px-6 pt-4 flex items-center">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-white rounded-xl text-slate-600 border"
              style={{ borderColor: "#E5E7EB" }}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        )}

        <main
          className={`flex-1 min-w-0 overflow-x-hidden ${
            location.pathname.includes("/messages") || location.pathname.includes("/support")
              ? "flex flex-col min-h-0 overflow-hidden p-4 sm:p-5"
              : "overflow-y-auto p-4 sm:p-5"
          }`}
        >
          <div
            className={`w-full max-w-full min-w-0 ${
              location.pathname.includes("/messages") || location.pathname.includes("/support")
                ? "flex flex-col flex-1 min-h-0"
                : ""
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
