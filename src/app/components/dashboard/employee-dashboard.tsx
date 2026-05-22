import { useState } from "react";
import { Link } from "react-router";
import {
  LayoutDashboard, Users, Shield, FileText, CheckCircle2, XCircle,
  TrendingUp, Settings, Menu, X, LogOut, Search, Activity,
  Clock, AlertTriangle
} from "lucide-react";
import { DarkModeToggle } from "../dark-mode-toggle";
import { motion } from "motion/react";
import { useLogout } from "../auth-context";

export function EmployeeDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const handleLogout = useLogout();

  const stats = [
    { label: "Pending Approvals", value: "12", icon: <Clock className="w-5 h-5" />, trend: "4 new today", color: "warning" },
    { label: "Total Users", value: "52,487", icon: <Users className="w-5 h-5" />, trend: "+2,340 this month", color: "primary" },
    { label: "Active Policies", value: "8,924", icon: <FileText className="w-5 h-5" />, trend: "+456 this week", color: "success" },
    { label: "Support Tickets", value: "28", icon: <AlertTriangle className="w-5 h-5" />, trend: "18 resolved today", color: "secondary" }
  ];

  const pendingApprovals = [
    { id: 1, provider: "State Life Insurance", type: "New Provider", date: "2024-05-20", status: "Pending Review" },
    { id: 2, provider: "TPL Insurance", type: "Policy Update", date: "2024-05-20", status: "Pending Review" },
    { id: 3, provider: "IGI Insurance", type: "New Policy", date: "2024-05-19", status: "Pending Review" },
    { id: 4, provider: "United Insurance", type: "Provider Verification", date: "2024-05-19", status: "Pending Review" }
  ];

  const handleApprove = (id: number) => {
    alert(`Approval request ${id} has been approved!`);
  };

  const handleReject = (id: number) => {
    alert(`Approval request ${id} has been rejected!`);
  };

  const menuItems = [
    { id: "dashboard", icon: <LayoutDashboard className="w-5 h-5" />, label: "Dashboard" },
    { id: "approvals", icon: <CheckCircle2 className="w-5 h-5" />, label: "Approvals", badge: 12 },
    { id: "users", icon: <Users className="w-5 h-5" />, label: "User Management" },
    { id: "providers", icon: <Shield className="w-5 h-5" />, label: "Providers" },
    { id: "reports", icon: <TrendingUp className="w-5 h-5" />, label: "Reports" },
    { id: "activity", icon: <Activity className="w-5 h-5" />, label: "Activity Logs" },
    { id: "settings", icon: <Settings className="w-5 h-5" />, label: "Settings" }
  ];

  return (
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
          <div className="mt-4 text-sm text-muted-foreground">Employee Dashboard</div>
        </div>

        <div className="flex-1 overflow-y-auto py-6">
          <nav className="space-y-1 px-3">
            {menuItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                  }`}
                >
                  <span className={isActive ? "text-primary" : "text-muted-foreground"}>{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="px-2 py-0.5 bg-warning text-white text-xs rounded-full">
                      {item.badge}
                    </span>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="font-medium">Employee User</div>
              <div className="text-xs text-muted-foreground">Platform Manager</div>
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
                  placeholder="Search users, providers, requests..."
                  className="pl-10 pr-4 py-2 w-80 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-warning/10 text-warning rounded-xl">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">12 Pending Approvals</span>
              </div>
              <DarkModeToggle />
              <Link to="/">
                <button className="px-4 py-2 text-sm border border-border rounded-xl hover:bg-accent transition-all">
                  Exit Dashboard
                </button>
              </Link>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {activeTab === "dashboard" && (
              <>
                <div>
                  <h1 className="text-3xl font-bold mb-2">Employee Dashboard</h1>
                  <p className="text-muted-foreground">Manage platform operations and user requests</p>
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

                {/* Permission Notice */}
                <div className="bg-gradient-to-br from-warning/10 to-amber/10 border border-warning/30 rounded-2xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-warning to-amber flex items-center justify-center flex-shrink-0">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2">Limited Permissions</h3>
                      <p className="text-muted-foreground">
                        As an employee, you can approve/reject provider requests and manage users, but cannot delete data without super admin approval.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid md:grid-cols-3 gap-6">
                  <button
                    onClick={() => setActiveTab("approvals")}
                    className="flex items-center gap-3 p-6 bg-card border border-border rounded-2xl hover:shadow-lg transition-all text-left"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-warning to-amber flex items-center justify-center">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold mb-1">Review Approvals</div>
                      <div className="text-sm text-muted-foreground">12 pending requests</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab("users")}
                    className="flex items-center gap-3 p-6 bg-card border border-border rounded-2xl hover:shadow-lg transition-all text-left"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold mb-1">Manage Users</div>
                      <div className="text-sm text-muted-foreground">52K+ registered users</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab("providers")}
                    className="flex items-center gap-3 p-6 bg-card border border-border rounded-2xl hover:shadow-lg transition-all text-left"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold mb-1">View Providers</div>
                      <div className="text-sm text-muted-foreground">View all insurers</div>
                    </div>
                  </button>
                </div>
              </>
            )}

            {activeTab === "approvals" && (
              <div>
                <h1 className="text-3xl font-bold mb-6">Pending Approvals</h1>
                <div className="bg-card border border-border rounded-2xl p-6">
                  <div className="space-y-4">
                    {pendingApprovals.map((approval) => (
                      <div key={approval.id} className="flex items-center gap-4 p-4 bg-accent/30 rounded-xl">
                        <div className="flex-1">
                          <div className="font-semibold mb-1">{approval.provider}</div>
                          <div className="text-sm text-muted-foreground">{approval.type} • {approval.date}</div>
                        </div>
                        <span className="px-3 py-1 bg-warning/10 text-warning rounded-full text-sm">
                          {approval.status}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(approval.id)}
                            className="px-4 py-2 bg-success text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(approval.id)}
                            className="px-4 py-2 bg-destructive text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "users" && (
              <div>
                <h1 className="text-3xl font-bold mb-6">User Management</h1>
                <div className="bg-card border border-border rounded-2xl p-6">
                  <div className="mb-4 text-muted-foreground">
                    Note: You can view and manage users, but cannot delete accounts without super admin approval.
                  </div>
                  <div className="space-y-4">
                    {[
                      { name: "Ahmed Khan", email: "ahmed@example.com", role: "Policy Seeker", status: "Active", joined: "2024-05-15" },
                      { name: "Sara Malik", email: "sara@example.com", role: "Policy Seeker", status: "Active", joined: "2024-05-14" },
                      { name: "Usman Ali", email: "usman@example.com", role: "Policy Seeker", status: "Suspended", joined: "2024-05-10" }
                    ].map((user, index) => (
                      <div key={index} className="flex items-center gap-4 p-4 bg-accent/30 rounded-xl">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                          <Users className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold">{user.name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground mb-1">{user.role}</div>
                          <div className="text-xs text-muted-foreground">Joined {user.joined}</div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          user.status === "Active" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                        }`}>
                          {user.status}
                        </span>
                        <button className="px-4 py-2 border border-border rounded-xl hover:bg-accent transition-all">
                          View Details
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "providers" && (
              <div>
                <h1 className="text-3xl font-bold mb-6">Insurance Providers</h1>
                <div className="grid md:grid-cols-2 gap-6">
                  {[
                    { name: "Jubilee Life Insurance", policies: 248, customers: 12450, status: "Verified" },
                    { name: "EFU Life Assurance", policies: 189, customers: 9840, status: "Verified" },
                    { name: "Adamjee Insurance", policies: 156, customers: 7230, status: "Verified" },
                    { name: "State Life Insurance", policies: 203, customers: 11200, status: "Pending" }
                  ].map((provider, index) => (
                    <div key={index} className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-all">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-semibold mb-2">{provider.name}</h3>
                          <span className={`px-3 py-1 rounded-full text-sm ${
                            provider.status === "Verified"
                              ? "bg-success/10 text-success"
                              : "bg-warning/10 text-warning"
                          }`}>
                            {provider.status}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Policies</div>
                          <div className="text-2xl font-bold">{provider.policies}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Customers</div>
                          <div className="text-2xl font-bold">{provider.customers.toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "reports" && (
              <div>
                <h1 className="text-3xl font-bold mb-6">Reports</h1>
                <div className="text-center py-20 text-muted-foreground">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Generate and view platform reports</p>
                </div>
              </div>
            )}

            {activeTab === "activity" && (
              <div>
                <h1 className="text-3xl font-bold mb-6">Activity Logs</h1>
                <div className="text-center py-20 text-muted-foreground">
                  <Activity className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>View system activity logs and user actions</p>
                </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div>
                <h1 className="text-3xl font-bold mb-6">Settings</h1>
                <div className="text-center py-20 text-muted-foreground">
                  <Settings className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Manage your account settings</p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
