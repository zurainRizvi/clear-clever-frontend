import { Loader2 } from "lucide-react";
import { formatPkr } from "@/lib/format";
import { categoryDistribution, leadsByStatus } from "@/lib/provider-utils";
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Analytics</h1>
        <p className="text-muted-foreground">Insights from your live policies and leads</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="text-sm text-muted-foreground mb-1">Total policies</div>
          <div className="text-3xl font-bold">{policies.length}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="text-sm text-muted-foreground mb-1">Purchase leads</div>
          <div className="text-3xl font-bold">{purchaseLeads}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="text-sm text-muted-foreground mb-1">Projected revenue</div>
          <div className="text-3xl font-bold">{formatPkr(totalRevenue)}</div>
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
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
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
            <div className="h-64 flex items-end gap-3">
              {leadStatuses.map((item) => (
                <div key={item.status} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full bg-primary/80 rounded-t-lg transition-all"
                    style={{ height: `${(item.count / maxLeadStatus) * 100}%`, minHeight: 8 }}
                    title={`${item.count} leads`}
                  />
                  <span className="text-xs text-muted-foreground text-center">{item.status}</span>
                  <span className="text-xs font-medium">{item.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
