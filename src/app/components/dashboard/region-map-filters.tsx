import { Calendar as CalendarIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
  defaultProviderRange,
  formatProviderRangeLabel,
  matchesProviderPreset,
  providerRangeAllTime,
  providerRangeLastDays,
  type DateRangeValue,
} from "@/lib/provider-date-range";
import { PAKISTAN_REGION_META } from "./pakistan-region-meta";
import { ProviderDateRangePicker } from "./provider-date-range-picker";
import { PROVIDER_THEME } from "./provider-portal-theme";

export type RegionMapAudience = "all" | "purchasers" | "leads";

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
        active
          ? "bg-blue-600 text-white border-blue-600 dark:bg-blue-500 dark:border-blue-500"
          : "bg-white dark:bg-card text-slate-600 dark:text-muted-foreground border-slate-200 dark:border-border hover:border-slate-300 dark:hover:border-border hover:bg-slate-50 dark:hover:bg-accent"
      }`}
    >
      {children}
    </button>
  );
}

export function RegionMapFilters({
  range,
  onRangeChange,
  audience,
  onAudienceChange,
  region,
  onRegionChange,
}: {
  range: DateRangeValue;
  onRangeChange: (range: DateRangeValue) => void;
  audience: RegionMapAudience;
  onAudienceChange: (audience: RegionMapAudience) => void;
  region: string | null;
  onRegionChange: (region: string | null) => void;
}) {
  return (
    <div
      className="provider-portal-card border bg-white dark:bg-card p-4 space-y-4 min-w-0"
      style={{
        borderRadius: PROVIDER_THEME.radius,
        borderColor: PROVIDER_THEME.border,
        boxShadow: PROVIDER_THEME.shadow,
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-900 dark:text-foreground">Map filters</p>
          <p className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5">
            Choose a date range, audience, and region to explore customer activity.
          </p>
        </div>
        <ProviderDateRangePicker value={range} onChange={onRangeChange} />
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-muted-foreground">
          Date range
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-muted-foreground px-2 py-1 rounded-lg bg-slate-50 dark:bg-muted/30 border border-slate-100 dark:border-border">
            <CalendarIcon className="w-3.5 h-3.5" />
            {formatProviderRangeLabel(range)}
          </span>
          <FilterChip
            active={matchesProviderPreset(range, "7d")}
            onClick={() => onRangeChange(defaultProviderRange())}
          >
            Last 7 days
          </FilterChip>
          <FilterChip
            active={matchesProviderPreset(range, "30d")}
            onClick={() => onRangeChange(providerRangeLastDays(30))}
          >
            Last 30 days
          </FilterChip>
          <FilterChip
            active={matchesProviderPreset(range, "all")}
            onClick={() => onRangeChange(providerRangeAllTime())}
          >
            All time
          </FilterChip>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-muted-foreground">
          Audience
        </p>
        <div className="flex flex-wrap gap-2">
          <FilterChip active={audience === "all"} onClick={() => onAudienceChange("all")}>
            All users
          </FilterChip>
          <FilterChip
            active={audience === "purchasers"}
            onClick={() => onAudienceChange("purchasers")}
          >
            Policy purchasers
          </FilterChip>
          <FilterChip active={audience === "leads"} onClick={() => onAudienceChange("leads")}>
            Leads (no purchase)
          </FilterChip>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-muted-foreground">
          Activity region
        </p>
        <div className="flex flex-wrap gap-2">
          <FilterChip active={region === null} onClick={() => onRegionChange(null)}>
            All regions
          </FilterChip>
          {PAKISTAN_REGION_META.map((meta) => (
            <FilterChip
              key={meta.slug}
              active={region === meta.slug}
              onClick={() => onRegionChange(meta.slug)}
            >
              {meta.label}
            </FilterChip>
          ))}
        </div>
      </div>
    </div>
  );
}
