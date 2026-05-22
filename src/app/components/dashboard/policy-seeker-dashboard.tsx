import { useState } from "react";
import { Link, Outlet, useLocation, Routes, Route } from "react-router";
import {
  LayoutDashboard, FileText, Heart, ShoppingCart, Shield, Bell,
  MessageSquare, HelpCircle, Settings, Menu, X, LogOut, Search,
  TrendingUp, AlertCircle, CheckCircle2, Clock, User
} from "lucide-react";
import { DarkModeToggle } from "../dark-mode-toggle";
import { motion } from "motion/react";
import { ComparePolicies } from "./compare-policies";
import { PurchaseFlow } from "./purchase-flow";
import { SavedPolicies } from "./saved-policies";
import { useLogout } from "../auth-context";
import { Toaster } from "sonner";

export function PolicySeekerDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const handleLogout = useLogout();

  const menuItems = [
    { icon: <LayoutDashboard className="w-5 h-5" />, label: "Dashboard", path: "/dashboard" },
    { icon: <FileText className="w-5 h-5" />, label: "Compare Policies", path: "/dashboard/compare" },
    { icon: <Heart className="w-5 h-5" />, label: "Saved Policies", path: "/dashboard/saved" },
    { icon: <ShoppingCart className="w-5 h-5" />, label: "My Purchases", path: "/dashboard/purchases" },
    { icon: <Shield className="w-5 h-5" />, label: "Claims", path: "/dashboard/claims" },
    { icon: <Bell className="w-5 h-5" />, label: "Notifications", path: "/dashboard/notifications", badge: 5 },
    { icon: <MessageSquare className="w-5 h-5" />, label: "Messages", path: "/dashboard/messages", badge: 2 },
    { icon: <HelpCircle className="w-5 h-5" />, label: "Support", path: "/dashboard/support" },
    { icon: <Settings className="w-5 h-5" />, label: "Settings", path: "/dashboard/settings" }
  ];

  const stats = [
    { label: "Active Policies", value: "3", icon: <Shield className="w-5 h-5" />, trend: "+1 this month", color: "primary" },
    { label: "Total Savings", value: "₨45,000", icon: <TrendingUp className="w-5 h-5" />, trend: "+15% vs market", color: "success" },
    { label: "Pending Claims", value: "1", icon: <Clock className="w-5 h-5" />, trend: "In review", color: "warning" },
    { label: "Insurance Score", value: "85/100", icon: <CheckCircle2 className="w-5 h-5" />, trend: "Excellent", color: "primary" }
  ];

  const isDashboardHome = location.pathname === "/dashboard";

  return (
    <>
      <Toaster position="top-right" richColors />
      <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 0 }}
        transition={{ duration: 0.3 }}
        className="bg-sidebar border-r border-sidebar-border flex flex-col overflow-hidden"
      >
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              ClearClever
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-6">
          <nav className="space-y-1 px-3">
            {menuItems.map((item, index) => {
              const isActive = location.pathname === item.path;
              return (
                <Link key={index} to={item.path}>
                  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                  }`}>
                    <span className={isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary"}>
                      {item.icon}
                    </span>
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="px-2 py-0.5 bg-primary text-white text-xs rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="font-medium">John Doe</div>
              <div className="text-xs text-muted-foreground">john@example.com</div>
            </div>
            <button
              onClick={handleLogout}
              className="text-muted-foreground hover:text-destructive transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-accent rounded-xl transition-colors"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Search policies, claims..."
                  className="pl-10 pr-4 py-2 w-80 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="relative p-2 hover:bg-accent rounded-xl transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
              </button>
              <DarkModeToggle />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route index element={
              <div className="max-w-7xl mx-auto space-y-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">Welcome back, John!</h1>
                <p className="text-muted-foreground">Here's an overview of your insurance portfolio</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-${stat.color}/20 to-${stat.color}/10 flex items-center justify-center text-${stat.color}`}>
                        {stat.icon}
                      </div>
                    </div>
                    <div className="text-3xl font-bold mb-1">{stat.value}</div>
                    <div className="text-sm text-muted-foreground mb-2">{stat.label}</div>
                    <div className="text-xs text-success">{stat.trend}</div>
                  </motion.div>
                ))}
              </div>

              {/* AI Recommendations */}
              <div className="bg-gradient-to-br from-primary/10 to-secondary/10 border border-border rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">AI Recommendation</h3>
                    <p className="text-muted-foreground mb-4">
                      Based on your current coverage, we recommend adding Life Insurance to protect your family's future.
                      You could save up to ₨30,000 annually with our recommended policy.
                    </p>
                    <Link to="/dashboard/compare">
                      <button className="px-6 py-2.5 bg-gradient-to-r from-primary to-secondary text-white rounded-xl hover:shadow-lg transition-all">
                        Explore Recommendations
                      </button>
                    </Link>
                  </div>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Active Policies */}
                <div className="bg-card border border-border rounded-2xl p-6">
                  <h3 className="text-xl font-semibold mb-4">Active Policies</h3>
                  <div className="space-y-4">
                    {[
                      { name: "Health Insurance - Family Plan", provider: "Jubilee Life", status: "Active", amount: "₨25,000/year", icon: "🏥" },
                      { name: "Auto Insurance - Comprehensive", provider: "EFU Insurance", status: "Active", amount: "₨18,000/year", icon: "🚗" },
                      { name: "Home Insurance - Premium", provider: "Adamjee Insurance", status: "Active", amount: "₨35,000/year", icon: "🏠" }
                    ].map((policy, index) => (
                      <div key={index} className="flex items-center gap-4 p-4 bg-accent/50 rounded-xl hover:bg-accent transition-all">
                        <div className="text-3xl">{policy.icon}</div>
                        <div className="flex-1">
                          <div className="font-medium">{policy.name}</div>
                          <div className="text-sm text-muted-foreground">{policy.provider}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{policy.amount}</div>
                          <div className="text-xs text-success flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> {policy.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-card border border-border rounded-2xl p-6">
                  <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
                  <div className="space-y-4">
                    {[
                      { action: "Claim approved", detail: "Auto Insurance - Accident claim", time: "2 hours ago", icon: <CheckCircle2 className="w-5 h-5 text-success" /> },
                      { action: "Policy renewed", detail: "Health Insurance - Family Plan", time: "1 day ago", icon: <Shield className="w-5 h-5 text-primary" /> },
                      { action: "Message received", detail: "Response from Jubilee Life", time: "3 days ago", icon: <MessageSquare className="w-5 h-5 text-secondary" /> },
                      { action: "Document uploaded", detail: "Proof of purchase for claim #1234", time: "1 week ago", icon: <FileText className="w-5 h-5 text-muted-foreground" /> }
                    ].map((activity, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 hover:bg-accent/50 rounded-xl transition-all">
                        <div className="mt-0.5">{activity.icon}</div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{activity.action}</div>
                          <div className="text-xs text-muted-foreground">{activity.detail}</div>
                        </div>
                        <div className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            } />
            <Route path="compare" element={<ComparePolicies />} />
            <Route path="purchase" element={<PurchaseFlow />} />
            <Route path="saved" element={<SavedPolicies />} />
            <Route path="purchases" element={<div className="text-center py-20"><h2 className="text-2xl font-bold mb-2">My Purchases</h2><p className="text-muted-foreground">Your purchased policies will appear here</p></div>} />
            <Route path="claims" element={<div className="text-center py-20"><h2 className="text-2xl font-bold mb-2">Claims</h2><p className="text-muted-foreground">Your insurance claims will appear here</p></div>} />
            <Route path="notifications" element={<div className="text-center py-20"><h2 className="text-2xl font-bold mb-2">Notifications</h2><p className="text-muted-foreground">Your notifications will appear here</p></div>} />
            <Route path="messages" element={<div className="text-center py-20"><h2 className="text-2xl font-bold mb-2">Messages</h2><p className="text-muted-foreground">Your messages will appear here</p></div>} />
            <Route path="support" element={<div className="text-center py-20"><h2 className="text-2xl font-bold mb-2">Support</h2><p className="text-muted-foreground">Contact support for assistance</p></div>} />
            <Route path="settings" element={<div className="text-center py-20"><h2 className="text-2xl font-bold mb-2">Settings</h2><p className="text-muted-foreground">Manage your account settings</p></div>} />
          </Routes>
        </main>
      </div>
      </div>
    </>
  );
}
