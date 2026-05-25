import { BarChart3, FileText, Loader2, TrendingUp, Users } from "lucide-react";
import { formatPkr } from "@/lib/format";
import { categoryDistribution, leadsByStatus, statusClass } from "@/lib/provider-utils";
import { useProvider } from "./provider-context";

export function ProviderAnalyticsPage() {
  const { policies, leads, policyRows, loading } = useProvider();

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const categories = categoryDistribution(policies);
  const leadStatuses = leadsByStatus(leads);
  const maxCategory = Math.max(...categories.map((item) => item.count), 1);
  const maxLeadStatus = Math.max(...leadStatuses.map((item) => item.count), 1);
  const totalRevenue = policyRows.reduce((sum, row) => sum + row.revenuePkr, 0);
  const purchaseLeads = leads.filter((lead) => lead.type === "purchase").length;
  const approvedPolicies = policies.filter((p) => p.status === "approved").length;
  const conversion =
    leads.length > 0 ? Math.round((purchaseLeads / leads.length) * 100) : 0;

  const topPolicies = [...policyRows]
    .sort((a, b) => b.purchaseLeads - a.purchaseLeads)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-primary/25 bg-gradient-to-br from-primary/10 via-background to-background p-6">
        <h1 className="text-3xl font-bold mb-1 font-[Poppins]">Analytics</h1>
        <p className="text-muted-foreground max-w-2xl">
          Performance snapshot across your catalog, leads pipeline, and projected revenue
        </p>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <FileText className="w-5 h-5 text-primary" />
            <span className="text-2xl font-bold">{policies.length}</span>
          </div>
          <div className="text-sm font-medium">Total policies</div>
          <div className="text-xs text-muted-foreground mt-1">{approvedPolicies} approved live</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <Users className="w-5 h-5 text-primary" />
            <span className="text-2xl font-bold">{leads.length}</span>
          </div>
          <div className="text-sm font-medium">All leads</div>
          <div className="text-xs text-muted-foreground mt-1">{purchaseLeads} purchase conversions</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <TrendingUp className="w-5 h-5 text-success" />
            <span className="text-2xl font-bold text-success">{conversion}%</span>
          </div>
          <div className="text-sm font-medium">Lead conversion</div>
          <div className="text-xs text-muted-foreground mt-1">Purchases vs total leads</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <BarChart3 className="w-5 h-5 text-warning" />
            <span className="text-lg font-bold">{formatPkr(totalRevenue)}</span>
          </div>
          <div className="text-sm font-medium">Projected revenue</div>
          <div className="text-xs text-muted-foreground mt-1">From completed purchases</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-4">Policy distribution by category</h3>
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">No policies to chart yet.</p>
          ) : (
            <div className="space-y-4">
              {categories.map((item) => (
                <div key={item.category}>
                  <div className="flex items-center justify-between mb-2 text-sm">
                    <span className="font-medium">{item.category}</span>
                    <span className="text-muted-foreground">
                      {item.count} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all rounded-full"
                      style={{ width: `${(item.count / maxCategory) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-4">Leads by status</h3>
          {leadStatuses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No leads recorded yet.</p>
          ) : (
            <div className="h-56 flex items-end gap-3 pt-4">
              {leadStatuses.map((item) => (
                <div key={item.status} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className={`w-full rounded-t-lg transition-all ${statusClass(item.status).includes("success") ? "bg-success" : statusClass(item.status).includes("destructive") ? "bg-destructive" : statusClass(item.status).includes("warning") ? "bg-warning" : "bg-primary"}`}
                    style={{ height: `${Math.max((item.count / maxLeadStatus) * 100, 8)}%`, minHeight: 12 }}
                    title={`${item.count} leads`}
                  />
                  <span className="text-xs text-muted-foreground text-center capitalize">
                    {item.status.replace(/_/g, " ")}
                  </span>
                  <span className="text-xs font-semibold">{item.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-xl font-semibold mb-4">Top policies by purchase leads</h3>
        {topPolicies.length === 0 ? (
          <p className="text-sm text-muted-foreground">No purchase activity yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="pb-3 font-medium">Policy</th>
                  <th className="pb-3 font-medium">Category</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium text-right">Leads</th>
                  <th className="pb-3 font-medium text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topPolicies.map((row) => (
                  <tr key={row.id} className="border-b border-border/60 last:border-0">
                    <td className="py-3 font-medium">{row.name}</td>
                    <td className="py-3 text-muted-foreground">{row.categoryLabel}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${statusClass(row.status)}`}>
                        {row.statusLabel}
                      </span>
                    </td>
                    <td className="py-3 text-right">{row.purchaseLeads}</td>
                    <td className="py-3 text-right font-medium">{formatPkr(row.revenuePkr)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
