import { useEffect, useMemo, useState } from "react";
import { Link, Routes, Route } from "react-router";
import {
  LayoutDashboard, FileText, Users, TrendingUp, DollarSign,
  MessageSquare, Settings, Menu, X, LogOut, Search, Shield,
  Plus, Eye, Edit, Trash2, CheckCircle2, User
} from "lucide-react";
import { DarkModeToggle } from "../dark-mode-toggle";
import { motion } from "motion/react";
import { useLogout } from "../auth-context";
import { MessagesPanel } from "./messages-panel";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { formatPkr } from "@/lib/format";
import {
  fetchInsurerLeads,
  fetchInsurerPolicies,
  type InsurerLeadSummary,
  type InsurerPolicySummary,
} from "@/lib/insurer-api";

function titleCase(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function statusClass(status: string) {
  if (status === "approved" || status === "converted") return "bg-success/10 text-success";
  if (status === "rejected") return "bg-destructive/10 text-destructive";
  if (status === "pending" || status === "new") return "bg-warning/10 text-warning";
  return "bg-secondary/10 text-secondary";
}

export function ProviderDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const handleLogout = useLogout();
  const [policies, setPolicies] = useState<InsurerPolicySummary[]>([]);
  const [leads, setLeads] = useState<InsurerLeadSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      try {
        const [policyData, leadData] = await Promise.all([
          fetchInsurerPolicies(),
          fetchInsurerLeads(),
        ]);
        setPolicies(policyData.policies);
        setLeads(leadData.leads);
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Could not load provider dashboard");
      } finally {
        setLoading(false);
      }
    }

    void loadDashboard();
  }, []);

  const policyRows = useMemo(
    () =>
      policies.map((policy) => {
        const policyLeads = leads.filter((lead) => lead.policy?.id === policy.id);
        return {
          ...policy,
          categoryLabel: titleCase(policy.category),
          active: policyLeads.length,
          revenue: formatPkr(policyLeads.length * policy.premiumYearlyPkr),
          statusLabel: titleCase(policy.status),
        };
      }),
    [policies, leads]
  );

  const stats = [
    {
      label: "Approved Policies",
      value: String(policies.filter((policy) => policy.status === "approved").length),
      icon: <FileText className="w-5 h-5" />,
      trend: `${policies.length} total submitted`,
      color: "primary",
    },
    {
      label: "Projected Revenue",
      value: formatPkr(
        policyRows.reduce((sum, policy) => sum + policy.active * policy.premiumYearlyPkr, 0)
      ),
      icon: <DollarSign className="w-5 h-5" />,
      trend: "Based on converted leads",
      color: "success",
    },
    {
      label: "Customer Leads",
      value: String(leads.length),
      icon: <Users className="w-5 h-5" />,
      trend: `${leads.filter((lead) => lead.status === "new").length} new leads`,
      color: "secondary",
    },
    {
      label: "Pending Review",
      value: String(policies.filter((policy) => policy.status === "pending").length),
      icon: <CheckCircle2 className="w-5 h-5" />,
      trend: "Awaiting admin approval",
      color: "warning",
    },
  ];

  const menuItems = [
    { id: "dashboard", icon: <LayoutDashboard className="w-5 h-5" />, label: "Dashboard" },
    { id: "policies", icon: <FileText className="w-5 h-5" />, label: "My Policies" },
    { id: "leads", icon: <Users className="w-5 h-5" />, label: "Customer Leads" },
    { id: "analytics", icon: <TrendingUp className="w-5 h-5" />, label: "Analytics" },
    { id: "messages", icon: <MessageSquare className="w-5 h-5" />, label: "Messages" },
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
          <div className="mt-4 text-sm text-muted-foreground">Provider Dashboard</div>
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
                    <span className="px-2 py-0.5 bg-primary text-white text-xs rounded-full">
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
              <div className="font-medium">Jubilee Insurance</div>
              <div className="text-xs text-muted-foreground">Provider Account</div>
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
                  placeholder="Search policies, customers..."
                  className="pl-10 pr-4 py-2 w-80 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
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
                  <h1 className="text-3xl font-bold mb-2">Provider Dashboard</h1>
                  <p className="text-muted-foreground">Manage your insurance policies and customer relationships</p>
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

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-primary/10 to-secondary/10 border border-border rounded-2xl p-6">
              <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <button className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:shadow-lg transition-all">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <Plus className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-medium">Add New Policy</span>
                </button>
                <button className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:shadow-lg transition-all">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-medium">View Leads</span>
                </button>
                <button className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:shadow-lg transition-all">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-medium">View Analytics</span>
                </button>
              </div>
            </div>

            {/* Policies Table */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Your Policies</h3>
                <button className="px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Policy
                </button>
              </div>

              <div className="overflow-x-auto">
                {loading ? (
                  <div className="py-10 text-center text-muted-foreground">Loading provider data...</div>
                ) : policyRows.length === 0 ? (
                  <div className="py-10 text-center text-muted-foreground">
                    No policies submitted yet. Add your first policy to send it for admin approval.
                  </div>
                ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Policy Name</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Category</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Active Customers</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Revenue</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {policyRows.map((policy) => (
                      <tr key={policy.id} className="border-b border-border hover:bg-accent/50 transition-colors">
                        <td className="py-4 px-4 font-medium">{policy.name}</td>
                        <td className="py-4 px-4">
                          <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                            {policy.categoryLabel}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-muted-foreground">{policy.active}</td>
                        <td className="py-4 px-4 font-medium">{policy.revenue}</td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 w-fit ${statusClass(policy.status)}`}>
                            <CheckCircle2 className="w-3 h-3" /> {policy.statusLabel}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <button className="p-2 hover:bg-accent rounded-lg transition-colors">
                              <Eye className="w-4 h-4 text-muted-foreground" />
                            </button>
                            <button className="p-2 hover:bg-accent rounded-lg transition-colors">
                              <Edit className="w-4 h-4 text-muted-foreground" />
                            </button>
                            <button className="p-2 hover:bg-destructive/10 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                )}
              </div>
            </div>
              </>
            )}

            {activeTab === "policies" && (
              <div>
                <h1 className="text-3xl font-bold mb-6">My Policies</h1>
                <div className="grid md:grid-cols-2 gap-6">
                  {loading ? (
                    <div className="md:col-span-2 py-10 text-center text-muted-foreground">
                      Loading policies...
                    </div>
                  ) : policyRows.length === 0 ? (
                    <div className="md:col-span-2 py-10 text-center text-muted-foreground">
                      No policies found for this insurer account.
                    </div>
                  ) : policyRows.map((policy) => (
                    <div key={policy.id} className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-all">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-semibold mb-2">{policy.name}</h3>
                          <p className="text-sm text-muted-foreground">{policy.categoryLabel} Insurance</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm ${statusClass(policy.status)}`}>
                          {policy.statusLabel}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Active Customers</div>
                          <div className="text-2xl font-bold">{policy.active}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Revenue</div>
                          <div className="text-2xl font-bold">{policy.revenue}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="flex-1 px-4 py-2 bg-primary text-white rounded-xl hover:shadow-lg transition-all">
                          View Details
                        </button>
                        <button className="px-4 py-2 border border-border rounded-xl hover:bg-accent transition-all">
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "leads" && (
              <div>
                <h1 className="text-3xl font-bold mb-6">Customer Leads</h1>
                <div className="bg-card border border-border rounded-2xl p-6">
                  <div className="space-y-4">
                    {loading ? (
                      <div className="py-10 text-center text-muted-foreground">Loading leads...</div>
                    ) : leads.length === 0 ? (
                      <div className="py-10 text-center text-muted-foreground">
                        No leads yet. Completed purchases will appear here automatically.
                      </div>
                    ) : leads.map((lead) => (
                      <div key={lead.id} className="flex items-center gap-4 p-4 bg-accent/50 rounded-xl hover:bg-accent transition-all">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                          <User className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold">{lead.seeker?.fullName ?? "Policy seeker"}</div>
                          <div className="text-sm text-muted-foreground">{lead.seeker?.email ?? lead.summary}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground mb-1">
                            {lead.policy?.name ?? titleCase(lead.type)}
                          </div>
                          <div className="font-semibold">{titleCase(lead.policy?.category ?? lead.type)}</div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm ${statusClass(lead.status)}`}>
                          {titleCase(lead.status)}
                        </span>
                        <button className="px-4 py-2 bg-primary text-white rounded-xl hover:shadow-lg transition-all">
                          Contact
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "analytics" && (
              <div>
                <h1 className="text-3xl font-bold mb-6">Analytics</h1>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-card border border-border rounded-2xl p-6">
                    <h3 className="text-xl font-semibold mb-4">Revenue Trend</h3>
                    <div className="h-64 flex items-end gap-2">
                      {[40, 65, 55, 80, 70, 95, 85].map((height, index) => (
                        <div key={index} className="flex-1 flex flex-col items-center gap-2">
                          <div
                            className="w-full bg-gradient-to-t from-primary to-secondary rounded-t-lg transition-all hover:opacity-80"
                            style={{ height: `${height}%` }}
                          />
                          <span className="text-xs text-muted-foreground">
                            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-card border border-border rounded-2xl p-6">
                    <h3 className="text-xl font-semibold mb-4">Policy Distribution</h3>
                    <div className="space-y-4">
                      {[
                        { category: "Health", percentage: 35, count: 124 },
                        { category: "Auto", percentage: 28, count: 89 },
                        { category: "Life", percentage: 22, count: 67 },
                        { category: "Home", percentage: 15, count: 45 }
                      ].map((item, index) => (
                        <div key={index}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{item.category}</span>
                            <span className="text-sm text-muted-foreground">{item.count} policies</span>
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

            {activeTab === "messages" && (
              <MessagesPanel />
            )}

            {activeTab === "settings" && (
              <div>
                <h1 className="text-3xl font-bold mb-6">Settings</h1>
                <div className="grid gap-6">
                  <div className="bg-card border border-border rounded-2xl p-6">
                    <h3 className="text-xl font-semibold mb-4">Company Information</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm mb-2">Company Name</label>
                        <input type="text" value="Jubilee Insurance" className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50" />
                      </div>
                      <div>
                        <label className="block text-sm mb-2">Contact Email</label>
                        <input type="email" value="contact@jubilee.com" className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50" />
                      </div>
                      <div>
                        <label className="block text-sm mb-2">Phone Number</label>
                        <input type="tel" value="+92 21 111 111 111" className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50" />
                      </div>
                      <button className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl hover:shadow-lg transition-all">
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
