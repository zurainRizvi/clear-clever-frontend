import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router";
import {
  LayoutDashboard,
  FileText,
  Heart,
  ShoppingCart,
  Shield,
  Bell,
  MessageSquare,
  HelpCircle,
  Settings,
  Menu,
  X,
  LogOut,
  Search,
  User,
  type LucideIcon,
} from "lucide-react";
import { DarkModeToggle } from "../dark-mode-toggle";
import { motion } from "motion/react";
import { useAuth, useLogout } from "../auth-context";
import { Toaster } from "sonner";

interface MenuItem {
  icon: LucideIcon;
  label: string;
  path: string;
  badge?: number;
}

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: FileText, label: "Compare Policies", path: "/dashboard/compare" },
  { icon: Heart, label: "Saved Policies", path: "/dashboard/saved" },
  { icon: ShoppingCart, label: "My Purchases", path: "/dashboard/purchases" },
  { icon: Shield, label: "Claims", path: "/dashboard/claims" },
  { icon: Bell, label: "Notifications", path: "/dashboard/notifications", badge: 5 },
  { icon: MessageSquare, label: "Messages", path: "/dashboard/messages", badge: 2 },
  { icon: HelpCircle, label: "Support", path: "/dashboard/support" },
  { icon: Settings, label: "Settings", path: "/dashboard/settings" },
];

export function PolicySeekerDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const handleLogout = useLogout();
  const { userName, userEmail } = useAuth();

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard" || location.pathname === "/dashboard/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <Toaster position="top-right" richColors />
      <div className="min-h-screen flex bg-background">
        <motion.aside
          initial={false}
          animate={{ width: sidebarOpen ? 280 : 0 }}
          transition={{ duration: 0.3 }}
          className="bg-sidebar border-r border-sidebar-border flex flex-col overflow-hidden shrink-0"
        >
          <div className="w-[280px] flex flex-col h-full min-h-screen">
            <div className="p-6 border-b border-sidebar-border">
              <Link to="/dashboard" className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
                  <Shield className="w-6 h-6 text-primary-foreground" />
                </div>
                <span className="font-bold text-lg font-[Poppins]">ClearClever</span>
              </Link>
            </div>

            <nav className="flex-1 overflow-y-auto py-6 space-y-1 px-3">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link key={item.path} to={item.path} className="block">
                    <div
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 shrink-0 ${
                          active ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                        }`}
                      />
                      <span className="flex-1">{item.label}</span>
                      {item.badge ? (
                        <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                          {item.badge}
                        </span>
                      ) : null}
                    </div>
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-sidebar-border">
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{userName ?? "Policy seeker"}</div>
                  <div className="text-xs text-muted-foreground truncate">{userEmail ?? ""}</div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
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
                  className="p-2 hover:bg-accent rounded-xl transition-colors"
                >
                  {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
                <div className="relative hidden sm:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="search"
                    placeholder="Search policies, claims…"
                    className="pl-10 pr-4 py-2 w-64 lg:w-80 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  to="/dashboard/notifications"
                  className="relative p-2 hover:bg-accent rounded-xl transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
                </Link>
                <DarkModeToggle />
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}
