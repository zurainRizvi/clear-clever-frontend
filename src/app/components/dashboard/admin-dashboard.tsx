import { useState } from "react";
import { Link } from "react-router";
import {
  LayoutDashboard, Users, Shield, AlertTriangle, FileText,
  TrendingUp, Settings, Menu, X, LogOut, Search, Activity,
  CheckCircle2, XCircle, Clock, DollarSign, Trash2
} from "lucide-react";
import { DarkModeToggle } from "../dark-mode-toggle";
import { motion } from "motion/react";
import { useLogout } from "../auth-context";

export function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const handleLogout = useLogout();

  const stats = [
    { label: "Total Users", value: "52,487", icon: <Users className="w-5 h-5" />, trend: "+2,340 this month", color: "primary" },
    { label: "Active Policies", value: "8,924", icon: <FileText className="w-5 h-5" />, trend: "+456 this week", color: "success" },
    { label: "Total Revenue", value: "₨125M", icon: <DollarSign className="w-5 h-5" />, trend: "+18% vs last month", color: "secondary" },
    { label: "Security Alerts", value: "3", icon: <AlertTriangle className="w-5 h-5" />, trend: "2 resolved today", color: "warning" }
  ];

  const recentActivity = [
    { type: "user", action: "New user registered", user: "Ahmed Khan", time: "5 min ago", status: "success" },
    { type: "policy", action: "Policy approved", user: "Jubilee Insurance", time: "12 min ago", status: "success" },
    { type: "alert", action: "Fraud detection triggered", user: "System", time: "1 hour ago", status: "warning" },
    { type: "claim", action: "Claim processed", user: "Sara Malik", time: "2 hours ago", status: "success" },
    { type: "provider", action: "New provider onboarded", user: "TPL Insurance", time: "3 hours ago", status: "success" }
  ];

  const providers = [
    { name: "Jubilee Life Insurance", policies: 248, customers: 12450, revenue: "₨45M", status: "Active", verification: "Verified" },
    { name: "EFU Life Assurance", policies: 189, customers: 9840, revenue: "₨38M", status: "Active", verification: "Verified" },
    { name: "Adamjee Insurance", policies: 156, customers: 7230, revenue: "₨28M", status: "Active", verification: "Verified" },
    { name: "State Life Insurance", policies: 203, customers: 11200, revenue: "₨42M", status: "Active", verification: "Pending" }
  ];

  const menuItems = [
    { id: "dashboard", icon: <LayoutDashboard className="w-5 h-5" />, label: "Dashboard" },
    { id: "users", icon: <Users className="w-5 h-5" />, label: "User Management" },
    { id: "approvals", icon: <Shield className="w-5 h-5" />, label: "Provider Approvals", badge: 4 },
    { id: "fraud", icon: <AlertTriangle className="w-5 h-5" />, label: "Fraud Detection", badge: 3 },
    { id: "analytics", icon: <TrendingUp className="w-5 h-5" />, label: "Analytics" },
    { id: "audit", icon: <FileText className="w-5 h-5" />, label: "Audit Logs" },
    { id: "health", icon: <Activity className="w-5 h-5" />, label: "System Health" },
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
          <div className="mt-4 text-sm text-muted-foreground">Admin Control Center</div>
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
                    <span className="px-2 py-0.5 bg-destructive text-white text-xs rounded-full">
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
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="font-medium">Admin User</div>
              <div className="text-xs text-muted-foreground">Super Admin</div>
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
                  placeholder="Search users, providers, logs..."
                  className="pl-10 pr-4 py-2 w-80 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-success/10 text-success rounded-xl">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">All Systems Operational</span>
              </div>
              <DarkModeToggle />
              <Link to="/">
                <button className="px-4 py-2 text-sm border border-border rounded-xl hover:bg-accent transition-all">
                  Exit Admin
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
                  <h1 className="text-3xl font-bold mb-2">Super Admin Dashboard</h1>
                  <p className="text-muted-foreground">Monitor and manage the entire ClearClever platform</p>
                </div>

            {/* Super Admin Notice */}
            <div className="bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/30 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">Super Admin Access</h3>
                  <p className="text-muted-foreground mb-4">
                    You have full administrative privileges including the ability to delete users, providers, and data. Employee accounts require your approval for destructive actions.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-success/10 text-success rounded-full text-sm">✓ Full Data Access</span>
                    <span className="px-3 py-1 bg-success/10 text-success rounded-full text-sm">✓ Delete Permissions</span>
                    <span className="px-3 py-1 bg-success/10 text-success rounded-full text-sm">✓ System Configuration</span>
                    <span className="px-3 py-1 bg-success/10 text-success rounded-full text-sm">✓ Security Controls</span>
                  </div>
                </div>
              </div>
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

            {/* Security Alerts */}
            <div className="bg-gradient-to-br from-destructive/10 to-warning/10 border border-destructive/30 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-destructive to-warning flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">Active Security Alerts</h3>
                  <p className="text-muted-foreground mb-4">
                    3 security events require immediate attention. 2 fraud attempts detected and blocked automatically.
                  </p>
                  <button className="px-6 py-2.5 bg-gradient-to-r from-destructive to-warning text-white rounded-xl hover:shadow-lg transition-all">
                    View All Alerts
                  </button>
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 hover:bg-accent/50 rounded-xl transition-all">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        activity.status === "success" ? "bg-success/20 text-success" :
                        activity.status === "warning" ? "bg-warning/20 text-warning" :
                        "bg-muted"
                      }`}>
                        {activity.status === "success" && <CheckCircle2 className="w-4 h-4" />}
                        {activity.status === "warning" && <AlertTriangle className="w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{activity.action}</div>
                        <div className="text-xs text-muted-foreground">{activity.user}</div>
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* System Health */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="text-xl font-semibold mb-4">System Health</h3>
                <div className="space-y-4">
                  {[
                    { name: "API Server", status: "Operational", uptime: "99.9%", color: "success" },
                    { name: "Database", status: "Operational", uptime: "99.8%", color: "success" },
                    { name: "Payment Gateway", status: "Operational", uptime: "99.7%", color: "success" },
                    { name: "Email Service", status: "Degraded", uptime: "95.2%", color: "warning" }
                  ].map((service, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-accent/30 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          service.color === "success" ? "bg-success" : "bg-warning"
                        } animate-pulse`}></div>
                        <div>
                          <div className="font-medium text-sm">{service.name}</div>
                          <div className="text-xs text-muted-foreground">{service.status}</div>
                        </div>
                      </div>
                      <div className="text-sm font-medium">{service.uptime}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Insurance Providers */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-xl font-semibold mb-6">Insurance Providers</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Provider Name</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Policies</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Customers</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Revenue</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Verification</th>
                    </tr>
                  </thead>
                  <tbody>
                    {providers.map((provider, index) => (
                      <tr key={index} className="border-b border-border hover:bg-accent/50 transition-colors">
                        <td className="py-4 px-4 font-medium">{provider.name}</td>
                        <td className="py-4 px-4 text-muted-foreground">{provider.policies}</td>
                        <td className="py-4 px-4 text-muted-foreground">{provider.customers}</td>
                        <td className="py-4 px-4 font-medium">{provider.revenue}</td>
                        <td className="py-4 px-4">
                          <span className="px-3 py-1 bg-success/10 text-success rounded-full text-sm flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3" /> {provider.status}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 w-fit ${
                            provider.verification === "Verified"
                              ? "bg-success/10 text-success"
                              : "bg-warning/10 text-warning"
                          }`}>
                            {provider.verification === "Verified" ? (
                              <><CheckCircle2 className="w-3 h-3" /> Verified</>
                            ) : (
                              <><Clock className="w-3 h-3" /> Pending</>
                            )}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
              </>
            )}

            {activeTab === "users" && (
              <div>
                <h1 className="text-3xl font-bold mb-6">User Management</h1>
                <div className="bg-card border border-border rounded-2xl p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-muted-foreground">
                      Super Admin: Full control including user deletion
                    </p>
                    <button className="px-4 py-2 bg-primary text-white rounded-xl hover:shadow-lg transition-all">
                      Export Users
                    </button>
                  </div>
                  <div className="space-y-4">
                    {[
                      { name: "Ahmed Khan", email: "ahmed@example.com", role: "Policy Seeker", status: "Active", joined: "2024-05-15", id: 1 },
                      { name: "Sara Malik", email: "sara@example.com", role: "Policy Seeker", status: "Active", joined: "2024-05-14", id: 2 },
                      { name: "Usman Ali", email: "usman@example.com", role: "Policy Seeker", status: "Suspended", joined: "2024-05-10", id: 3 },
                      { name: "Jubilee Insurance", email: "contact@jubilee.com", role: "Provider", status: "Active", joined: "2024-04-20", id: 4 }
                    ].map((user) => (
                      <div key={user.id} className="flex items-center gap-4 p-4 bg-accent/30 rounded-xl">
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
                        <div className="flex gap-2">
                          <button className="px-4 py-2 border border-border rounded-xl hover:bg-accent transition-all">
                            View
                          </button>
                          <button className="px-4 py-2 bg-destructive text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2">
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "approvals" && (
              <div>
                <h1 className="text-3xl font-bold mb-6">Provider Approvals</h1>
                <div className="bg-card border border-border rounded-2xl p-6">
                  <div className="space-y-4">
                    {[
                      { id: 1, provider: "State Life Insurance", type: "New Provider Registration", date: "2024-05-20", status: "Pending" },
                      { id: 2, provider: "TPL Insurance", type: "Policy Update Request", date: "2024-05-20", status: "Pending" },
                      { id: 3, provider: "IGI Insurance", type: "New Policy Submission", date: "2024-05-19", status: "Pending" },
                      { id: 4, provider: "United Insurance", type: "Provider Verification", date: "2024-05-19", status: "Pending" }
                    ].map((approval) => (
                      <div key={approval.id} className="flex items-center gap-4 p-4 bg-accent/30 rounded-xl">
                        <div className="flex-1">
                          <div className="font-semibold mb-1">{approval.provider}</div>
                          <div className="text-sm text-muted-foreground">{approval.type} • {approval.date}</div>
                        </div>
                        <span className="px-3 py-1 bg-warning/10 text-warning rounded-full text-sm">
                          {approval.status}
                        </span>
                        <div className="flex gap-2">
                          <button className="px-4 py-2 bg-success text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            Approve
                          </button>
                          <button className="px-4 py-2 bg-destructive text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2">
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

            {activeTab === "fraud" && (
              <div>
                <h1 className="text-3xl font-bold mb-6">Fraud Detection</h1>
                <div className="bg-gradient-to-br from-destructive/10 to-warning/10 border border-destructive/30 rounded-2xl p-6 mb-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-destructive to-warning flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2">3 Active Fraud Alerts</h3>
                      <p className="text-muted-foreground">2 automatically blocked, 1 requires manual review</p>
                    </div>
                  </div>
                </div>
                <div className="bg-card border border-border rounded-2xl p-6">
                  <div className="space-y-4">
                    {[
                      { id: 1, type: "Multiple Account Creation", user: "suspicious@email.com", severity: "High", time: "10 min ago", status: "Blocked" },
                      { id: 2, type: "Unusual Claim Pattern", user: "Ahmed Khan", severity: "Medium", time: "1 hour ago", status: "Review" },
                      { id: 3, type: "Fake Documents Detected", user: "fake-user@test.com", severity: "Critical", time: "2 hours ago", status: "Blocked" }
                    ].map((alert) => (
                      <div key={alert.id} className="flex items-center gap-4 p-4 bg-accent/30 rounded-xl border-l-4 border-destructive">
                        <div className="flex-1">
                          <div className="font-semibold mb-1 flex items-center gap-2">
                            {alert.type}
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              alert.severity === "Critical" ? "bg-destructive text-white" :
                              alert.severity === "High" ? "bg-warning text-white" :
                              "bg-secondary/20 text-secondary"
                            }`}>
                              {alert.severity}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">{alert.user} • {alert.time}</div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          alert.status === "Blocked" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"
                        }`}>
                          {alert.status}
                        </span>
                        {alert.status === "Review" && (
                          <button className="px-4 py-2 bg-primary text-white rounded-xl hover:shadow-lg transition-all">
                            Investigate
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "analytics" && (
              <div>
                <h1 className="text-3xl font-bold mb-6">Platform Analytics</h1>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-card border border-border rounded-2xl p-6">
                    <h3 className="text-xl font-semibold mb-4">User Growth</h3>
                    <div className="h-64 flex items-end gap-2">
                      {[30, 45, 55, 70, 65, 85, 95].map((height, index) => (
                        <div key={index} className="flex-1 flex flex-col items-center gap-2">
                          <div
                            className="w-full bg-gradient-to-t from-primary to-secondary rounded-t-lg transition-all hover:opacity-80"
                            style={{ height: `${height}%` }}
                          />
                          <span className="text-xs text-muted-foreground">
                            {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"][index]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-card border border-border rounded-2xl p-6">
                    <h3 className="text-xl font-semibold mb-4">Revenue by Category</h3>
                    <div className="space-y-4">
                      {[
                        { category: "Health Insurance", percentage: 40, revenue: "₨50M" },
                        { category: "Auto Insurance", percentage: 30, revenue: "₨37.5M" },
                        { category: "Life Insurance", percentage: 20, revenue: "₨25M" },
                        { category: "Home Insurance", percentage: 10, revenue: "₨12.5M" }
                      ].map((item, index) => (
                        <div key={index}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{item.category}</span>
                            <span className="text-sm text-muted-foreground">{item.revenue}</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary to-secondary transition-all"
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "audit" && (
              <div>
                <h1 className="text-3xl font-bold mb-6">Audit Logs</h1>
                <div className="bg-card border border-border rounded-2xl p-6">
                  <div className="space-y-3">
                    {[
                      { action: "User Deleted", admin: "Super Admin", target: "john@example.com", time: "5 min ago", severity: "high" },
                      { action: "Provider Approved", admin: "Employee User", target: "State Life Insurance", time: "15 min ago", severity: "medium" },
                      { action: "Policy Updated", admin: "Super Admin", target: "Health Plan #1234", time: "1 hour ago", severity: "low" },
                      { action: "Settings Modified", admin: "Super Admin", target: "Security Settings", time: "2 hours ago", severity: "high" },
                      { action: "Fraud Alert Reviewed", admin: "Employee User", target: "Alert #5678", time: "3 hours ago", severity: "medium" }
                    ].map((log, index) => (
                      <div key={index} className={`p-4 rounded-xl border-l-4 ${
                        log.severity === "high" ? "bg-destructive/5 border-destructive" :
                        log.severity === "medium" ? "bg-warning/5 border-warning" :
                        "bg-muted/50 border-muted"
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-semibold mb-1">{log.action}</div>
                            <div className="text-sm text-muted-foreground">
                              By {log.admin} • Target: {log.target}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">{log.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "health" && (
              <div>
                <h1 className="text-3xl font-bold mb-6">System Health</h1>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-card border border-border rounded-2xl p-6">
                    <h3 className="text-xl font-semibold mb-4">Services Status</h3>
                    <div className="space-y-4">
                      {[
                        { name: "API Server", status: "Operational", uptime: "99.9%", color: "success" },
                        { name: "Database", status: "Operational", uptime: "99.8%", color: "success" },
                        { name: "Payment Gateway", status: "Operational", uptime: "99.7%", color: "success" },
                        { name: "Email Service", status: "Degraded", uptime: "95.2%", color: "warning" },
                        { name: "SMS Gateway", status: "Operational", uptime: "99.5%", color: "success" }
                      ].map((service, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-accent/30 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${
                              service.color === "success" ? "bg-success" : "bg-warning"
                            } animate-pulse`}></div>
                            <div>
                              <div className="font-medium text-sm">{service.name}</div>
                              <div className="text-xs text-muted-foreground">{service.status}</div>
                            </div>
                          </div>
                          <div className="text-sm font-medium">{service.uptime}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-card border border-border rounded-2xl p-6">
                    <h3 className="text-xl font-semibold mb-4">Performance Metrics</h3>
                    <div className="space-y-6">
                      {[
                        { metric: "Response Time", value: "45ms", status: "excellent" },
                        { metric: "CPU Usage", value: "32%", status: "good" },
                        { metric: "Memory Usage", value: "68%", status: "good" },
                        { metric: "Active Connections", value: "1,247", status: "excellent" }
                      ].map((item, index) => (
                        <div key={index}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{item.metric}</span>
                            <span className={`text-sm ${
                              item.status === "excellent" ? "text-success" : "text-primary"
                            }`}>{item.value}</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                item.status === "excellent" ? "bg-success" : "bg-primary"
                              } transition-all`}
                              style={{ width: item.status === "excellent" ? "90%" : "65%" }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div>
                <h1 className="text-3xl font-bold mb-6">Platform Settings</h1>
                <div className="grid gap-6">
                  <div className="bg-card border border-border rounded-2xl p-6">
                    <h3 className="text-xl font-semibold mb-4">General Settings</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm mb-2">Platform Name</label>
                        <input type="text" value="ClearClever" className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50" />
                      </div>
                      <div>
                        <label className="block text-sm mb-2">Support Email</label>
                        <input type="email" value="support@clearclever.com" className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50" />
                      </div>
                      <div>
                        <label className="block text-sm mb-2">Maximum Upload Size (MB)</label>
                        <input type="number" value="10" className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-card border border-border rounded-2xl p-6">
                    <h3 className="text-xl font-semibold mb-4">Security Settings</h3>
                    <div className="space-y-4">
                      <label className="flex items-center justify-between p-4 bg-accent/30 rounded-xl cursor-pointer">
                        <div>
                          <div className="font-medium">Two-Factor Authentication</div>
                          <div className="text-sm text-muted-foreground">Require 2FA for all admin accounts</div>
                        </div>
                        <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-border text-primary focus:ring-2 focus:ring-primary/50" />
                      </label>
                      <label className="flex items-center justify-between p-4 bg-accent/30 rounded-xl cursor-pointer">
                        <div>
                          <div className="font-medium">Fraud Detection</div>
                          <div className="text-sm text-muted-foreground">Enable AI-powered fraud detection</div>
                        </div>
                        <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-border text-primary focus:ring-2 focus:ring-primary/50" />
                      </label>
                      <label className="flex items-center justify-between p-4 bg-accent/30 rounded-xl cursor-pointer">
                        <div>
                          <div className="font-medium">Session Timeout</div>
                          <div className="text-sm text-muted-foreground">Auto-logout after 30 minutes of inactivity</div>
                        </div>
                        <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-border text-primary focus:ring-2 focus:ring-primary/50" />
                      </label>
                    </div>
                  </div>
                  <button className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl hover:shadow-lg transition-all">
                    Save All Settings
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
