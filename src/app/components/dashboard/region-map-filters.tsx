import { Calendar as CalendarIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
  defaultProviderRange,
  formatProviderRangeLabel,
  providerRangeAllTime,
  providerRangeLastDays,
  type DateRangeValue,
} from "@/lib/provider-date-range";
import { PAKISTAN_REGION_META } from "./pakistan-region-meta";
import { ProviderDateRangePicker } from "./provider-date-range-picker";
import { PROVIDER_THEME } from "./provider-portal-theme";

export type RegionMapAudience = "all" | "purchasers";

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
          ? "bg-blue-600 text-white border-blue-600"
          : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
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
      className="provider-portal-card border bg-white p-4 space-y-4 min-w-0"
      style={{
        borderRadius: PROVIDER_THEME.radius,
        borderColor: PROVIDER_THEME.border,
        boxShadow: PROVIDER_THEME.shadow,
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-900">Map filters</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Choose a date range, audience, and region to explore customer activity.
          </p>
        </div>
        <ProviderDateRangePicker value={range} onChange={onRangeChange} />
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Date range
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 px-2 py-1 rounded-lg bg-slate-50 border border-slate-100">
            <CalendarIcon className="w-3.5 h-3.5" />
            {formatProviderRangeLabel(range)}
          </span>
          <FilterChip active={false} onClick={() => onRangeChange(defaultProviderRange())}>
            Last 7 days
          </FilterChip>
          <FilterChip active={false} onClick={() => onRangeChange(providerRangeLastDays(30))}>
            Last 30 days
          </FilterChip>
          <FilterChip active={false} onClick={() => onRangeChange(providerRangeAllTime())}>
            All time
          </FilterChip>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Audience</p>
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
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
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
