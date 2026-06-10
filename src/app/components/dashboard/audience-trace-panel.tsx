import { Link } from "react-router";
import type { InsurerAnalyticsPayload } from "@/lib/insurer-api";
import type { CSSProperties } from "react";
import { PROVIDER_THEME } from "./provider-portal-theme";

export function AudienceTracePanel({
  users,
  cardStyle,
}: {
  users: InsurerAnalyticsPayload["audienceUsers"];
  cardStyle?: CSSProperties;
}) {
  return (
    <section
      className="provider-portal-card border bg-card p-5 space-y-4 min-w-0"
      style={cardStyle}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-foreground">
            Customer trace
          </h2>
          <p className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5">
            Seekers matching your map filters — use this to follow up on questionnaire leads who
            have not purchased yet.
          </p>
        </div>
        <Link
          to="/provider-dashboard/leads"
          className="text-xs font-medium shrink-0"
          style={{ color: PROVIDER_THEME.primary }}
        >
          View all leads →
        </Link>
      </div>

      {users.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No seekers match the current filters in this period.
        </p>
      ) : (
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-sm min-w-[520px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground border-b border-border">
                <th className="pb-2 pr-3 font-semibold">Seeker</th>
                <th className="pb-2 pr-3 font-semibold">Category</th>
                <th className="pb-2 pr-3 font-semibold">Last stage</th>
                <th className="pb-2 font-semibold">Purchased</th>
              </tr>
            </thead>
            <tbody>
              {users.map((row) => (
                <tr key={row.userId} className="border-b border-border/60 last:border-0">
                  <td className="py-2.5 pr-3 font-medium">{row.name}</td>
                  <td className="py-2.5 pr-3 capitalize text-muted-foreground">{row.category}</td>
                  <td className="py-2.5 pr-3 text-muted-foreground">{row.lastStage}</td>
                  <td className="py-2.5">
                    <span
                      className={`inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        row.purchased
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                          : "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                      }`}
                    >
                      {row.purchased ? "Yes" : "No"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
